import React, { useState } from 'react';
import { Diagram, AcademicSettings, ExportFormat } from '../types';
import { formatDisplayDate } from '../utils/timeUtils';
import { SyncStatus } from '../db/FirestoreSync';
import { t } from '../i18n/i18n';

interface DashboardViewProps {
  diagrams: Diagram[];
  academicSettings: AcademicSettings;
  syncStatus: SyncStatus;
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onSelectDiagram: (id: string) => void;
  onCreateNew: () => void;
  onDeleteDiagram: (id: string) => void;
  onOpenSettings: () => void;
  onExport: (format: ExportFormat, diagram: Diagram) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  diagrams,
  academicSettings,
  syncStatus,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onSelectDiagram,
  onCreateNew,
  onDeleteDiagram,
  onOpenSettings,
  onExport,
}) => {
  const [activeExportMenu, setActiveExportMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = [
    t('dashboard.all', academicSettings.appLanguage),
    t('dashboard.python', academicSettings.appLanguage),
    t('dashboard.cpp', academicSettings.appLanguage),
    t('dashboard.java', academicSettings.appLanguage),
    t('dashboard.algorithms', academicSettings.appLanguage),
    t('dashboard.dataStructures', academicSettings.appLanguage)
  ];

  const filteredDiagrams = diagrams.filter((diag) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      diag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diag.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diag.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diag.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === t('dashboard.all', academicSettings.appLanguage) ||
      diag.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      diag.language.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteDiagram(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
      }, 3500);
    }
  };

  const getLangDotColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'python':
        return 'bg-[#4cd7f6]';
      case 'cpp':
      case 'c++':
        return 'bg-[#c0c1ff]';
      case 'java':
        return 'bg-[#7bd0ff]';
      default:
        return 'bg-[#06b6d4]';
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 max-w-4xl mx-auto space-y-4 pt-2 pb-28">
      {/* Academic Homework Quick Context Banner */}
      <div className="relative overflow-hidden bg-[#131b2e] border border-[#334155]/60 rounded-xl p-3.5 shadow-md flex items-center justify-between">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#06b6d4]/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-3 min-w-0 z-10">
          <div className="w-10 h-10 rounded-lg bg-[#222a3d] border border-[#334155] flex items-center justify-center text-[#4cd7f6] flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold text-[#869397] uppercase tracking-wider truncate">
              Active Context
            </span>
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs sm:text-sm font-semibold text-[#dae2fd] truncate">
                {academicSettings.subject || 'CS-302: Algorithms & Complexity'}
              </span>
              <span className="bg-[#2d3449] border border-[#334155] text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-[10px] px-1.5 py-0.5 rounded flex-shrink-0">
                {academicSettings.studentId || 'A01284920'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Edit Template"
          className="flex items-center gap-1 bg-[#222a3d] hover:bg-[#2d3449] text-[#4cd7f6] border border-[#334155] px-2.5 py-1.5 rounded-lg transition-colors z-10 flex-shrink-0 text-xs font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          <span>Edit</span>
        </button>
      </div>

      {/* Telemetry & Academic Status Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total Works */}
        <div className="bg-[#171f33] border border-[#334155]/60 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#bcc9cd]">
            <span className="text-[11px] font-medium">Total Works</span>
            <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">folder_special</span>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-[#dae2fd]">
              {String(diagrams.length).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#869397] block truncate">
              Saved Graphs
            </span>
          </div>
        </div>

        {/* Portal Sync */}
        <div className="bg-[#171f33] border border-[#334155]/60 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#bcc9cd]">
            <span className="text-[11px] font-medium">Portal Sync</span>
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus.isOnline ? 'bg-[#4cd7f6] animate-ping' : 'bg-[#ffb4ab]'
              }`}
            ></span>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1 text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[16px]">
                {syncStatus.isOnline ? 'cloud_done' : 'cloud_off'}
              </span>
              <span className="text-xs font-semibold">
                {syncStatus.isOnline ? t('sync.synced', academicSettings.appLanguage) : t('sync.offline', academicSettings.appLanguage)}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#869397] block truncate">
              {syncStatus.user ? syncStatus.user.email?.split('@')[0] : 'Univ LMS Core'}
            </span>
          </div>
        </div>

        {/* Standard */}
        <div className="bg-[#171f33] border border-[#334155]/60 rounded-lg p-2.5 sm:p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#bcc9cd]">
            <span className="text-[11px] font-medium">Standard</span>
            <span className="material-symbols-outlined text-[16px] text-[#7bd0ff]">verified</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-[#7bd0ff] block">
              {(academicSettings.templateStyle || 'IEEE').toUpperCase()} Compliant
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#869397] block truncate">
              Formal Logic
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filtering Strip */}
      <div className="flex flex-col space-y-2">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#869397]">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('dashboard.search', academicSettings.appLanguage)}
            className="w-full bg-[#060e20] border border-[#334155] text-[#dae2fd] font-['JetBrains_Mono',monospace] text-xs rounded-lg pl-9 pr-12 py-2 focus:outline-none focus:border-[#4cd7f6] transition-all placeholder:text-[#869397]"
            id="diagram-search"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#869397] bg-[#171f33] border border-[#334155] px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`filter-pill px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#4cd7f6] text-[#003640] font-semibold shadow-sm'
                    : 'bg-[#171f33] text-[#bcc9cd] hover:text-[#dae2fd] border border-[#334155]/60'
                }`}
              >
                {cat !== t('dashboard.all', academicSettings.appLanguage) && (
                  <span className={`w-1.5 h-1.5 rounded-full ${getLangDotColor(cat)}`}></span>
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flowcharts Interactive List */}
      <div className="flex flex-col space-y-3 pt-1">
        {filteredDiagrams.length === 0 ? (
          <div className="p-8 text-center bg-[#131b2e] border border-[#334155]/60 rounded-xl flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#869397]">folder_open</span>
            <p className="text-xs text-[#bcc9cd]">No flowcharts match your search or filter.</p>
            <button
              onClick={onCreateNew}
              className="mt-2 px-3 py-1.5 bg-[#4cd7f6] text-[#003640] rounded-lg text-xs font-semibold"
            >
              {t('dashboard.createNewFlowchart', academicSettings.appLanguage)}
            </button>
          </div>
        ) : (
          filteredDiagrams.map((diag) => (
            <div
              key={diag.id}
              className="diagram-card bg-[#131b2e] border border-[#334155]/60 rounded-xl p-3.5 sm:p-4 shadow-md hover:border-[#4cd7f6]/50 transition-all flex flex-col gap-3 group"
            >
              {/* Card Header: Language, Filename, Title, Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#222a3d] border border-[#334155] text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${getLangDotColor(diag.language)}`}></span>
                      <span>{diag.language.toUpperCase()}</span>
                    </span>
                    <span className="text-[#869397] text-xs">·</span>
                    <span className="text-[#bcc9cd] font-['JetBrains_Mono',monospace] text-[11px] truncate">
                      {diag.filename}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-[#dae2fd] truncate">
                    {diag.title}
                  </h3>
                  <span className="text-[#869397] font-['JetBrains_Mono',monospace] text-[11px]">
                    {formatDisplayDate(diag.updatedAt)}
                  </span>
                </div>
                <div className="bg-[#2d3449] border border-[#334155] px-2 py-1 rounded text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-[10px] flex-shrink-0">
                  [{diag.statusBadge || 'STABLE'}]
                </div>
              </div>

              {/* Mini Graphic Flowchart Snippet Preview */}
              <div className="w-full bg-[#060e20] border border-[#334155]/50 rounded-lg p-2.5 overflow-hidden relative">
                <div className="flex items-center justify-between font-['JetBrains_Mono',monospace] text-[10px] text-[#869397] mb-2">
                  <span>AST Graph Pipeline</span>
                  <span>{diag.nodeCount} {t('dashboard.nodes', academicSettings.appLanguage)} · {diag.edgeCount} {t('dashboard.edges', academicSettings.appLanguage)}</span>
                </div>
                {/* Inline Micro Flow Visualizer */}
                <div className="flex items-center justify-center gap-2 py-1 overflow-x-auto">
                  {diag.pipelineNodes && diag.pipelineNodes.length > 0 ? (
                    diag.pipelineNodes.map((pNode, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className={`px-2 py-1 rounded font-['JetBrains_Mono',monospace] text-[10px] shadow-sm flex items-center gap-1 border border-[#334155]/60 ${
                            pNode.type === 'start'
                              ? 'bg-[#222a3d] text-[#4cd7f6]'
                              : pNode.type === 'decision'
                              ? 'bg-[#2d3449] text-[#dae2fd]'
                              : 'bg-[#4cd7f6]/20 text-[#4cd7f6]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {pNode.icon}
                          </span>
                          <span>{pNode.label}</span>
                        </div>
                        {idx < diag.pipelineNodes.length - 1 && (
                          <span className="text-[#869397] text-[12px]">→</span>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="bg-[#222a3d] px-2 py-1 rounded text-[#4cd7f6] text-[10px]">Start</div>
                      <span className="text-[#869397]">→</span>
                      <div className="bg-[#2d3449] px-2 py-1 rounded text-[#dae2fd] text-[10px]">Evaluate</div>
                      <span className="text-[#869397]">→</span>
                      <div className="bg-[#4cd7f6]/20 px-2 py-1 rounded text-[#4cd7f6] text-[10px]">Return</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Strip: Edit, Export Dropdown, Delete */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectDiagram(diag.id)}
                    aria-label="Edit Diagram"
                    className="flex items-center gap-1 bg-[#06b6d4] text-[#060e20] hover:bg-[#7bd0ff] px-3 py-1.5 rounded font-medium text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">account_tree</span>
                    <span>{t('dashboard.edit', academicSettings.appLanguage)}</span>
                  </button>

                  {/* Export Menu Container */}
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() =>
                        setActiveExportMenu((prev) => (prev === diag.id ? null : diag.id))
                      }
                      aria-label="Download Format"
                      className="flex items-center gap-1 bg-[#222a3d] hover:bg-[#2d3449] border border-[#334155] text-[#dae2fd] hover:text-[#4cd7f6] px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">file_download</span>
                      <span>{t('dashboard.export', academicSettings.appLanguage)}</span>
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>

                    {activeExportMenu === diag.id && (
                      <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-[#222a3d] border border-[#334155] shadow-2xl z-30 py-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => {
                            setActiveExportMenu(null);
                            onExport('pdf', diag);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-[#dae2fd] hover:bg-[#171f33] text-xs transition-colors text-left"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">
                            picture_as_pdf
                          </span>
                          <span>{t('export.pdf', academicSettings.appLanguage)}</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveExportMenu(null);
                            onExport('docx', diag);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-[#dae2fd] hover:bg-[#171f33] text-xs transition-colors text-left"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                            description
                          </span>
                          <span>{t('export.docx', academicSettings.appLanguage)}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(diag.id)}
                  aria-label={confirmDeleteId === diag.id ? `Confirm delete ${diag.title}` : `Delete ${diag.title}`}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    confirmDeleteId === diag.id
                      ? 'bg-[#93000a] text-[#ffdad6]'
                      : 'text-[#ffb4ab] bg-[#93000a]/30 hover:bg-[#93000a] hover:text-[#ffdad6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {confirmDeleteId === diag.id ? 'warning' : 'delete'}
                  </span>
                  <span>{confirmDeleteId === diag.id ? `${t('dashboard.delete', academicSettings.appLanguage)} '${diag.title}'?` : t('dashboard.delete', academicSettings.appLanguage)}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky Bottom High-Contrast Floating Action Bar */}
      <div className="fixed bottom-20 left-0 w-full px-4 sm:px-6 flex justify-center z-30 pointer-events-none">
        <button
          onClick={onCreateNew}
          className="pointer-events-auto flex items-center justify-center gap-2 w-full max-w-sm bg-gradient-to-r from-[#4cd7f6] via-[#06b6d4] to-[#7bd0ff] text-[#060e20] py-3 px-6 rounded-full shadow-[0_4px_24px_rgba(6,182,212,0.45)] hover:shadow-[0_6px_32px_rgba(6,182,212,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all group font-semibold text-sm sm:text-base cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px] transition-transform group-hover:rotate-90">
            add_circle
          </span>
          <span>{t('dashboard.createNewFlowchart', academicSettings.appLanguage)}</span>
        </button>
      </div>
    </div>
  );
};
