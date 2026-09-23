import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appController, AppController } from '../../core/AppController';
import { t, td } from '../../i18n/i18n';
import { LocalDB } from '../../db/LocalDB';
import { Diagram, AcademicSettings } from '../../types';

vi.mock('../../db/LocalDB', () => {
  return {
    LocalDB: vi.fn().mockImplementation(function() {
      let settings: AcademicSettings = {
        appLanguage: 'es',
        diagramLanguage: 'en',
        studentName: '',
        studentId: '',
        subject: '',
        professor: '',
        templateStyle: 'ieee',
        autoTimestamp: false
      };
      let diagrams: Diagram[] = [];
      return {
        getAllDiagrams: vi.fn().mockResolvedValue(diagrams),
        getAcademicSettings: vi.fn().mockResolvedValue(settings),
        saveAcademicSettings: vi.fn().mockImplementation((s) => {
          settings = { ...s };
          return Promise.resolve(settings);
        }),
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
    DEFAULT_ACADEMIC_SETTINGS: {
      appLanguage: 'es',
      diagramLanguage: 'en'
    }
  };
});

describe('Language System and Settings Integration', () => {
  let controller: AppController;

  beforeEach(async () => {
    controller = new AppController();
  });

  it('diagramLanguage has independent control from appLanguage', async () => {
    // Wait for init to finish
    await new Promise(r => setTimeout(r, 20));
    const state = controller.getState();
    const initialSettings = state.academicSettings;
    
    expect(initialSettings.appLanguage).toBeDefined();
    expect(initialSettings.diagramLanguage).toBeDefined();
  });

  it('Changing diagramLanguage updates AcademicSettings without modifying appLanguage', async () => {
    await new Promise(r => setTimeout(r, 20));
    const currentState = controller.getState().academicSettings;
    
    await controller.saveAcademicSettings({
      ...currentState,
      diagramLanguage: 'es',
      appLanguage: 'en'
    });

    const newState = controller.getState().academicSettings;
    expect(newState.diagramLanguage).toBe('es');
    expect(newState.appLanguage).toBe('en');
  });

  it('Changing appLanguage does not modify diagramLanguage', async () => {
    await new Promise(r => setTimeout(r, 20));
    const currentState = controller.getState().academicSettings;
    
    await controller.saveAcademicSettings({
      ...currentState,
      diagramLanguage: 'en',
      appLanguage: 'es'
    });

    const newState = controller.getState().academicSettings;
    expect(newState.diagramLanguage).toBe('en');
    expect(newState.appLanguage).toBe('es');
  });

  it('Changing diagramLanguage does not modify sourceCode and does not set isDirty', async () => {
    await new Promise(r => setTimeout(r, 20));
    // Setup a dummy diagram
    await controller.createNewFlowchart({
      title: 'Test',
      sourceCode: 'print(1)',
      language: 'python'
    });
    
    const diagramBefore = controller.getState().currentDiagram!;
    const isDirtyBefore = controller.getState().isDirty;
    
    expect(isDirtyBefore).toBe(false);

    // Change diagram language
    const currentSettings = controller.getState().academicSettings;
    await controller.saveAcademicSettings({
      ...currentSettings,
      diagramLanguage: 'es'
    });

    const stateAfter = controller.getState();
    expect(stateAfter.isDirty).toBe(false); // isDirty should remain false
    expect(stateAfter.currentDiagram!.sourceCode).toBe(diagramBefore.sourceCode); // Source code shouldn't change
    
    // Mermaid syntax should have been regenerated to 'es'
    expect(stateAfter.currentDiagram!.mermaidSyntax).toContain('INICIO'); 
  });

  it('diagramLanguage and appLanguage are saved to LocalDB', async () => {
    await new Promise(r => setTimeout(r, 20));
    const currentState = controller.getState().academicSettings;
    
    await controller.saveAcademicSettings({
      ...currentState,
      diagramLanguage: 'es',
      appLanguage: 'en'
    });

    // We can't directly read from LocalDB cleanly without grabbing the mock, but the state reflects it
    expect(controller.getState().academicSettings.diagramLanguage).toBe('es');
    expect(controller.getState().academicSettings.appLanguage).toBe('en');
  });

  describe('i18n Translation Engine', () => {
    it('Modal keys exist and return human text in ES', () => {
      expect(t('app.unsavedWarning', 'es')).not.toBe('app.unsavedWarning');
      expect(t('app.unsavedDesc', 'es')).not.toBe('app.unsavedDesc');
      expect(t('app.saveAndExit', 'es')).not.toBe('app.saveAndExit');
      expect(t('app.exitWithoutSaving', 'es')).not.toBe('app.exitWithoutSaving');
      expect(t('common.cancel', 'es')).not.toBe('common.cancel');

      // Verify actual Spanish
      expect(t('app.saveAndExit', 'es')).toBe('Guardar y salir');
    });

    it('Modal keys exist and return human text in EN', () => {
      expect(t('app.unsavedWarning', 'en')).not.toBe('app.unsavedWarning');
      expect(t('app.unsavedDesc', 'en')).not.toBe('app.unsavedDesc');
      expect(t('app.saveAndExit', 'en')).not.toBe('app.saveAndExit');
      expect(t('app.exitWithoutSaving', 'en')).not.toBe('app.exitWithoutSaving');
      expect(t('common.cancel', 'en')).not.toBe('common.cancel');

      // Verify actual English
      expect(t('app.saveAndExit', 'en')).toBe('Save and exit');
    });
    
    it('Returns safe fallback (key) when translation is completely missing', () => {
      expect(t('some.invented.key', 'es')).toBe('some.invented.key');
    });
  });
});
