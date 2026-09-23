import { Diagram, AcademicSettings, ExportFormat, ActiveTab } from '../types';
import { LocalDB, DEFAULT_ACADEMIC_SETTINGS } from '../db/LocalDB';
import { FirestoreSync, SyncStatus } from '../db/FirestoreSync';
import { CodeParser } from './CodeParser';
import { DiagramRenderer } from './DiagramRenderer';
import { ExportManager } from './ExportManager';
import { t } from '../i18n/i18n';

export interface AppState {
  diagrams: Diagram[];
  currentDiagram: Diagram | null;
  savedDiagram: Diagram | null;
  isDirty: boolean;
  academicSettings: AcademicSettings;
  syncStatus: SyncStatus;
  activeTab: ActiveTab;
  isHomeworkModalOpen: boolean;
  searchQuery: string;
  selectedCategory: string;
  draftRecovered: boolean;
}

export class AppController {
  private localDB: LocalDB;
  private firestoreSync: FirestoreSync;
  private parser: CodeParser;
  private renderer: DiagramRenderer;
  private exporter: ExportManager;

  private state: AppState;
  private listeners: Array<(state: AppState) => void> = [];

  private draftSaveGeneration: number = 0;
  private draftSaveTimeout: any = null;

  constructor() {
    this.localDB = new LocalDB();
    this.firestoreSync = new FirestoreSync(this.localDB);
    this.parser = new CodeParser();
    this.renderer = new DiagramRenderer();
    this.exporter = new ExportManager(this.renderer);

    this.state = {
      diagrams: [],
      currentDiagram: null,
      savedDiagram: null,
      isDirty: false,
      academicSettings: DEFAULT_ACADEMIC_SETTINGS,
      syncStatus: this.firestoreSync.getStatus(),
      activeTab: 'dashboard',
      isHomeworkModalOpen: false,
      searchQuery: '',
      selectedCategory: 'All',
      draftRecovered: false,
    };

    // Listen to FirestoreSync events
    let wasSyncing = false;
    this.firestoreSync.subscribe((syncStatus) => {
      this.setState({ syncStatus });
      if (wasSyncing && !syncStatus.isSyncing) {
        // Sync just finished, reload diagrams to reflect pulls
        this.localDB.getAllDiagrams().then((diagrams) => {
          this.setState({ diagrams });
        });
      }
      wasSyncing = syncStatus.isSyncing;
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Best-effort synchronous dispatch for any pending draft save.
        // LIMITATION: IndexedDB operations are async and modern browsers may kill the context 
        // before the write completes. We do not use a false guarantee (like pausing execution).
        if (this.draftSaveTimeout && this.state.currentDiagram) {
          this.localDB.saveLocalDraft(this.state.currentDiagram).catch(() => {});
        }
      });
    }

