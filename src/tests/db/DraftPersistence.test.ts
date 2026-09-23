import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalDB, DEFAULT_ACADEMIC_SETTINGS } from '../../db/LocalDB';
import { AppController } from '../../core/AppController';
import { Diagram, AcademicSettings } from '../../types';

// Simple in-memory mock for IndexedDB to allow JSDOM testing
const mockIndexedDB = (() => {
  let stores: Record<string, Map<any, any>> = {};

  const createRequest = (resultValue?: any) => {
    let _onsuccess: Function | null = null;
    let _onupgradeneeded: Function | null = null;
    const req = {
      result: resultValue,
      get onsuccess() { return _onsuccess as Function; },
      set onsuccess(fn: Function) {
        _onsuccess = fn;
        if (fn) fn({ target: req });
      },
      get onupgradeneeded() { return _onupgradeneeded as Function; },
      set onupgradeneeded(fn: Function) {
        _onupgradeneeded = fn;
        if (fn && Object.keys(stores).length === 0) {
          fn({ target: req });
        }
      }
    };
    return req;
  };

  return {
    open: vi.fn(() => {
      const db = {
        objectStoreNames: { contains: (name: string) => !!stores[name] },
        createObjectStore: (name: string, options: any) => {
          stores[name] = new Map();
          return {
            createIndex: vi.fn(),
            put: (val: any) => {
              const key = val.key || val.id;
              stores[name].set(key, val);
              return createRequest();
            }
          };
        },
        transaction: (storeName: string) => {
          if (!stores[storeName]) stores[storeName] = new Map();
          return {
            objectStore: (sName: string) => {
              const store = stores[sName];
              return {
                get: (key: any) => createRequest(store.get(key)),
                put: (val: any) => {
                  const key = val.key || val.id;
                  store.set(key, val);
                  return createRequest();
                },
                delete: (key: any) => {
                  store.delete(key);
                  return createRequest();
                },
                getAll: () => createRequest(Array.from(store.values()))
              };
            }
          };
        }
      };

      const request = createRequest(db);
      return request;
    }),
    _reset: () => { stores = { 'diagrams': new Map(), 'settings': new Map() }; }
  };
})();

