import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { t } from '../i18n/i18n';
import { appController } from '../core/AppController';
import { AppLanguage } from '../types';

interface Props {
  appLanguage: AppLanguage;
  onUpdateRequested: (performUpdate: () => void) => void;
}

export const PwaUpdateBanner: React.FC<Props> = ({ appLanguage, onUpdateRequested }) => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  const handleUpdateClick = () => {
    // Instead of forcing reload immediately, we delegate to the parent
    // to check isDirty and optionally show the UnsavedChangesModal
    onUpdateRequested(() => {
      // the actual update function from Vite PWA
      updateServiceWorker(true);
    });
  };

  const handleLaterClick = () => {
    setNeedRefresh(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1e293b] border border-[#334155] p-4 rounded-xl shadow-2xl flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#0ea5e9]">system_update</span>
        <h3 className="text-[#f8fafc] font-medium text-sm">
          {t('pwa.updateAvailable', appLanguage) || (appLanguage === 'es' ? 'Nueva versión de FlowGenius disponible.' : 'A new version of FlowGenius is available.')}
        </h3>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={handleLaterClick}
          className="px-3 py-1.5 text-xs text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155] rounded-lg transition-colors"
        >
          {t('pwa.updateLater', appLanguage) || (appLanguage === 'es' ? 'Más tarde' : 'Later')}
        </button>
        <button
          onClick={handleUpdateClick}
          className="px-3 py-1.5 text-xs bg-[#0ea5e9] text-white hover:bg-[#0284c7] rounded-lg transition-colors font-medium shadow-md"
        >
          {t('pwa.updateNow', appLanguage) || (appLanguage === 'es' ? 'Actualizar ahora' : 'Update now')}
        </button>
      </div>
    </div>
  );
};