    this.init();
  }

  private async init() {
    try {
      const [diagrams, settings, localDraft] = await Promise.all([
        this.localDB.getAllDiagrams(),
        this.localDB.getAcademicSettings(),
        this.localDB.getLocalDraft(),
      ]);

      let current = diagrams.length > 0 ? { ...diagrams[0] } : null;
      let isDirty = false;
      let draftRecovered = false;

      // Recover draft if it applies to the current official diagram and has unsaved changes
      if (current && localDraft && localDraft.id === current.id) {
        // Compare content to detect actual unsaved changes safely
        const hasChanges = 
          localDraft.sourceCode !== current.sourceCode ||
          localDraft.title !== current.title ||
          localDraft.language !== current.language ||
          localDraft.filename !== current.filename;

        // If it's newer or has changes
        if (hasChanges) {
          current = { ...localDraft };
          isDirty = true;
          draftRecovered = true;
        } else {
          // It's equivalent, we can clean up the obsolete draft
          this.localDB.deleteLocalDraft().catch(() => {});
        }
      } else if (localDraft && (!current || localDraft.id !== current.id)) {
        // Draft belongs to a different diagram not currently at the top of the list, 
        // or official list is empty. For safety, if we don't have current, we use draft.
        if (!current) {
          current = { ...localDraft };
          isDirty = true;
          draftRecovered = true;
        }
        // If it belongs to another diagram, we just keep the draft in DB 
        // in case the user switches back to it later (advanced behavior)
      }

      this.setState({
        diagrams,
        currentDiagram: current,
        savedDiagram: current && !draftRecovered ? { ...current } : (diagrams.length > 0 ? { ...diagrams[0] } : null),
        isDirty,
        draftRecovered,
        academicSettings: settings,
      });
    } catch (err) {
      console.warn('[AppController] Error during initialization:', err);
    }
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getState(): AppState {
    return this.state;
  }

  private setState(partialState: Partial<AppState>) {
    this.state = { ...this.state, ...partialState };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public setActiveTab(tab: ActiveTab) {
    this.setState({ activeTab: tab });
  }

  public setHomeworkModalOpen(open: boolean) {
    this.setState({ isHomeworkModalOpen: open });
  }

  public setSearchQuery(query: string) {
    this.setState({ searchQuery: query });
  }

  public setSelectedCategory(category: string) {
    this.setState({ selectedCategory: category });
  }

  public async loadDiagram(id: string) {
    const diagram = await this.localDB.getDiagram(id);
    if (diagram) {
      this.setState({
        currentDiagram: { ...diagram },
        savedDiagram: { ...diagram },
        isDirty: false,
        draftRecovered: false,
        activeTab: 'editor',
      });
    }
  }

  public async createNewFlowchart(template?: Partial<Diagram>) {
    const timestamp = new Date().toISOString();

    const newId = `diag-${Date.now()}`;
    const defaultPython = `def binary_search(arr, low, high, x):
    if high >= low:
        mid = (high + low) // 2
        if arr[mid] == x:
            return mid
        elif arr[mid] > x:
            return binary_search(arr, low, mid - 1, x)
        else:
            return binary_search(arr, mid + 1, high, x)
    return -1`;

    const parseRes = this.parser.parse(
      template?.sourceCode || defaultPython,
      template?.language || 'python',
      this.state.academicSettings.diagramLanguage
    );

    const newDiagram: Diagram = {
      id: newId,
      title: template?.title || 'Binary Search Algorithm',
      filename: template?.filename || 'Binary_Search_Algorithm.py',
      language: (template?.language as any) || 'python',
      sourceCode: template?.sourceCode || defaultPython,
      mermaidSyntax: template?.mermaidSyntax || parseRes.mermaidSyntax,
      complexity: template?.complexity || parseRes.complexity,
      statusBadge: template?.statusBadge || 'OPTIMIZED',
      nodeCount: parseRes.nodeCount,
      edgeCount: parseRes.edgeCount,
      nodes: parseRes.nodes,
      category: template?.category || 'Python Algorithms',
      pipelineNodes: [
        { icon: 'input', label: 'Start', type: 'start' },
        { icon: 'call_split', label: 'high >= low ?', type: 'decision' },
        { icon: 'refresh', label: 'Recurse()', type: 'process' },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
      synced: true,
      ...template,
    };

    await this.localDB.saveDiagram(newDiagram);
    const updatedList = await this.localDB.getAllDiagrams();

    this.setState({
      diagrams: updatedList,
      currentDiagram: { ...newDiagram },
      savedDiagram: { ...newDiagram },
      isDirty: false,
      draftRecovered: false,
      activeTab: 'editor',
    });
  }

  private getExtension(lang: string): string {
    switch (lang) {
      case 'python': return 'py';
      case 'javascript': return 'js';
      case 'cpp': return 'cpp';
      case 'java': return 'java';
      default: return 'txt';
    }
  }

  public loadTemplate(template: import('../types').FlowTemplate, appLang: import('../types').AppLanguage) {
    const timestamp = new Date().toISOString();
    const newId = `diag-${Date.now()}`;
    
    const targetLang = this.state.currentDiagram?.language || 'python';
    const sourceCode = template.sourceCode[targetLang as import('../types').ProgrammingLanguage] || Object.values(template.sourceCode)[0];
    const lang = (Object.keys(template.sourceCode).find(k => template.sourceCode[k as import('../types').ProgrammingLanguage] === sourceCode)) as import('../types').ProgrammingLanguage || targetLang;

    // We use a fallback translation getter, since t() should ideally be imported, but we can't easily import it here without circular deps if not careful.
    // Actually, AppController is just a class, we can import t at the top. Let's just use template.titleKey for now or import it at the top.
    // Wait, I will just import t at the top.
    
    // For now, let's just use the key if we don't translate it here. We'll translate it in the view if needed, but the diagram needs a string title.
    // I'll import { t } from '../i18n/i18n'; at the top of AppController.
    // Let's assume t is available, I will add it to the imports.

    const title = t(template.titleKey, appLang);
    const filename = `${title.replace(/\s+/g, '_')}.${this.getExtension(lang)}`;

    const parseRes = this.parser.parse(
      sourceCode as string,
      lang,
      this.state.academicSettings.diagramLanguage
    );

    const newDiagram: import('../types').Diagram = {
      id: newId,
      title: title,
      filename: filename,
      language: lang,
      sourceCode: sourceCode as string,
      mermaidSyntax: parseRes.mermaidSyntax,
      complexity: parseRes.complexity,
      statusBadge: 'TEMPLATE',
      nodeCount: parseRes.nodeCount,
      edgeCount: parseRes.edgeCount,
      nodes: parseRes.nodes,
      category: template.category,
      pipelineNodes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      synced: false,
    };

    this.setState({
      currentDiagram: newDiagram,
      savedDiagram: { ...newDiagram },
      isDirty: true,
      draftRecovered: false,
      activeTab: 'editor',
    });
  }

  public async updateCurrentDiagram(updates: Partial<Diagram>) {
    if (!this.state.currentDiagram) return;

    const updated: Diagram = {
      ...this.state.currentDiagram,
      ...updates,
    };

    this.setState({
      currentDiagram: updated,
      isDirty: true,
    });

    this.scheduleDraftSave(updated);
  }

  private scheduleDraftSave(diagram: Diagram) {
    this.draftSaveGeneration++;
    const gen = this.draftSaveGeneration;

    if (this.draftSaveTimeout) {
      clearTimeout(this.draftSaveTimeout);
    }

    this.draftSaveTimeout = setTimeout(() => {
      if (this.draftSaveGeneration === gen) {
        this.localDB.saveLocalDraft(diagram).catch(err => {
          console.warn('[AppController] Failed to save local draft:', err);
        });
      }
    }, 1000);
  }

  public async saveCurrentProject() {
    if (!this.state.currentDiagram) return;

    const timestamp = new Date().toISOString();

    const updated: Diagram = {
      ...this.state.currentDiagram,
      updatedAt: timestamp,
    };

    // Invalidate pending draft saves
    this.draftSaveGeneration++;
    if (this.draftSaveTimeout) {
      clearTimeout(this.draftSaveTimeout);
      this.draftSaveTimeout = null;
    }

    await this.localDB.saveDiagram(updated);
    const updatedList = await this.localDB.getAllDiagrams();

    this.setState({
      currentDiagram: { ...updated },
      savedDiagram: { ...updated },
      diagrams: updatedList,
      isDirty: false,
      draftRecovered: false,
    });

    // Cleanup draft after successful official save
    this.localDB.deleteLocalDraft().catch(err => {
      console.warn('[AppController] Cleanup of local draft failed:', err);
    });

    // Fire-and-forget sync to Firestore (offline safe)
    this.firestoreSync.pushSingleProject(updated).catch(err => {
      console.warn('[AppController] Firestore push pending/error:', err);
    });
  }

  public discardChanges() {
    if (!this.state.savedDiagram) return;
    this.setState({
      currentDiagram: { ...this.state.savedDiagram },
      isDirty: false,
      draftRecovered: false,
    });
  }

  public async deleteDiagram(id: string) {
    await this.localDB.deleteDiagram(id);
    // AppController delegates remote deletion to the normal sync flow or tombstone push
    // We already marked it as isDeleted in localDB via soft-delete.
    // So we just need to tell FirestoreSync to push that tombstone.
    const deletedDiagram = await this.localDB.getDiagram(id);
    if (deletedDiagram) {
      this.firestoreSync.pushSingleProject(deletedDiagram).catch(err => {
        console.warn('[AppController] Tombstone push pending/error:', err);
      });
    }

    const updatedList = await this.localDB.getAllDiagrams();
    let nextCurrent = this.state.currentDiagram;
    let nextSaved = this.state.savedDiagram;
    if (nextCurrent && nextCurrent.id === id) {
      nextCurrent = updatedList.length > 0 ? { ...updatedList[0] } : null;
      nextSaved = updatedList.length > 0 ? { ...updatedList[0] } : null;
    }

    this.setState({
      diagrams: updatedList,
      currentDiagram: nextCurrent,
      savedDiagram: nextSaved,
      isDirty: false,
      draftRecovered: false,
    });
  }

  public parseCurrentCode(): void {
    if (!this.state.currentDiagram) return;
    const { sourceCode, language } = this.state.currentDiagram;
    const parseResult = this.parser.parse(sourceCode, language, this.state.academicSettings.diagramLanguage);

    this.updateCurrentDiagram({
      mermaidSyntax: parseResult.mermaidSyntax,
      complexity: parseResult.complexity,
      nodeCount: parseResult.nodeCount,
      edgeCount: parseResult.edgeCount,
      nodes: parseResult.nodes,
    });
  }

  public async saveAcademicSettings(settings: AcademicSettings) {
    const oldDiagramLang = this.state.academicSettings.diagramLanguage;
    const saved = await this.localDB.saveAcademicSettings(settings);
    
    // We update the state
    this.setState({
      academicSettings: saved,
      isHomeworkModalOpen: false,
    });

    // If diagramLanguage changed, regenerate mermaidSyntax for current diagram without making it dirty
    if (saved.diagramLanguage !== oldDiagramLang && this.state.currentDiagram) {
      const { sourceCode, language } = this.state.currentDiagram;
      const parseResult = this.parser.parse(sourceCode, language, saved.diagramLanguage);
      
      const newCurrent = { ...this.state.currentDiagram, mermaidSyntax: parseResult.mermaidSyntax, nodes: parseResult.nodes };
      const newSaved = this.state.savedDiagram ? { ...this.state.savedDiagram, mermaidSyntax: parseResult.mermaidSyntax, nodes: parseResult.nodes } : null;
      
      this.setState({
        currentDiagram: newCurrent,
        savedDiagram: newSaved,
      });
    }
  }

  public async exportDiagram(
    format: ExportFormat,
    diagram?: Diagram,
    element?: SVGElement | HTMLElement | null
  ) {
    const target = diagram || this.state.currentDiagram;
    if (!target) return;

    if (format === 'pdf') {
      await this.exporter.exportPDF(target, this.state.academicSettings, element);
    } else if (format === 'docx') {
      await this.exporter.exportDOCX(target, this.state.academicSettings, element);
    } else if (format === 'image') {
      if (element) {
        await this.exporter.exportImage(target, this.state.academicSettings, element, 'png');
      }
    }
  }

  public getRenderer(): DiagramRenderer {
    return this.renderer;
  }

  public getParser(): CodeParser {
    return this.parser;
  }

  public getFirestoreSync(): FirestoreSync {
    return this.firestoreSync;
  }
}

// Singleton Application Controller instance
export const appController = new AppController();
