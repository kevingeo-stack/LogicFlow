import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { Diagram } from '../types';
import { LocalDB } from './LocalDB';
import { normalizeTimestamp } from '../utils/timeUtils';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  user: User | null;
}

export class FirestoreSync {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private localDB: LocalDB;
  private currentUser: User | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: Date | null = null;
  private syncError: string | null = null;

  constructor(localDB: LocalDB) {
    this.localDB = localDB;
    this.initFirebase();
    this.setupNetworkListeners();
  }

  private initFirebase() {
    try {
      const apiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
      const authDomain = (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN;
      const projectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
      const storageBucket = (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET;
      const messagingSenderId = (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID;
      const appId = (import.meta as any).env?.VITE_FIREBASE_APP_ID;

      const isMissing = !apiKey || !projectId || !authDomain || !appId;
      const isPlaceholder = apiKey === 'demo-api-key' || apiKey === 'YOUR_API_KEY' || projectId === 'flowgenius-demo';

      if (isMissing || isPlaceholder) {
        console.warn('[FirestoreSync] Firebase config is missing or using placeholders. Cloud Sync and Auth are safely disabled. LocalDB will continue to work normally.');
        return;
      }

      const firebaseConfig = {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      };

      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.notify();
        if (user && this.isOnline) {
          this.syncBidirectional().catch(() => {});
        }
      });
    } catch (err: any) {
      console.warn('[FirestoreSync] Firebase initialized in local offline fallback mode:', err?.message || err);
    }
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncError = null;
        this.notify();
        if (this.currentUser) {
           this.syncBidirectional().catch(() => {});
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      error: this.syncError,
      user: this.currentUser,
    };
  }

  public async signInWithGoogle(): Promise<User | null> {
    if (!this.app || !this.auth) {
      this.syncError = 'Firebase configuration is missing or invalid. Please configure .env.local with valid credentials.';
      this.notify();
      throw new Error(this.syncError);
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(this.auth, provider);
      this.currentUser = cred.user;
      this.notify();
      await this.syncBidirectional();
      return cred.user;
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
         return null;
      }
      this.syncError = error?.message || 'Authentication failed';
      this.notify();
      throw error;
    }
  }

  public async signOutUser(): Promise<void> {
    if (!this.auth) return;
    await signOut(this.auth);
    this.currentUser = null;
    this.notify();
  }

  /**
   * Performs a Last-Write-Wins (LWW) bidirectional sync.
   */
  public async syncBidirectional(): Promise<void> {
    if (!this.isOnline || !this.db || !this.currentUser) return;

    this.isSyncing = true;
    this.syncError = null;
    this.notify();

    try {
      const userId = this.currentUser.uid;
      const remoteCol = collection(this.db, 'users', userId, 'diagrams');
      
      const [remoteSnapshot, localDiagrams] = await Promise.all([
        getDocs(remoteCol),
        this.localDB.getAllDiagramsForSync()
      ]);

      const remoteDiagrams: Diagram[] = [];
      remoteSnapshot.forEach(doc => {
        remoteDiagrams.push(doc.data() as Diagram);
      });

      const localMap = new Map(localDiagrams.map(d => [d.id, d]));
      const remoteMap = new Map(remoteDiagrams.map(d => [d.id, d]));
      
      const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

      for (const id of allIds) {
        const local = localMap.get(id);
        const remote = remoteMap.get(id);

        if (local && !remote) {
          // Push to cloud
          await this.pushSingleProject(local);
        } else if (!local && remote) {
          // Pull from cloud
          await this.localDB.saveDiagram(remote);
        } else if (local && remote) {
          // Both exist, LWW
          const localTime = normalizeTimestamp(local.updatedAt);
          const remoteTime = normalizeTimestamp(remote.updatedAt);

          if (localTime > remoteTime) {
            await this.pushSingleProject(local);
          } else if (remoteTime > localTime) {
            await this.localDB.saveDiagram(remote);
          }
          // If equal, do nothing
        }
      }

      this.lastSyncedAt = new Date();
      
      // Need to notify AppController to reload its lists if something was pulled
      // Since AppController doesn't automatically listen to LocalDB changes,
      // it handles this by re-fetching when this method completes during login.
    } catch (err: any) {
      console.warn('[FirestoreSync] Cloud sync error:', err?.message || err);
      this.syncError = 'Sync failed. Retry when online.';
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Pushes a single project to Firestore (used after explicit save).
   */
  public async pushSingleProject(diagram: Diagram): Promise<void> {
    if (!this.isOnline || !this.db || !this.currentUser) return;

    try {
      const userId = this.currentUser.uid;
      const docRef = doc(this.db, 'users', userId, 'diagrams', diagram.id);
      await setDoc(docRef, {
        ...diagram,
        userId, // ensure userId is on the document
      }, { merge: true });
      
      this.lastSyncedAt = new Date();
      this.notify();
    } catch (err: any) {
      console.warn('[FirestoreSync] Failed to push project:', err);
      throw err;
    }
  }

  /**
   * Optional: Exposes remote deletion if really needed, but Phase 3C uses tombstones.
   * This is kept for compatibility if needed.
   */
  public async deleteFromRemote(diagramId: string): Promise<void> {
    if (!this.isOnline || !this.db || !this.currentUser) return;
    try {
      const userId = this.currentUser.uid;
      const docRef = doc(this.db, 'users', userId, 'diagrams', diagramId);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.warn('[FirestoreSync] Delete remote error:', err);
    }
  }
}
