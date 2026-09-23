import { Diagram, AcademicSettings } from '../types';

const DB_NAME = 'flowgenius_db';
const DB_VERSION = 1;
const STORE_DIAGRAMS = 'diagrams';
const STORE_SETTINGS = 'settings';

export const DEFAULT_ACADEMIC_SETTINGS: AcademicSettings = {
  studentName: 'Alex Rivera Santiago',
  studentId: 'A01783921',
  subject: 'CS-302: Algorithms & Complexity',
  professor: 'Dr. Evelyn Vance',
  templateStyle: 'ieee',
  autoTimestamp: true,
  appLanguage: 'es',
  diagramLanguage: 'en',
};

export const INITIAL_DIAGRAMS: Diagram[] = [
  {
    id: 'diag-bst-01',
    title: 'Binary Search Tree Traversal',
    filename: 'BST_InOrder.py',
    language: 'python',
    sourceCode: `def inorder_traversal(root):\n    if root is not None:\n        # Traverse left subtree\n        inorder_traversal(root.left)\n        # Visit current node\n        print(root.val)\n        # Traverse right subtree\n        inorder_traversal(root.right)\n    return True`,
    mermaidSyntax: `flowchart TD
  classDef startEnd fill:#06b6d4,stroke:#38bdf8,stroke-width:2px,color:#060e20,font-weight:bold;
  classDef decision fill:#171f33,stroke:#38bdf8,stroke-width:2px,color:#7bd0ff;
  classDef process fill:#222a3d,stroke:#334155,stroke-width:1px,color:#dae2fd;
  classDef term fill:#93000a,stroke:#ffb4ab,stroke-width:1px,color:#ffdad6;

  Start(["Start: inorder_traversal(root)"]):::startEnd
  Check{"root != None ?"}:::decision
  TraverseLeft["Recurse: inorder_traversal(root.left)"]:::process
  Visit["Print root.val"]:::process
  TraverseRight["Recurse: inorder_traversal(root.right)"]:::process
  EndDone(["return True"]):::startEnd

  Start --> Check
  Check -- True --> TraverseLeft
  TraverseLeft --> Visit
  Visit --> TraverseRight
  TraverseRight --> EndDone
  Check -- False --> EndDone`,
    complexity: 'O(n) Time · O(h) Space',
    statusBadge: 'STABLE',
    nodeCount: 6,
    edgeCount: 6,
    category: 'Python Algorithms',
    pipelineNodes: [
      { icon: 'input', label: 'Start', type: 'start' },
      { icon: 'call_split', label: 'root ≠ nil', type: 'decision' },
      { icon: 'refresh', label: 'Recurse()', type: 'process' }
    ],
    createdAt: 'Oct 24, 2024 · 14:32',
    updatedAt: 'Oct 24, 2024 · 14:32',
    synced: true,
  },
  {
    id: 'diag-dijkstra-02',
    title: 'Dijkstra Shortest Path Matrix',
    filename: 'Dijkstra_Graph.cpp',
    language: 'cpp',
    sourceCode: `void dijkstra(int startNode, int V, vector<vector<int>>& graph) {\n    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;\n    vector<int> dist(V, INF);\n    dist[startNode] = 0;\n    pq.push({0, startNode});\n    while (!pq.empty()) {\n        auto [d, u] = pq.top();\n        pq.pop();\n        if (d > dist[u]) continue;\n        for (auto& edge : adj[u]) {\n            if (dist[u] + edge.w < dist[edge.v]) {\n                dist[edge.v] = dist[u] + edge.w;\n                pq.push({dist[edge.v], edge.v});\n            }\n        }\n    }\n}`,
    mermaidSyntax: `flowchart TD
  classDef startEnd fill:#06b6d4,stroke:#38bdf8,stroke-width:2px,color:#060e20,font-weight:bold;
  classDef decision fill:#171f33,stroke:#6366f1,stroke-width:2px,color:#c0c1ff;
  classDef process fill:#222a3d,stroke:#334155,stroke-width:1px,color:#dae2fd;

  Start(["Start: dijkstra(startNode)"]):::startEnd
  Init["Init dist[V] = INF, dist[start] = 0, push PQ"]:::process
  Loop{"!pq.empty() ?"}:::decision
  PopNode["Pop top {d, u} from Min-Heap"]:::process
  CheckRelax{"dist[u] + w < dist[v] ?"}:::decision
  Relax["dist[v] = dist[u] + w, push {dist[v], v}"]:::process
  EndNode(["Complete: Shortest Paths Computed"]):::startEnd

  Start --> Init
  Init --> Loop
  Loop -- Yes --> PopNode
  PopNode --> CheckRelax
  CheckRelax -- True --> Relax
  Relax --> Loop
  CheckRelax -- False --> Loop
  Loop -- No --> EndNode`,
    complexity: 'O((V + E) log V)',
    statusBadge: 'OPTIMIZED',
    nodeCount: 7,
    edgeCount: 8,
    category: 'C++ Algorithms',
    pipelineNodes: [
      { icon: 'hub', label: 'Adj_List', type: 'start' },
      { icon: 'analytics', label: 'Min-Heap', type: 'decision' },
      { icon: 'done_all', label: 'Dist[v]', type: 'process' }
    ],
    createdAt: 'Oct 22, 2024 · 09:15',
    updatedAt: 'Oct 22, 2024 · 09:15',
    synced: true,
  },
  {
    id: 'diag-mergesort-03',
    title: 'Recursive Merge Sort & Partition',
    filename: 'MergeSortRoutine.java',
    language: 'java',
    sourceCode: `public static void mergeSort(int[] arr, int l, int r) {\n    if (l < r) {\n        int mid = l + (r - l) / 2;\n        mergeSort(arr, l, mid);\n        mergeSort(arr, mid + 1, r);\n        merge(arr, l, mid, r);\n    }\n}`,
    mermaidSyntax: `flowchart TD
  classDef startEnd fill:#06b6d4,stroke:#38bdf8,stroke-width:2px,color:#060e20,font-weight:bold;
  classDef decision fill:#171f33,stroke:#38bdf8,stroke-width:2px,color:#7bd0ff;
  classDef process fill:#222a3d,stroke:#334155,stroke-width:1px,color:#dae2fd;

  Start(["Start: mergeSort(arr, l, r)"]):::startEnd
  Condition{"l < r ?"}:::decision
  Split["mid = l + (r - l) / 2"]:::process
  SortLeft["Recurse: mergeSort(arr, l, mid)"]:::process
  SortRight["Recurse: mergeSort(arr, mid+1, r)"]:::process
  MergeSub["In-Place: merge(arr, l, mid, r)"]:::process
  End(["Return"]):::startEnd

  Start --> Condition
  Condition -- True --> Split
  Split --> SortLeft
  SortLeft --> SortRight
  SortRight --> MergeSub
  MergeSub --> End
  Condition -- False --> End`,
    complexity: 'O(N log N) Stable',
    statusBadge: 'O(N log N)',
    nodeCount: 7,
    edgeCount: 7,
    category: 'Java Data Structures',
    pipelineNodes: [
      { icon: 'safety_divider', label: 'Mid Split', type: 'start' },
      { icon: 'merge', label: 'Two Pointers', type: 'decision' },
      { icon: 'check', label: 'In-Place', type: 'process' }
    ],
    createdAt: 'Oct 19, 2024 · 18:40',
    updatedAt: 'Oct 19, 2024 · 18:40',
    synced: true,
  },
];

