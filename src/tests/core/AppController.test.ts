import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppController } from '../../core/AppController';
import { Diagram } from '../../types';

// Mock dependencies
vi.mock('../../db/LocalDB', () => {
  return {
    LocalDB: vi.fn().mockImplementation(function() {
      let diagrams: Diagram[] = [];
      return {
        getAllDiagrams: vi.fn().mockResolvedValue(diagrams),
        getAcademicSettings: vi.fn().mockResolvedValue({}),
        saveDiagram: vi.fn().mockImplementation((d) => {
          const idx = diagrams.findIndex(x => x.id === d.id);
          if(idx >= 0) diagrams[idx] = d;
          else diagrams.push(d);
          return Promise.resolve();
        }),
        getDiagram: vi.fn().mockImplementation((id) => Promise.resolve(diagrams.find(d => d.id === id) || null)),
        deleteDiagram: vi.fn().mockResolvedValue(undefined),
        getLocalDraft: vi.fn().mockResolvedValue(null),
        saveLocalDraft: vi.fn().mockResolvedValue(undefined),
        deleteLocalDraft: vi.fn().mockResolvedValue(undefined),
      };
    }),
    DEFAULT_ACADEMIC_SETTINGS: {}
  };
});

vi.mock('../../db/FirestoreSync', () => {
  return {
    FirestoreSync: vi.fn().mockImplementation(function() {
      return {
        getStatus: vi.fn().mockReturnValue({ isOnline: true }),
        subscribe: vi.fn(),
        syncBidirectional: vi.fn(),
        pushSingleProject: vi.fn().mockResolvedValue(undefined),
        deleteFromRemote: vi.fn(),
      };
    })
  };
});

vi.mock('../../core/CodeParser', () => ({
  CodeParser: vi.fn().mockImplementation(function() {
    return {
      parse: vi.fn().mockReturnValue({
        mermaidSyntax: 'graph TD; A-->B;',
        complexity: 'O(N)',
        nodeCount: 2,
        edgeCount: 1,
      })
    };
  })
}));

vi.mock('../../core/DiagramRenderer', () => ({
  DiagramRenderer: vi.fn().mockImplementation(function() {
    return {
      render: vi.fn(),
    };
  })
}));

vi.mock('../../core/ExportManager', () => ({
  ExportManager: vi.fn().mockImplementation(function() {
    return {
      exportPDF: vi.fn(),
      exportDOCX: vi.fn(),
      exportImage: vi.fn(),
    };
  })
}));

describe('AppController - Phase 3B Guardado Explícito', () => {
  let controller: AppController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AppController();
  });

  it('Test 1 & 2 & 3: Modificar código marca isDirty pero no guarda. Presionar Guardar escribe y limpia isDirty', async () => {
    await controller.createNewFlowchart({ title: 'Test 1', sourceCode: 'def test(): pass' });
    
    // Al crear un diagrama nuevo, isDirty debe ser false
    let state = controller.getState();
    expect(state.isDirty).toBe(false);
    expect(state.savedDiagram?.title).toBe('Test 1');

    // Modificamos el draft (como si el usuario escribiera)
    await controller.updateCurrentDiagram({ sourceCode: 'def test(): return True' });
    state = controller.getState();
    
    // isDirty pasa a true, draft cambia, pero savedDiagram sigue igual
    expect(state.isDirty).toBe(true);
    expect(state.currentDiagram?.sourceCode).toBe('def test(): return True');
    expect(state.savedDiagram?.sourceCode).toBe('def test(): pass');

    // Guardar el proyecto
    await controller.saveCurrentProject();
    state = controller.getState();
    
    // isDirty vuelve a false y savedDiagram se actualiza
    expect(state.isDirty).toBe(false);
    expect(state.savedDiagram?.sourceCode).toBe('def test(): return True');
  });

  it('Test 4 & 6: Modificar/borrar y descartar recupera el original', async () => {
    await controller.createNewFlowchart({ title: 'Test 4', sourceCode: 'Original' });
    
    await controller.updateCurrentDiagram({ sourceCode: '' }); // Simular borrado completo
    
    let state = controller.getState();
    expect(state.isDirty).toBe(true);
    expect(state.currentDiagram?.sourceCode).toBe('');
    
    // Descartar cambios
    controller.discardChanges();
    state = controller.getState();
    
    expect(state.isDirty).toBe(false);
    expect(state.currentDiagram?.sourceCode).toBe('Original');
    expect(state.savedDiagram?.sourceCode).toBe('Original');
  });

  it('Test 5: Guardar dos veces reemplaza correctamente la última versión', async () => {
    await controller.createNewFlowchart({ sourceCode: 'A' });
    
    await controller.updateCurrentDiagram({ sourceCode: 'B' });
    await controller.saveCurrentProject();
    
    let state = controller.getState();
    expect(state.savedDiagram?.sourceCode).toBe('B');
    
    await controller.updateCurrentDiagram({ sourceCode: 'C' });
    await controller.saveCurrentProject();
    
    state = controller.getState();
    expect(state.savedDiagram?.sourceCode).toBe('C');
    expect(state.currentDiagram?.sourceCode).toBe('C');
    expect(state.isDirty).toBe(false);
  });
});
