import React, { useState, useEffect } from 'react';
import { AcademicSettings, TemplateStyle } from '../types';
import { t } from '../i18n/i18n';

interface HomeworkSettingsModalProps {
  isOpen: boolean;
  settings: AcademicSettings;
  onClose: () => void;
  onSave: (settings: AcademicSettings) => void;
}

export const HomeworkSettingsModal: React.FC<HomeworkSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<AcademicSettings>(settings);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const getPreviewTimestamp = () => {
    if (!formData.autoTimestamp) return null;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `${dateStr} • ${timeStr} CST`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Blurred Backdrop Veil */}
      <div
        className="fixed inset-0 bg-[#060e20]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-[#171f33] border border-[#334155] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header Banner */}
        <div className="p-4 sm:p-5 bg-[#222a3d]/70 border-b border-[#334155]/60 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2d3449] flex items-center justify-center text-[#4cd7f6] shadow-sm flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-semibold text-[#dae2fd] tracking-tight">
                {t('settings.title', settings.appLanguage)}
              </h2>
              <p className="text-xs text-[#bcc9cd] mt-0.5 leading-snug">
                Configure automated academic headers for assignment submissions & PDF/DOCX exports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#2d3449] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Student Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#bcc9cd] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">person</span>
              {t('settings.studentName', settings.appLanguage)}
            </label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              placeholder="e.g. Alex Rivera Santiago"
              className="w-full h-10 px-3 rounded-lg bg-[#060e20] border border-[#334155] text-[#dae2fd] text-xs sm:text-sm focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6] transition-all"
            />
          </div>

          {/* Student ID / Matrícula */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#bcc9cd] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">badge</span>
              {t('settings.studentId', settings.appLanguage)}
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              placeholder="e.g. A01783921"
              className="w-full h-10 px-3 rounded-lg bg-[#060e20] border border-[#334155] text-[#4cd7f6] font-['JetBrains_Mono',monospace] text-xs sm:text-sm tracking-wider focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6] transition-all"
            />
          </div>

          {/* Subject / Class Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#bcc9cd] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">menu_book</span>
              {t('settings.subject', settings.appLanguage)}
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. CS-302: Algorithms & Complexity"
              className="w-full h-10 px-3 rounded-lg bg-[#060e20] border border-[#334155] text-[#dae2fd] text-xs sm:text-sm focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6] transition-all"
            />
          </div>

          {/* Professor Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[#bcc9cd] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#c0c1ff]">psychology</span>
                {t('settings.professor', settings.appLanguage)}
              </label>
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#c0c1ff] bg-[#222a3d] px-1.5 py-0.5 rounded border border-[#334155]">
                Bonus Field
              </span>
            </div>
            <input
              type="text"
              value={formData.professor}
              onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
              placeholder="e.g. Dr. Evelyn Vance"
              className="w-full h-10 px-3 rounded-lg bg-[#060e20] border border-[#334155] text-[#dae2fd] text-xs sm:text-sm focus:outline-none focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] transition-all"
            />
          </div>

          {/* Export Header Template Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#bcc9cd] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">style</span>
              Export Header Template Style
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#060e20] rounded-lg border border-[#334155]">
              {(['ieee', 'formal', 'minimal'] as TemplateStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setFormData({ ...formData, templateStyle: style })}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded text-xs transition-all ${
                    formData.templateStyle === style
                      ? 'bg-[#222a3d] text-[#4cd7f6] font-semibold shadow-sm border border-[#4cd7f6]/40'
                      : 'text-[#bcc9cd] hover:text-[#dae2fd]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] mb-0.5">
                    {style === 'ieee' ? 'article' : style === 'formal' ? 'account_balance' : 'terminal'}
                  </span>
                  <span>{style === 'ieee' ? 'IEEE Standard' : style === 'formal' ? 'Univ. Formal' : 'Minimal Code'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timestamp Auto-Stamp Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#131b2e] border border-[#334155]/60">
            <div className="flex flex-col gap-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#4cd7f6]">schedule</span>
                <span className="text-xs sm:text-sm text-[#dae2fd] font-medium">
                  Automatic Submission Timestamp
                </span>
              </div>
              <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#869397]">
                Inject real-time ISO-8601 & local date hash into header
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.autoTimestamp}
                onChange={(e) => setFormData({ ...formData, autoTimestamp: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2d3449] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#003640] after:border-[#171f33] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4cd7f6]"></div>
            </label>
          </div>

          {/* Live Export Preview Tile */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#bcc9cd]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                <span>LIVE EXPORT PREVIEW (HEADER TILE)</span>
              </div>
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#869397]">Top of Page 1</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#060e20] border border-[#334155] shadow-inner flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-1 text-[#bcc9cd]">
                <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#4cd7f6] uppercase tracking-wider font-semibold">
                  {formData.subject || 'CS-302: ALGORITHMS & COMPLEXITY'}
                </span>
                {formData.autoTimestamp && (
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[#869397]">
                    {getPreviewTimestamp()}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-[#dae2fd]">
                  {formData.studentName || 'Student Full Name'}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#bcc9cd]">
                  <span className="font-['JetBrains_Mono',monospace] text-[#c0c1ff]">
                    ID: {formData.studentId || 'A01783921'}
                  </span>
                  <span className="text-[#3d494c]">•</span>
                  <span className="text-xs">
                    Instructor: {formData.professor || 'None Assigned'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#334155]/40 flex items-center justify-between text-[#869397]">
                <span className="font-['JetBrains_Mono',monospace] text-[9px] tracking-widest uppercase">
                  VERIFIED FLOWGENIUS DOCUMENT NODE • [{formData.templateStyle.toUpperCase()}]
                </span>
                <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-[#222a3d]/50 border-t border-[#334155]/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#bcc9cd] hover:text-[#dae2fd] hover:bg-[#2d3449] transition-colors"
          >
            {t('common.cancel', settings.appLanguage)}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#4cd7f6] to-[#c0c1ff] text-[#060e20] text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-[#06b6d4]/20 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {savedFeedback ? 'check_circle' : 'save'}
            </span>
            <span>{savedFeedback ? t('editor.saved', settings.appLanguage) : t('editor.save', settings.appLanguage)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
