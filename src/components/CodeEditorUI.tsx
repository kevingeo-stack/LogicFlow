import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorUIProps {
  code: string;
  language: string;
  onChange: (newCode: string) => void;
  onLanguageChange: (newLang: any) => void;
  onGenerate: () => void;
  isAnalyzing: boolean;
  complexity: string;
}

export const CodeEditorUI: React.FC<CodeEditorUIProps> = ({
  code,
  language,
  onChange,
  onLanguageChange,
  onGenerate,
  isAnalyzing,
  complexity,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => {
    onChange('');
  };

  const getMonacoLang = (lang: string) => {
    if (lang === 'cpp') return 'cpp';
    if (lang === 'java') return 'java';
    if (lang === 'javascript' || lang === 'js') return 'javascript';
    return 'python';
  };

  return (
    <section className="flex flex-col bg-[#060e20] rounded-xl shadow-lg border border-[#334155]/60 overflow-hidden" id="panelCode">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#131b2e] border-b border-[#334155]/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-[#222a3d] text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-xs px-2.5 py-1 pr-7 rounded appearance-none focus:outline-none focus:ring-1 focus:ring-[#4cd7f6] cursor-pointer border border-[#334155]"
            >
              <option value="python">Python 3.11</option>
              <option value="cpp">C++ 20</option>
              <option value="java">Java 17</option>
              <option value="javascript">JavaScript (Node)</option>
            </select>
            <span className="material-symbols-outlined absolute right-1.5 top-1 text-[16px] pointer-events-none text-[#4cd7f6]">
              expand_more
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#171f33] font-['JetBrains_Mono',monospace] text-[11px] text-[#869397]">
            UTF-8
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222a3d] hover:bg-[#2d3449] text-[#bcc9cd] hover:text-[#4cd7f6] text-xs font-medium transition-colors"
            title="Copy Source Code"
          >
            <span className="material-symbols-outlined text-[15px]">
              {copied ? 'done' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222a3d] hover:bg-[#2d3449] text-[#bcc9cd] hover:text-[#ffb4ab] text-xs font-medium transition-colors"
            title="Clear Buffer"
          >
            <span className="material-symbols-outlined text-[15px]">backspace</span>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="relative h-[280px] sm:h-[320px] bg-[#060e20] overflow-hidden">
        <Editor
          height="100%"
          language={getMonacoLang(language)}
          value={code}
          theme="vs-dark"
          onChange={(value) => onChange(value || '')}
          options={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-xs font-['JetBrains_Mono',monospace] text-[#4cd7f6]">
              <span className="material-symbols-outlined text-[18px] animate-spin mr-2">sync</span>
              Loading Monaco Editor...
            </div>
          }
        />
      </div>

      {/* Status Strip */}
      <div className="p-3 bg-[#131b2e] border-t border-[#334155]/50 flex items-center justify-between text-[11px] font-['JetBrains_Mono',monospace]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {isAnalyzing && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAnalyzing ? 'bg-[#4cd7f6]' : 'bg-[#06b6d4]'}`}></span>
          </span>
          <span className={isAnalyzing ? 'text-[#4cd7f6]' : 'text-[#869397]'}>
            {isAnalyzing ? 'Actualizando...' : 'Actualizado'}
          </span>
        </div>
        
        <span className="text-[#4cd7f6] font-medium">{complexity} Complexity</span>
      </div>
    </section>
  );
};
