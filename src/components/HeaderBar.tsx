import React from 'react';
import { ActiveTab, AppLanguage } from '../types';
import { SyncStatus } from '../db/FirestoreSync';
import { t } from '../i18n/i18n';

interface HeaderBarProps {
  activeTab: ActiveTab;
  onOpenSettingsModal: () => void;
  syncStatus: SyncStatus;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  appLanguage?: AppLanguage;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onOpenSettingsModal,
  syncStatus,
  onGoogleSignIn,
  onSignOut,
  appLanguage,
}) => {
  const getTabLabel = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard': return t('nav.dashboard', appLanguage);
      case 'editor': return t('nav.editor', appLanguage);
      case 'templates': return t('nav.templates', appLanguage);
      case 'settings': return t('nav.settings', appLanguage);
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-[#060e20]/90 backdrop-blur-xl border-b border-[#334155]/60 shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand and Current Mode */}
        <div className="flex items-center gap-3">
          <img
            alt="FlowGenius Logo"
            className="h-9 w-9 rounded-xl shadow-md border border-[#334155]/60 object-contain bg-[#0b1326] p-0.5"
            src="/icon.svg"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm sm:text-base text-[#dae2fd] tracking-tight">
                FlowGenius
              </span>
              <span className="px-1.5 py-0.2 bg-[#222a3d] border border-[#334155] rounded text-[10px] font-['JetBrains_Mono',monospace] text-[#4cd7f6] font-medium">
                PWA
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus.isOnline ? 'bg-[#4cd7f6] animate-pulse' : 'bg-[#ffb4ab]'
                }`}
              ></span>
              <span className="text-[11px] text-[#bcc9cd] font-medium">
                {getTabLabel(activeTab)} · {syncStatus.isOnline ? t('sync.online', appLanguage) : t('sync.offline', appLanguage)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Tools: Homework Settings, Sync Status, User Auth */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onOpenSettingsModal}
            aria-label="Homework Settings"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#222a3d] transition-colors"
            title="Configure Academic Homework Settings"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>

          <button
            onClick={() => alert(`FlowGenius Offline-First Status: ${syncStatus.isOnline ? 'Connected to Cloud' : 'Working Offline (IndexedDB Active)'}. AST Engine ready.`)}
            aria-label="Help & Notifications"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#bcc9cd] hover:text-[#4cd7f6] hover:bg-[#222a3d] transition-colors"
            title="System Telemetry & Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </button>

          {/* User Profile / Auth Button */}
          {syncStatus.user ? (
            <div className="relative group ml-1">
              <button
                className="w-8 h-8 rounded-full border border-[#4cd7f6] overflow-hidden flex items-center justify-center bg-[#003640] text-[#4cd7f6]"
                title={`Signed in as ${syncStatus.user.displayName || syncStatus.user.email}`}
              >
                {syncStatus.user.photoURL ? (
                  <img
                    src={syncStatus.user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                )}
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-[#171f33] border border-[#334155] rounded-xl shadow-2xl p-2 z-50">
                <div className="px-2 py-1 text-xs text-[#bcc9cd] border-b border-[#334155]/50 truncate">
                  {syncStatus.user.email || 'Student Account'}
                </div>
                <button
                  onClick={onSignOut}
                  className="w-full text-left px-2 py-1.5 text-xs text-[#ffb4ab] hover:bg-[#222a3d] rounded transition-colors mt-1"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="ml-1 w-8 h-8 rounded-full bg-[#4cd7f6] text-[#003640] hover:bg-[#7bd0ff] transition-colors flex items-center justify-center shadow-sm"
              title="Sign in with Google (Firebase Auth)"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
