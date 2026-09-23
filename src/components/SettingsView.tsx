import React from 'react';
import { AcademicSettings } from '../types';
import { SyncStatus } from '../db/FirestoreSync';
import { t } from '../i18n/i18n';

interface SettingsViewProps {
  settings: AcademicSettings;
  syncStatus: SyncStatus;
  onOpenSettingsModal: () => void;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onSyncNow: () => void;
  onUpdateSettings: (settings: AcademicSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  syncStatus,
  onOpenSettingsModal,
  onGoogleSignIn,
  onSignOut,
  onSyncNow,
  onUpdateSettings,
}) => {
  const handleAppLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, appLanguage: e.target.value as 'es' | 'en' });
  };

  const handleDiagramLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, diagramLanguage: e.target.value as 'es' | 'en' });
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 max-w-3xl mx-auto space-y-4 pt-2 pb-28">
      {/* Settings Header */}
      <div className="bg-[#131b2e] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#222a3d] border border-[#334155] flex items-center justify-center text-[#4cd7f6] flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#dae2fd] flex items-center gap-2">
              FlowGenius System & Academic Preferences
              <span className="bg-[#4cd7f6]/20 text-[#4cd7f6] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
              </span>
            </h2>
            <p className="text-xs text-[#bcc9cd] mt-0.5">
              Manage student identity, PWA offline cache, and Firebase Cloud storage
            </p>
          </div>
        </div>
      </div>

      {/* App Language Card */}
      <div className="bg-[#171f33] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#dae2fd] text-[20px]">language</span>
          <h3 className="text-sm font-semibold text-[#dae2fd]">{t('settings.section.appLanguage', settings.appLanguage) || 'Application Language'}</h3>
        </div>
        <div className="bg-[#060e20] border border-[#334155]/50 p-3 rounded-lg flex flex-col gap-2">
          <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
            {t('settings.appLanguage', settings.appLanguage)}
          </span>
          <select
            value={settings.appLanguage || 'es'}
            onChange={handleAppLanguageChange}
            className="bg-[#171f33] border border-[#334155] text-[#dae2fd] rounded px-2 py-2 text-sm focus:outline-none focus:border-[#4cd7f6]"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Diagram Language Card */}
      <div className="bg-[#171f33] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">account_tree</span>
          <h3 className="text-sm font-semibold text-[#dae2fd]">{t('settings.diagramLanguage', settings.appLanguage)}</h3>
        </div>
        <div className="bg-[#060e20] border border-[#334155]/50 p-3 rounded-lg flex flex-col gap-2">
          <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
            {t('settings.diagramLanguage', settings.appLanguage)}
          </span>
          <select
            value={settings.diagramLanguage || 'en'}
            onChange={handleDiagramLanguageChange}
            className="bg-[#171f33] border border-[#334155] text-[#dae2fd] rounded px-2 py-2 text-sm focus:outline-none focus:border-[#4cd7f6]"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* 1. Academic Identity Card */}
      <div className="bg-[#171f33] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">school</span>
            <h3 className="text-sm font-semibold text-[#dae2fd]">Active Academic Identity</h3>
          </div>
          <button
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1 bg-[#222a3d] hover:bg-[#2d3449] border border-[#334155] text-[#4cd7f6] px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Configure</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <div className="bg-[#060e20] border border-[#334155]/50 p-3 rounded-lg">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              {t('settings.studentName', settings.appLanguage)}
            </span>
            <span className="text-sm font-semibold text-[#dae2fd] block mt-0.5">
              {settings.studentName || 'Alex Rivera Santiago'}
            </span>
          </div>

          <div className="bg-[#060e20] border border-[#334155]/50 p-3 rounded-lg">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              {t('settings.studentId', settings.appLanguage)}
            </span>
            <span className="text-sm font-mono text-[#4cd7f6] block mt-0.5">
              {settings.studentId || 'A01783921'}
            </span>
          </div>

          <div className="bg-[#060e20] border border-[#334155]/50 p-3 rounded-lg">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              {t('settings.subject', settings.appLanguage)}
            </span>
            <span className="text-xs font-medium text-[#dae2fd] block mt-0.5">
              {settings.subject || 'CS-302: Algorithms & Complexity'}
            </span>
          </div>

          <div className="bg-[#060e20] border border-[#334155]/50 p-3 rounded-lg">
            <span className="text-[10px] text-[#869397] uppercase tracking-wider block">
              {t('settings.professor', settings.appLanguage)}
            </span>
            <span className="text-xs font-medium text-[#dae2fd] block mt-0.5">
              {settings.professor || 'Dr. Evelyn Vance'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cloud Synchronization & Firebase Integration */}
      <div className="bg-[#171f33] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7bd0ff] text-[20px]">cloud_sync</span>
            <h3 className="text-sm font-semibold text-[#dae2fd]">
              Cloud Sync & Firebase Authentication
            </h3>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${
              syncStatus.isOnline
                ? 'bg-[#003640] border-[#00687a] text-[#4cd7f6]'
                : 'bg-[#93000a]/30 border-[#ffb4ab]/30 text-[#ffb4ab]'
            }`}
          >
            {syncStatus.isOnline ? t('sync.online', settings.appLanguage) : t('sync.offline', settings.appLanguage)}
          </span>
        </div>

        <p className="text-xs text-[#bcc9cd] leading-relaxed">
          FlowGenius stores your AST algorithms in local IndexedDB first for 100% offline
          speed, and securely syncs to Firestore at{' '}
          <code className="text-[#4cd7f6] bg-[#060e20] px-1 py-0.5 rounded text-[11px]">
            users/&#123;userId&#125;/diagrams/&#123;diagramId&#125;
          </code>{' '}
          when online.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#334155]/40 flex-wrap gap-2">
          {syncStatus.user ? (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">
                account_circle
              </span>
              <span className="text-xs text-[#dae2fd]">
                {syncStatus.user.email || 'Authenticated User'}
              </span>
              <button
                onClick={onSignOut}
                className="text-xs text-[#ffb4ab] hover:underline ml-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#4cd7f6] text-[#003640] hover:bg-[#7bd0ff] rounded-lg text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>Sign in with Google</span>
            </button>
          )}

          <button
            onClick={onSyncNow}
            disabled={syncStatus.isSyncing || !syncStatus.isOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222a3d] hover:bg-[#2d3449] border border-[#334155] text-[#4cd7f6] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                syncStatus.isSyncing ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* 3. PWA Offline Architecture & Service Worker */}
      <div className="bg-[#171f33] border border-[#334155]/60 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">offline_pin</span>
          <h3 className="text-sm font-semibold text-[#dae2fd]">PWA & Offline Architecture</h3>
        </div>

        <div className="space-y-2 text-xs text-[#bcc9cd]">
          <div className="flex items-center justify-between p-2 rounded bg-[#060e20] border border-[#334155]/40">
            <span>Service Worker Cache</span>
            <span className="text-[#4cd7f6] font-mono">ACTIVE (Cache-First Shell)</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#060e20] border border-[#334155]/40">
            <span>IndexedDB Engine</span>
            <span className="text-[#4cd7f6] font-mono">flowgenius_db (v1)</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#060e20] border border-[#334155]/40">
            <span>Mermaid.js Renderer</span>
            <span className="text-[#4cd7f6] font-mono">100% Client-Side Vector SVG</span>
          </div>
        </div>
      </div>
    </div>
  );
};
