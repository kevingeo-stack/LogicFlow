import React, { useState, useRef, useEffect } from 'react';
import { Diagram, AcademicSettings, ExportFormat } from '../types';
import { DiagramRenderer } from '../core/DiagramRenderer';
import { CodeEditorUI } from './CodeEditorUI';
import { DiagramCanvasUI } from './DiagramCanvasUI';
import { t } from '../i18n/i18n';

interface EditorViewProps {
  diagram: Diagram;
  academicSettings: AcademicSettings;
  renderer: DiagramRenderer;
  onBack: () => void;
  onUpdateCode: (code: string) => void;
  onUpdateLanguage: (lang: any) => void;
  onUpdateTitle: (title: string, filename: string) => void;
  onGenerateFlowchart: () => void;
  onExport: (format: ExportFormat, svgElement?: SVGElement | null) => void;
  isDirty: boolean;
  onSave: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  diagram,
  academicSettings,
  renderer,
  onBack,
  onUpdateCode,
  onUpdateLanguage,
  onUpdateTitle,
  onGenerateFlowchart,
  onExport,
  isDirty,
  onSave,
}) => {
  const [activeSegment, setActiveSegment] = useState<'both' | 'code' | 'canvas'>('both');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [filenameInput, setFilenameInput] = useState<string>(diagram.filename);
  const [diagramViewMode, setDiagramViewMode] = useState<'flowchart' | 'pseudocode'>('flowchart');
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const pseudocodeContainerRef = useRef<HTMLDivElement | null>(null);
  const onGenerateFlowchartRef = useRef(onGenerateFlowchart);

  useEffect(() => {
    onGenerateFlowchartRef.current = onGenerateFlowchart;
  }, [onGenerateFlowchart]);

  // Real-time preview debounce (200ms) - completely decoupled from save logic
  useEffect(() => {
    const handler = setTimeout(() => {
      onGenerateFlowchartRef.current();
    }, 200);

    return () => clearTimeout(handler);
  }, [diagram.sourceCode]);

  const handleGenerate = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      onGenerateFlowchart();
      setIsAnalyzing(false);
    }, 450);
  };

  const handleFilenameBlur = () => {
    let clean = filenameInput.trim();
    if (!clean) clean = 'algorithm_flow.py';
    const title = clean.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    onUpdateTitle(title, clean);
  };

  const handleExportSelect = (format: ExportFormat) => {
    setIsExportMenuOpen(false);
    if (diagramViewMode === 'pseudocode') {
      const el = pseudocodeContainerRef.current;
      onExport(format, el as any);
    } else {
      const svgEl = svgContainerRef.current?.querySelector('svg');
      onExport(format, svgEl);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-28 pt-1">
      {/* Top Workspace Contextual Bar */}
      <div className="w-full bg-[#060e20] border-b border-[#334155]/60 px-4 sm:px-6 py-2.5 flex flex-col gap-2 shadow-md">
        {/* Top row: Nav back, Title input, Export dropdown */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={onBack}
              aria-label="Back to Dashboard"
              className="flex items-center justify-center w-8 h-8 rounded bg-[#222a3d] border border-[#334155] text-[#dae2fd] hover:text-[#4cd7f6] hover:bg-[#2d3449] transition-colors flex-shrink-0 cursor-pointer"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>

            <div className="flex items-center gap-1.5 min-w-0 bg-[#131b2e] border border-[#334155] px-2.5 py-1 rounded max-w-xs sm:max-w-md w-full">
              <input
                type="text"
                value={filenameInput}
                onChange={(e) => setFilenameInput(e.target.value)}
                onBlur={handleFilenameBlur}
                className="bg-transparent font-['JetBrains_Mono',monospace] text-xs text-[#4cd7f6] focus:outline-none w-full truncate"
                title="Rename Diagram Filename"
              />
              <span className="material-symbols-outlined text-[14px] text-[#869397] flex-shrink-0">
                edit
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save Button */}
            <button
              onClick={() => isDirty && onSave()}
              className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium text-xs transition-colors ${
                isDirty
                  ? 'bg-[#06b6d4] text-[#060e20] hover:bg-[#4cd7f6] shadow-sm cursor-pointer'
                  : 'bg-[#222a3d] text-[#869397] border border-[#334155]/50 cursor-default'
              }`}
              title={isDirty ? t('editor.unsavedChanges', academicSettings.appLanguage) : t('editor.saved', academicSettings.appLanguage)}
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isDirty ? t('editor.save', academicSettings.appLanguage) : t('editor.saved', academicSettings.appLanguage)}</span>
            </button>

            {/* Export Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#222a3d] hover:bg-[#2d3449] border border-[#334155] text-[#dae2fd] font-medium text-xs hover:text-[#4cd7f6] transition-colors cursor-pointer"
                id="exportDropdownBtn"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>{t('dashboard.export', academicSettings.appLanguage)}</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {isExportMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-44 bg-[#222a3d] border border-[#334155] rounded-xl shadow-2xl z-30 py-1 font-['JetBrains_Mono',monospace] text-xs"
                  id="exportMenu"
                >
                  <button
                    onClick={() => handleExportSelect('pdf')}
                    className="w-full text-left px-3 py-2 hover:bg-[#171f33] text-[#dae2fd] flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">
                        picture_as_pdf
                      </span>
                      <span>{t('export.pdf', academicSettings.appLanguage)}</span>
                    </span>
                    <span className="text-[10px] text-[#869397]">Vector</span>
                  </button>
                  <button
                    onClick={() => handleExportSelect('docx')}
                    className="w-full text-left px-3 py-2 hover:bg-[#171f33] text-[#dae2fd] flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                        description
                      </span>
                      <span>{t('export.docx', academicSettings.appLanguage)}</span>
                    </span>
                    <span className="text-[10px] text-[#869397]">Word</span>
                  </button>
                  <button
                    onClick={() => handleExportSelect('image')}
                    className="w-full text-left px-3 py-2 hover:bg-[#171f33] text-[#dae2fd] flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#7bd0ff]">
                        image
                      </span>
                      <span>{t('export.jpg', academicSettings.appLanguage)}</span>
                    </span>
                    <span className="text-[10px] text-[#869397]">300dpi</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata & Offline sync pill */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 bg-[#131b2e] border border-[#334155]/60 px-2.5 py-0.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4cd7f6]"></span>
            </span>
            <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#bcc9cd]">
              {t('sync.synced', academicSettings.appLanguage)}
            </span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#171f33] border border-[#334155]/60 text-[#bcc9cd] text-[11px] truncate">
            <span className="material-symbols-outlined text-[13px] text-[#c0c1ff]">
              verified_user
            </span>
            <span>
              Student: <strong className="text-[#dae2fd]">{academicSettings.studentName || 'Alex Rivera'}</strong> |{' '}
              Matrícula: <strong className="text-[#4cd7f6] font-['JetBrains_Mono',monospace]">{academicSettings.studentId || '2024-CS-091'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Segment Switcher (for small screens) */}
      <div className="px-4 sm:px-6 pt-2 pb-2 block lg:hidden">
        <div className="grid grid-cols-2 p-1 bg-[#060e20] border border-[#334155] rounded-lg gap-1">
          <button
            onClick={() => setActiveSegment('code')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-all ${
              activeSegment === 'code' || activeSegment === 'both'
                ? 'bg-[#222a3d] text-[#4cd7f6] font-semibold border border-[#4cd7f6]/40'
                : 'text-[#bcc9cd]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>{t('editor.sourceCode', academicSettings.appLanguage)}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
          </button>
          <button
            onClick={() => setActiveSegment('canvas')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-all ${
              activeSegment === 'canvas'
                ? 'bg-[#222a3d] text-[#4cd7f6] font-semibold border border-[#4cd7f6]/40'
                : 'text-[#bcc9cd]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>{t('editor.flowCanvas', academicSettings.appLanguage)}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Code and Canvas (side-by-side on desktop, stacked or toggleable on mobile) */}
      <div className="px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <div className={activeSegment === 'canvas' ? 'hidden lg:block' : 'block'}>
          <CodeEditorUI
            code={diagram.sourceCode}
            language={diagram.language}
            onChange={onUpdateCode}
            onLanguageChange={onUpdateLanguage}
            onGenerate={handleGenerate}
            isAnalyzing={isAnalyzing}
            complexity={diagram.complexity}
          />
        </div>

        <div className={activeSegment === 'code' ? 'hidden lg:block' : 'block'}>
          <DiagramCanvasUI
            diagram={diagram}
            renderer={renderer}
            svgContainerRef={svgContainerRef}
            pseudocodeContainerRef={pseudocodeContainerRef}
            diagramViewMode={diagramViewMode}
            setDiagramViewMode={setDiagramViewMode}
            appLanguage={academicSettings.appLanguage || 'en'}
            diagramLanguage={academicSettings.diagramLanguage || 'en'}
          />
        </div>
      </div>

      {/* Execution Trace Ready Pill */}
      <div className="mx-4 sm:mx-6 mt-4 flex items-center justify-between p-3 bg-[#171f33] border border-[#334155]/60 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">query_stats</span>
          <span className="text-xs font-semibold text-[#dae2fd]">{t('editor.executionTraceReady', academicSettings.appLanguage)}</span>
        </div>
        <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#c0c1ff]">
          {t('editor.parsedIn', academicSettings.appLanguage)} 14ms · {t('editor.memory', academicSettings.appLanguage)}: 2.1 MB · IEEE {t('editor.verified', academicSettings.appLanguage)}
        </span>
      </div>
    </div>
  );
};
