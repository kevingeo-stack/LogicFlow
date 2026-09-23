import React from 'react';
import { ActiveTab, AppLanguage } from '../types';
import { t } from '../i18n/i18n';

interface NavigationBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  appLanguage?: AppLanguage;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange, appLanguage }) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: string }> = [
    { id: 'dashboard', label: t('nav.dashboard', appLanguage), icon: 'history' },
    { id: 'editor', label: t('nav.editor', appLanguage), icon: 'account_tree' },
    { id: 'templates', label: t('nav.templates', appLanguage), icon: 'library_books' },
    { id: 'settings', label: t('nav.settings', appLanguage), icon: 'manage_accounts' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 bg-[#060e20]/95 backdrop-blur-xl border-t border-[#334155]/60 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-1px_12px_rgba(0,0,0,0.35)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-all ${
                isActive
                  ? 'text-[#4cd7f6] bg-[#222a3d]/80 font-medium'
                  : 'text-[#bcc9cd] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span>
              <span className="text-[11px] font-medium tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
