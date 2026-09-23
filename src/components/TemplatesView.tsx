import React, { useState } from 'react';
import { AppLanguage, FlowTemplate, TemplateCategory } from '../types';
import { t } from '../i18n/i18n';
import { getTemplatesByCategory } from '../core/TemplateRegistry';

interface TemplatesViewProps {
  onLoadTemplate: (template: FlowTemplate) => void;
  appLanguage?: AppLanguage;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onLoadTemplate, appLanguage }) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  const templates = getTemplatesByCategory(selectedCategory);

  const categories: { id: TemplateCategory | 'all', labelKey: string }[] = [
    { id: 'all', labelKey: 'templates.category.all' },
    { id: 'basics', labelKey: 'templates.category.basics' },
    { id: 'conditionals', labelKey: 'templates.category.conditionals' },
    { id: 'loops', labelKey: 'templates.category.loops' },
    { id: 'algorithms', labelKey: 'templates.category.algorithms' },
    { id: 'practical', labelKey: 'templates.category.practical' }
  ];

  const getCategoryIcon = (cat: TemplateCategory | 'all') => {
    switch (cat) {
      case 'basics': return 'emoji_objects';
      case 'conditionals': return 'call_split';
      case 'loops': return 'laps';
      case 'algorithms': return 'psychology';
      case 'practical': return 'construction';
      default: return 'grid_view';
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 max-w-5xl mx-auto space-y-5 pt-4 pb-28">
      {/* Header Banner */}
      <div className="bg-[#131b2e] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#222a3d] border border-[#334155] flex items-center justify-center text-[#7bd0ff] flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">library_books</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#dae2fd]">
              {t('templates.title', appLanguage)}
            </h2>
            <p className="text-xs text-[#bcc9cd] mt-0.5">
              {t('templates.description', appLanguage)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              selectedCategory === cat.id
                ? 'bg-[#06b6d4] text-[#060e20] border-[#06b6d4] shadow-sm'
                : 'bg-[#171f33] text-[#bcc9cd] border-[#334155]/60 hover:border-[#4cd7f6]/50 hover:text-[#dae2fd]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {getCategoryIcon(cat.id)}
            </span>
            {t(cat.labelKey, appLanguage)}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      {templates.length === 0 ? (
        <div className="text-center py-12 text-[#869397]">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
          <p className="text-sm">No templates found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#171f33] border border-[#334155]/60 hover:border-[#4cd7f6]/50 rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                      {getCategoryIcon(tpl.category)}
                    </span>
                    <span className="text-[10px] text-[#869397] font-semibold uppercase tracking-wide">
                      {t(`templates.category.${tpl.category}`, appLanguage)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {tpl.supportedLanguages.map(lang => (
                      <span
                        key={lang}
                        className="px-1.5 py-0.5 rounded bg-[#222a3d] border border-[#334155] text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-[9px] font-semibold uppercase"
                        title={lang}
                      >
                        {lang === 'python' ? 'PY' : lang === 'javascript' ? 'JS' : lang === 'cpp' ? 'C++' : 'JAVA'}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-[#dae2fd] mb-1.5">
                  {t(tpl.titleKey, appLanguage)}
                </h3>
                <p className="text-xs text-[#bcc9cd] leading-relaxed mb-4">
                  {t(tpl.descriptionKey, appLanguage)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="bg-[#060e20] rounded border border-[#334155]/40 p-2 overflow-hidden h-16 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060e20] z-10"></div>
                  <pre className="text-[9px] font-['JetBrains_Mono',monospace] text-[#869397] leading-tight">
                    {Object.values(tpl.sourceCode)[0]}
                  </pre>
                </div>
                
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onLoadTemplate(tpl)}
                    className="flex items-center gap-1 bg-[#06b6d4] text-[#060e20] hover:bg-[#7bd0ff] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm w-full justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>{t('templates.loadInEditor', appLanguage) || 'Use template'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