export class LocalDB {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this runtime.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_DIAGRAMS)) {
          const diagramStore = db.createObjectStore(STORE_DIAGRAMS, { keyPath: 'id' });
          diagramStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          diagramStore.createIndex('language', 'language', { unique: false });
          diagramStore.createIndex('category', 'category', { unique: false });

          // Seed default diagrams
          INITIAL_DIAGRAMS.forEach((diag) => diagramStore.put(diag));
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          const settingsStore = db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
          settingsStore.put({ key: 'academic', ...DEFAULT_ACADEMIC_SETTINGS });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllDiagrams(): Promise<Diagram[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DIAGRAMS, 'readonly');
        const store = tx.objectStore(STORE_DIAGRAMS);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as Diagram[]) || [];
          const visibleList = list.filter(d => !d.isDeleted);
          if (visibleList.length === 0) {
            // Re-seed if completely empty (including no tombstones)
            if (list.length === 0) {
               this.seedDefaults().then(resolve).catch(reject);
            } else {
               resolve([]);
            }
          } else {
            resolve(visibleList);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      return [...INITIAL_DIAGRAMS];
    }
  }

  async getAllDiagramsForSync(): Promise<Diagram[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIAGRAMS, 'readonly');
      const store = tx.objectStore(STORE_DIAGRAMS);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as Diagram[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getDiagram(id: string): Promise<Diagram | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIAGRAMS, 'readonly');
      const store = tx.objectStore(STORE_DIAGRAMS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result as Diagram | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async saveDiagram(diagram: Diagram): Promise<Diagram> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIAGRAMS, 'readwrite');
      const store = tx.objectStore(STORE_DIAGRAMS);
      const req = store.put(diagram);

      req.onsuccess = () => resolve(diagram);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteDiagram(id: string): Promise<boolean> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DIAGRAMS, 'readwrite');
      const store = tx.objectStore(STORE_DIAGRAMS);
      const req = store.get(id);

      req.onsuccess = () => {
        const diagram = req.result as Diagram | undefined;
        if (diagram) {
           diagram.isDeleted = true;
           diagram.updatedAt = new Date().toISOString(); // Store as ISO for LWW
           const updateReq = store.put(diagram);
           updateReq.onsuccess = () => resolve(true);
           updateReq.onerror = () => reject(updateReq.error);
        } else {
           resolve(true); // already doesn't exist
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getAcademicSettings(): Promise<AcademicSettings> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('academic');

        req.onsuccess = () => {
          if (req.result) {
            const { key: _key, ...settings } = req.result;
            resolve(settings as AcademicSettings);
          } else {
            resolve(DEFAULT_ACADEMIC_SETTINGS);
          }
        };

        req.onerror = () => resolve(DEFAULT_ACADEMIC_SETTINGS);
      });
    } catch {
      return DEFAULT_ACADEMIC_SETTINGS;
    }
  }

  async saveAcademicSettings(settings: AcademicSettings): Promise<AcademicSettings> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: 'academic', ...settings });

      req.onsuccess = () => resolve(settings);
      req.onerror = () => reject(req.error);
    });
  }

  async saveLocalDraft(diagram: Diagram): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put({ key: 'local_draft', ...diagram });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getLocalDraft(): Promise<Diagram | null> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('local_draft');

        req.onsuccess = () => {
          if (req.result) {
            const { key: _key, ...diagram } = req.result;
            resolve(diagram as Diagram);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async deleteLocalDraft(): Promise<void> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.delete('local_draft');

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignored if it doesn't exist or errors out
    }
  }

  private async seedDefaults(): Promise<Diagram[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(STORE_DIAGRAMS, 'readwrite');
    const store = tx.objectStore(STORE_DIAGRAMS);
    INITIAL_DIAGRAMS.forEach((diag) => store.put(diag));
    return [...INITIAL_DIAGRAMS];
  }
}
