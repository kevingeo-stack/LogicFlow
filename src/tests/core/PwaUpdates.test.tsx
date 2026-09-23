import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PwaUpdateBanner } from '../../components/PwaUpdateBanner';
import { t } from '../../i18n/i18n';

// Mock virtual:pwa-register/react
let mockNeedRefresh = false;
let mockUpdateServiceWorker = vi.fn();
let mockSetNeedRefresh = vi.fn();

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
    updateServiceWorker: mockUpdateServiceWorker,
  })
}));

describe('PWA Updates & Banner', () => {
  beforeEach(() => {
    mockNeedRefresh = false;
    mockUpdateServiceWorker.mockClear();
    mockSetNeedRefresh.mockClear();
  });

  it('does not render if needRefresh is false', () => {
    mockNeedRefresh = false;
    const { container } = render(
      <PwaUpdateBanner appLanguage="en" onUpdateRequested={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when update is available and respects English translation', () => {
    mockNeedRefresh = true;
    render(<PwaUpdateBanner appLanguage="en" onUpdateRequested={vi.fn()} />);
    
    expect(screen.getByText(t('pwa.updateAvailable', 'en'))).toBeTruthy();
    expect(screen.getByText(t('pwa.updateNow', 'en'))).toBeTruthy();
    expect(screen.getByText(t('pwa.updateLater', 'en'))).toBeTruthy();
  });

  it('renders correctly when update is available and respects Spanish translation', () => {
    mockNeedRefresh = true;
    render(<PwaUpdateBanner appLanguage="es" onUpdateRequested={vi.fn()} />);
    
    expect(screen.getByText(t('pwa.updateAvailable', 'es'))).toBeTruthy();
    expect(screen.getByText(t('pwa.updateNow', 'es'))).toBeTruthy();
    expect(screen.getByText(t('pwa.updateLater', 'es'))).toBeTruthy();
  });

  it('dismisses banner on Later click', () => {
    mockNeedRefresh = true;
    render(<PwaUpdateBanner appLanguage="en" onUpdateRequested={vi.fn()} />);
    
    fireEvent.click(screen.getByText(t('pwa.updateLater', 'en')));
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
    expect(mockUpdateServiceWorker).not.toHaveBeenCalled();
  });

  it('delegates to onUpdateRequested without immediately reloading', () => {
    mockNeedRefresh = true;
    const onUpdateRequested = vi.fn();
    render(<PwaUpdateBanner appLanguage="en" onUpdateRequested={onUpdateRequested} />);
    
    fireEvent.click(screen.getByText(t('pwa.updateNow', 'en')));
    
    // updateServiceWorker should NOT be called directly yet
    expect(mockUpdateServiceWorker).not.toHaveBeenCalled();
    
    // but the callback should be requested
    expect(onUpdateRequested).toHaveBeenCalled();
    
    // Simulate App.tsx deciding to execute the callback (e.g. after saving dirty state)
    const performUpdateCb = onUpdateRequested.mock.calls[0][0];
    performUpdateCb();
    
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });
});
