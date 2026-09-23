import React, { useEffect, useState } from 'react';
import { appController, AppState } from './core/AppController';
import { t } from './i18n/i18n';
import { Diagram, ExportFormat } from './types';
import { HeaderBar } from './components/HeaderBar';
import { NavigationBar } from './components/NavigationBar';
import { DashboardView } from './components/DashboardView';
import { EditorView } from './components/EditorView';
import { TemplatesView } from './components/TemplatesView';
import { SettingsView } from './components/SettingsView';
import { HomeworkSettingsModal } from './components/HomeworkSettingsModal';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';

export default function App() {
  const [state, setState] = useState<AppState>(appController.getState());
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestNavigation = (action: () => void) => {
    if (state.isDirty) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  useEffect(() => {
    const unsubscribe = appController.subscribe((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut: ⌘K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        requestNavigation(() => appController.setActiveTab('dashboard'));
        setTimeout(() => {
          document.getElementById('diagram-search')?.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isDirty]);

  const handleGoogleSignIn = async () => {
    try {
      await appController.getFirestoreSync().signInWithGoogle();
    } catch (err: any) {
      alert(`Google Sign-In notice: ${err?.message || 'Offline mode active'}`);
    }
  };

  const handleSignOut = async () => {
    await appController.getFirestoreSync().signOutUser();
  };

  const handleSyncNow = async () => {
    await appController.getFirestoreSync().syncBidirectional();
  };

  const handleLoadTemplate = (template: import('./types').FlowTemplate) => {
    requestNavigation(() => appController.loadTemplate(template, state.academicSettings.appLanguage || 'en'));
  };

  const handleExport = (format: ExportFormat, targetDiagram?: Diagram, element?: SVGElement | HTMLElement | null) => {
    appController.exportDiagram(format, targetDiagram, element);
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-['Inter',sans-serif] flex flex-col relative overflow-x-hidden">
      {/* Top Application Header */}
      <HeaderBar
        activeTab={state.activeTab}
        onOpenSettingsModal={() => appController.setHomeworkModalOpen(true)}
        syncStatus={state.syncStatus}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        appLanguage={state.academicSettings.appLanguage}
      />

      {/* Main View Container */}
      <main className="flex-1 pt-16 flex flex-col w-full">
        {state.activeTab === 'dashboard' && (
          <DashboardView
            diagrams={state.diagrams}
            academicSettings={state.academicSettings}
            syncStatus={state.syncStatus}
            searchQuery={state.searchQuery}
            selectedCategory={state.selectedCategory}
            onSearchChange={(q) => appController.setSearchQuery(q)}
            onCategoryChange={(cat) => appController.setSelectedCategory(cat)}
            onSelectDiagram={(id) => requestNavigation(() => appController.loadDiagram(id))}
            onCreateNew={() => requestNavigation(() => appController.createNewFlowchart())}
            onDeleteDiagram={(id) => appController.deleteDiagram(id)}
            onOpenSettings={() => appController.setHomeworkModalOpen(true)}
            onExport={(fmt, diag) => handleExport(fmt, diag)}
          />
        )}

        {state.activeTab === 'editor' && (
          state.currentDiagram ? (
            <EditorView
              diagram={state.currentDiagram}
              academicSettings={state.academicSettings}
              renderer={appController.getRenderer()}
              isDirty={state.isDirty}
              onSave={() => appController.saveCurrentProject()}
              onBack={() => requestNavigation(() => appController.setActiveTab('dashboard'))}
              onUpdateCode={(code) => {
                appController.updateCurrentDiagram({ sourceCode: code });
              }}
              onUpdateLanguage={(lang) => {
                appController.updateCurrentDiagram({ language: lang });
              }}
              onUpdateTitle={(title, filename) => {
                appController.updateCurrentDiagram({ title, filename });
              }}
              onGenerateFlowchart={() => {
                appController.parseCurrentCode();
              }}
              onExport={(fmt, element) => handleExport(fmt, state.currentDiagram!, element)}
            />
          ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3 my-auto">
              <span className="material-symbols-outlined text-[48px] text-[#4cd7f6]">account_tree</span>
              <p className="text-sm text-[#bcc9cd]">{t('editor.noFlowchart', state.academicSettings.appLanguage)}</p>
              <button
                onClick={() => requestNavigation(() => appController.createNewFlowchart())}
                className="px-4 py-2 bg-[#06b6d4] text-[#060e20] rounded-lg font-semibold text-xs"
              >
                {t('dashboard.createNewFlowchart', state.academicSettings.appLanguage)}
              </button>
            </div>
          )
        )}

        {state.activeTab === 'templates' && (
          <TemplatesView onLoadTemplate={handleLoadTemplate} appLanguage={state.academicSettings.appLanguage} />
        )}

        {state.activeTab === 'settings' && (
          <SettingsView
            settings={state.academicSettings}
            syncStatus={state.syncStatus}
            onOpenSettingsModal={() => appController.setHomeworkModalOpen(true)}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onSyncNow={handleSyncNow}
            onUpdateSettings={(newSettings) => appController.saveAcademicSettings(newSettings)}
          />
        )}
      </main>

      {/* Academic Homework Settings Modal Dialog */}
      <HomeworkSettingsModal
        isOpen={state.isHomeworkModalOpen}
        settings={state.academicSettings}
        onClose={() => appController.setHomeworkModalOpen(false)}
        onSave={(newSettings) => appController.saveAcademicSettings(newSettings)}
      />

      {/* Fixed Bottom Ergonomic Navigation Bar */}
      <NavigationBar
        activeTab={state.activeTab}
        onTabChange={(tab) => requestNavigation(() => appController.setActiveTab(tab))}
        appLanguage={state.academicSettings.appLanguage}
      />

      {/* Unsaved Changes Modal */}
      {pendingAction && (
        <div className="fixed inset-0 bg-[#060e20]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#334155] rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h2 className="text-lg font-bold text-[#dae2fd]">{t('app.unsavedWarning', state.academicSettings.appLanguage)}</h2>
            </div>
            <p className="text-sm text-[#bcc9cd] font-medium leading-relaxed">
              {t('app.unsavedDesc', state.academicSettings.appLanguage)}
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  appController.saveCurrentProject().then(() => {
                    setPendingAction(null);
                    pendingAction();
                  });
                }}
                className="w-full py-2 bg-[#06b6d4] text-[#060e20] font-semibold rounded hover:brightness-110 cursor-pointer"
              >
                {t('app.saveAndExit', state.academicSettings.appLanguage)}
              </button>
              <button
                onClick={() => {
                  appController.discardChanges();
                  setPendingAction(null);
                  pendingAction();
                }}
                className="w-full py-2 bg-[#93000a] text-[#ffdad6] font-semibold rounded hover:brightness-110 cursor-pointer"
              >
                {t('app.exitWithoutSaving', state.academicSettings.appLanguage)}
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="w-full py-2 bg-[#222a3d] text-[#bcc9cd] font-semibold rounded hover:bg-[#2d3449] cursor-pointer"
              >
                {t('common.cancel', state.academicSettings.appLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Update Banner */}
      <PwaUpdateBanner 
        appLanguage={state.academicSettings.appLanguage || 'en'} 
        onUpdateRequested={(performUpdate) => requestNavigation(performUpdate)}
      />
    </div>
  );
}