Object.defineProperty(globalThis, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

describe('Draft Persistence and Recovery (Phase 7.1)', () => {
  let localDB: LocalDB;

  beforeEach(() => {
    mockIndexedDB._reset();
    localDB = new LocalDB();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockDiagram: Diagram = {
    id: 'diag-test-01',
    title: 'Test Diagram',
    filename: 'Test.py',
    language: 'python',
    sourceCode: 'print("hello")',
    mermaidSyntax: 'flowchart TD\nA-->B',
    complexity: 'O(1)',
    statusBadge: 'STABLE',
    nodeCount: 2,
    edgeCount: 1,
    category: 'Test',
    pipelineNodes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('LocalDB Draft Methods', () => {
    it('Test 1 - should save a Local Draft and recover it', async () => {
      await localDB.saveLocalDraft(mockDiagram);
      const recovered = await localDB.getLocalDraft();
      expect(recovered).not.toBeNull();
      expect(recovered?.id).toBe(mockDiagram.id);
      expect(recovered?.sourceCode).toBe(mockDiagram.sourceCode);
    });

    it('Test 2 - should not overwrite academic settings when saving draft', async () => {
      const customSettings: AcademicSettings = { ...DEFAULT_ACADEMIC_SETTINGS, studentName: 'Test Name' };
      await localDB.saveAcademicSettings(customSettings);
      await localDB.saveLocalDraft(mockDiagram);

      const settings = await localDB.getAcademicSettings();
      expect(settings.studentName).toBe('Test Name');
      
      const draft = await localDB.getLocalDraft();
      expect(draft?.id).toBe(mockDiagram.id);
    });

    it('Test 3 - should replace previous Draft', async () => {
      await localDB.saveLocalDraft(mockDiagram);
      const updatedDraft = { ...mockDiagram, sourceCode: 'print("updated")' };
      await localDB.saveLocalDraft(updatedDraft);

      const recovered = await localDB.getLocalDraft();
      expect(recovered?.sourceCode).toBe('print("updated")');
    });
  });

  describe('AppController Draft Integration', () => {
    it('Test 4 - Save formal elimina Draft', async () => {
      const controller = new AppController();
      vi.advanceTimersByTime(100);
      await Promise.resolve(); 
      
      // Seed diagram
      await controller.createNewFlowchart({ sourceCode: 'a=1' });
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      const diagId = controller.getState().currentDiagram!.id;

      // Trigger update (sets dirty and starts debounce)
      await controller.updateCurrentDiagram({ sourceCode: 'a=2' });
      vi.advanceTimersByTime(1100); // Flush debounce
      await Promise.resolve(); // allow microtasks

      // Verify draft exists
      const db = controller['localDB'];
      let draft = await db.getLocalDraft();
      expect(draft).not.toBeNull();
      expect(draft?.sourceCode).toBe('a=2');

      // Formal save
      await controller.saveCurrentProject();
      await Promise.resolve();

      // Draft should be gone
      draft = await db.getLocalDraft();
      expect(draft).toBeNull();
    });

    it('Test 5 - Save formal fallido conserva Draft', async () => {
      const controller = new AppController();
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      await controller.createNewFlowchart({ sourceCode: 'b=1' });
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await controller.updateCurrentDiagram({ sourceCode: 'b=2' });
      vi.advanceTimersByTime(1100);
      await Promise.resolve();

      const db = controller['localDB'];
      
      // Mock failure on official save
      vi.spyOn(db, 'saveDiagram').mockRejectedValueOnce(new Error('DB Error'));

      try {
        await controller.saveCurrentProject();
      } catch (e) {
        // Expected
      }
      
      // Draft should still exist because save failed
      const draft = await db.getLocalDraft();
      expect(draft).not.toBeNull();
      expect(draft?.sourceCode).toBe('b=2');
    });

    it('Test 6 - debounce prevents multiple writes', async () => {
      const controller = new AppController();
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      await controller.createNewFlowchart({ sourceCode: 'x=1' });
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      const db = controller['localDB'];
      const saveDraftSpy = vi.spyOn(db, 'saveLocalDraft');

      // Rapid updates
      await controller.updateCurrentDiagram({ sourceCode: 'x=2' });
      await controller.updateCurrentDiagram({ sourceCode: 'x=3' });
      await controller.updateCurrentDiagram({ sourceCode: 'x=4' });

      vi.advanceTimersByTime(500); // not enough
      expect(saveDraftSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(600); // past 1000ms from the last update
      
      expect(saveDraftSpy).toHaveBeenCalledTimes(1);
      expect(saveDraftSpy.mock.calls[0][0].sourceCode).toBe('x=4');
    });

    it('Test 7 - recuperación de draft válido y más reciente', async () => {
      const db = new LocalDB();
      await db.deleteDiagram('diag-1');
      await db.deleteDiagram('diag-bst-01');
      vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'));
      const official = { ...mockDiagram, id: 'diag-recov', sourceCode: 'old' };
      await db.saveDiagram(official);
      
      // Create newer draft with differences
      const draft = { ...official, sourceCode: 'new changes' };
      await db.saveLocalDraft(draft);

      const controller = new AppController();
      vi.advanceTimersByTime(100);
      for(let i=0; i<5; i++) await Promise.resolve();

      const state = controller.getState();
      expect(state.draftRecovered).toBe(true);
      expect(state.isDirty).toBe(true);
      expect(state.currentDiagram?.sourceCode).toBe('new changes');
      // The saved diagram should still be the old one
      expect(state.savedDiagram?.sourceCode).toBe('old');
    });

    it('Test 8 - Draft obsoleto no reemplaza (si no hay id match no sobreescribe current erróneamente)', async () => {
      const db = new LocalDB();
      await db.deleteDiagram('diag-1');
      await db.deleteDiagram('diag-bst-01');
      // Official diagram
      vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'));
      const official = { ...mockDiagram, id: 'diag-active', sourceCode: 'official' };
      await db.saveDiagram(official);
      
      // Draft belongs to another diagram id
      const draft = { ...mockDiagram, id: 'diag-other', sourceCode: 'other' };
      await db.saveLocalDraft(draft);

      const controller = new AppController();
      for(let i=0; i<5; i++) await Promise.resolve();

      const state = controller.getState();
      // Should load the official diagram since it's the active one (diagrams[0])
      expect(state.currentDiagram?.id).toBe('diag-active');
      expect(state.currentDiagram?.sourceCode).toBe('official');
      expect(state.draftRecovered).toBe(false); // No se recuperó porque el draft era de otro proyecto y tenemos uno oficial
    });

    it('Test 9 - Draft equivalente no activa isDirty ni draftRecovered', async () => {
      const db = new LocalDB();
      await db.deleteDiagram('diag-1');
      await db.deleteDiagram('diag-bst-01');
      vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'));
      const official = { ...mockDiagram, id: 'diag-equiv', sourceCode: 'same' };
      await db.saveDiagram(official);
      
      // Draft is completely identical to official
      await db.saveLocalDraft(official);

      const controller = new AppController();
      for(let i=0; i<5; i++) await Promise.resolve();

      const state = controller.getState();
      expect(state.draftRecovered).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.currentDiagram?.sourceCode).toBe('same');

      // The obsolete equivalent draft should be deleted eventually (background cleanup)
      await Promise.resolve();
      const remainingDraft = await db.getLocalDraft();
      expect(remainingDraft).toBeNull();
    });
  });
});
