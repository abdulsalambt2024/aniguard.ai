import React, { useState, useEffect } from 'react';
import {
  offlineStorage,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS
} from '../services/offlineStorageService';

interface Props {
  onSyncComplete?: () => void;
}

export const OfflineModeManager: React.FC<Props> = ({ onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState<string>('');

  // Service Worker Cache Status
  const [cachedAssetsCount, setCachedAssetsCount] = useState<number>(0);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (settings.autoSyncOnReconnect) {
        handleTriggerSync();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    checkQueue();
    loadSettings();
    queryServiceWorkerCache();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const effectiveOnline = isOnline && !simulateOffline;

  const checkQueue = async () => {
    try {
      const q = await offlineStorage.getOfflineQueue();
      setQueueCount(q.length);
    } catch (_) {}
  };

  const loadSettings = async () => {
    try {
      const s = await offlineStorage.getNotificationSettings();
      setSettings(s);
    } catch (_) {}
  };

  const queryServiceWorkerCache = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_CACHE_STATUS' });
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_STATUS_RESULT') {
          setCachedAssetsCount(event.data.cachedAssetsCount || 0);
        }
        if (event.data?.type === 'TRIGGER_OFFLINE_SYNC') {
          handleTriggerSync();
        }
      });
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Syncing pending records with cloud...');
    try {
      const result = await offlineStorage.syncPendingActions();
      setQueueCount(0);
      setSyncStatusMsg(`✓ Synced ${result.syncedCount} offline record(s) successfully!`);
      if (onSyncComplete) onSyncComplete();
    } catch (e) {
      setSyncStatusMsg('Sync failed, items remain safely in local cache.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(''), 4500);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await offlineStorage.saveNotificationSettings(settings);
    setSavedSettingsMsg('✓ Notification settings saved locally!');
    checkQueue();
    setTimeout(() => {
      setSavedSettingsMsg('');
      setShowSettingsModal(false);
    }, 1200);
  };

  return (
    <div className="mb-3 space-y-2">
      {/* Offline Status & Quick Sync Header Bar */}
      <div
        className={`px-3.5 py-2.5 rounded-2xl border transition-all text-xs flex items-center justify-between shadow-2xs ${
          !effectiveOnline
            ? 'bg-amber-500/15 border-amber-600/30 text-amber-950 font-medium'
            : 'bg-emerald-900/5 border-emerald-900/10 text-emerald-950'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              !effectiveOnline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
            }`}
          />
          <div>
            <span className="font-bold">
              {!effectiveOnline ? '⚡ Offline Mode Active' : '🟢 Online & Synced'}
            </span>
            <span className="text-[10px] text-gray-500 ml-1.5 hidden sm:inline">
              {!effectiveOnline
                ? 'Operating from IndexedDB & Service Worker cache'
                : 'Local farm records backed by IndexedDB'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {queueCount > 0 && (
            <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {queueCount} pending sync
            </span>
          )}

          {/* Sync Now Button */}
          {effectiveOnline && queueCount > 0 && (
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold rounded-lg transition active:scale-95 flex items-center gap-1"
            >
              <span>{isSyncing ? '⏳' : '🔄'}</span>
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}

          {/* Notification Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-2 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-bold rounded-lg shadow-2xs transition active:scale-95 flex items-center gap-1"
            title="Configure local notification & offline settings"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>

          {/* Simulate Offline Toggle */}
          <button
            onClick={() => setSimulateOffline(!simulateOffline)}
            className={`px-2 py-1 text-[10px] font-extrabold rounded-lg border transition ${
              simulateOffline
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
            title="Toggle simulated offline mode for field testing"
          >
            {simulateOffline ? 'Exit Offline' : 'Test Offline'}
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between animate-in fade-in">
          <span>{syncStatusMsg}</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Cloud Sync</span>
        </div>
      )}

      {/* Settings Modal (Works both Offline & Online) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Offline & Notification Settings</h3>
                <p className="text-xs text-gray-500">Accessible and saved locally without internet</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              {/* Notification Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <span className="font-bold text-gray-800">Enable Local Notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <span className="font-bold text-gray-800">Vaccination Reminders</span>
                  <input
                    type="checkbox"
                    checked={settings.vaccineAlerts}
                    onChange={(e) => setSettings({ ...settings, vaccineAlerts: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <span className="font-bold text-gray-800">Medication & Feed Alarms</span>
                  <input
                    type="checkbox"
                    checked={settings.medicationAlerts}
                    onChange={(e) => setSettings({ ...settings, medicationAlerts: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                  <span className="font-bold text-gray-800">Auto-Sync on Reconnect</span>
                  <input
                    type="checkbox"
                    checked={settings.autoSyncOnReconnect}
                    onChange={(e) => setSettings({ ...settings, autoSyncOnReconnect: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>
              </div>

              {/* Lead Time Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Reminder Lead Time (Before Due Date)
                </label>
                <select
                  value={settings.leadTimeHours}
                  onChange={(e) => setSettings({ ...settings, leadTimeHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value={1}>1 hour prior</option>
                  <option value={6}>6 hours prior</option>
                  <option value={24}>24 hours (1 day prior)</option>
                  <option value={72}>72 hours (3 days prior)</option>
                </select>
              </div>

              {/* Cache Stats Info */}
              <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 space-y-1 font-medium">
                <div className="flex justify-between">
                  <span>Service Worker Status:</span>
                  <span className="font-bold">Active (v3)</span>
                </div>
                <div className="flex justify-between">
                  <span>Queued Offline Edits:</span>
                  <span className="font-bold">{queueCount} item(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Offline Storage Engine:</span>
                  <span className="font-bold">IndexedDB + CacheStorage</span>
                </div>
              </div>

              {savedSettingsMsg && (
                <div className="text-emerald-700 font-bold text-center text-xs">
                  {savedSettingsMsg}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
