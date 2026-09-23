import { describe, it, expect, vi } from 'vitest';
import { templatesRegistry, getTemplatesByCategory } from '../../core/TemplateRegistry';
import { appController } from '../../core/AppController';
import { t } from '../../i18n/i18n';

describe('Template Registry', () => {
  it('should have the expected templates', () => {
    expect(templatesRegistry.length).toBeGreaterThanOrEqual(12);
  });

  it('should have unique IDs', () => {
    const ids = templatesRegistry.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have valid titles, descriptions and categories', () => {
    for (const tpl of templatesRegistry) {
      expect(tpl.titleKey).toBeTruthy();
      expect(tpl.descriptionKey).toBeTruthy();
      expect(['basics', 'conditionals', 'loops', 'algorithms', 'practical']).toContain(tpl.category);
    }
  });

  it('should have source code for all declared supported languages', () => {
    for (const tpl of templatesRegistry) {
      for (const lang of tpl.supportedLanguages) {
        expect(tpl.sourceCode[lang]).toBeTruthy();
      }
    }
  });

  it('should filter templates by category', () => {
    const basics = getTemplatesByCategory('basics');
    expect(basics.every(t => t.category === 'basics')).toBe(true);
    expect(getTemplatesByCategory('all').length).toBe(templatesRegistry.length);
  });
});

describe('Templates Integration with AppController', () => {
  it('should load template without autosaving (safety check) and mark as dirty', async () => {
    // Spy on LocalDB saveDiagram
    const localDB = (appController as any).localDB;
    const saveSpy = vi.spyOn(localDB, 'saveDiagram');

    const template = templatesRegistry[0];
    
    // Load the template
    appController.loadTemplate(template, 'en');

    const state = appController.getState();
    
    // 1. Should be in editor tab
    expect(state.activeTab).toBe('editor');
    
    // 2. Should be dirty
    expect(state.isDirty).toBe(true);
    
    // 3. Should have loaded the code
    expect(state.currentDiagram?.sourceCode).toBe(template.sourceCode['python']);
    
    // 4. MUST NOT have called save automatically
    expect(saveSpy).not.toHaveBeenCalled();
    
    // 5. Must not have overwritten a previous ID (it should generate a new one)
    expect(state.currentDiagram?.id).toMatch(/^diag-/);
  });

  it('should respect the translated title using t() function', () => {
    const template = templatesRegistry[0];
    appController.loadTemplate(template, 'es');
    const stateEs = appController.getState();
    const titleEs = t(template.titleKey, 'es');
    expect(stateEs.currentDiagram?.title).toBe(titleEs);
  });
});
