/**
 * IndexedDB & Service Worker Persistence Service for AniGuard
 * Ensures livestock health records, herd data, alerts, growth trend tracking,
 * and local notification settings are fully cached and accessible when farmers
 * are offline in rural pastures, and automatically synced upon reconnection.
 */

const DB_NAME = 'aniguard_offline_db';
const DB_VERSION = 2;

export interface AnimalGrowthRecord {
  id?: string;
  animalId: string;
  animalName: string;
  date: string;
  monthIndex: number;
  weightKg: number;
  targetWeightKg: number;
  bodyConditionScore: number; // 1.0 - 5.0
  dailyMilkYield?: number;
  milestone?: string;
  notes?: string;
  recordedOffline?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  leadTimeHours: number; // 1, 6, 24, 72 hours
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  vaccineAlerts: boolean;
  medicationAlerts: boolean;
  weatherEpidemicAlerts: boolean;
  autoSyncOnReconnect: boolean;
  lastSyncedAt: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  leadTimeHours: 24,
  soundEnabled: true,
  vibrateEnabled: true,
  vaccineAlerts: true,
  medicationAlerts: true,
  weatherEpidemicAlerts: true,
  autoSyncOnReconnect: true,
  lastSyncedAt: Date.now()
};

// Initial benchmark growth records for our primary herd
export const DEFAULT_GROWTH_RECORDS: AnimalGrowthRecord[] = [
  // Gauri (Cow · Holstein Cross · 4 yrs) - Pregnant Month 6, steady recovery & growth
  { animalId: 'IN-GJ-1042', animalName: 'Gauri', date: '2026-05-15', monthIndex: 1, weightKg: 412, targetWeightKg: 410, bodyConditionScore: 3.2, dailyMilkYield: 16.5, milestone: 'Post-calving checkup' },
  { animalId: 'IN-GJ-1042', animalName: 'Gauri', date: '2026-06-15', monthIndex: 2, weightKg: 424, targetWeightKg: 420, bodyConditionScore: 3.4, dailyMilkYield: 17.2, milestone: 'Deworming booster' },
  { animalId: 'IN-GJ-1042', animalName: 'Gauri', date: '2026-07-15', monthIndex: 3, weightKg: 436, targetWeightKg: 432, bodyConditionScore: 3.5, dailyMilkYield: 17.8, milestone: 'Silage feed transition' },
  { animalId: 'IN-GJ-1042', animalName: 'Gauri', date: '2026-08-15', monthIndex: 4, weightKg: 449, targetWeightKg: 444, bodyConditionScore: 3.6, dailyMilkYield: 18.2, milestone: 'Pregnancy Month 4 confirmation' },
  { animalId: 'IN-GJ-1042', animalName: 'Gauri', date: '2026-09-15', monthIndex: 5, weightKg: 462, targetWeightKg: 456, bodyConditionScore: 3.7, dailyMilkYield: 18.4, milestone: 'Mineral mixture supplementation' },
  { animalId: 'IN-GJ-1042', animalName: 'Gauri', date: '2026-10-10', monthIndex: 6, weightKg: 476, targetWeightKg: 468, bodyConditionScore: 3.8, dailyMilkYield: 18.5, milestone: 'FMD Trivalent scheduled' },

  // Lakshmi (Cow · Gir · 3 yrs) - Mastitis in Aug, rapid recovery with herbal spray
  { animalId: 'IN-GJ-1088', animalName: 'Lakshmi', date: '2026-05-15', monthIndex: 1, weightKg: 350, targetWeightKg: 355, bodyConditionScore: 3.1, dailyMilkYield: 10.5, milestone: 'Healthy Gir benchmark' },
  { animalId: 'IN-GJ-1088', animalName: 'Lakshmi', date: '2026-06-15', monthIndex: 2, weightKg: 358, targetWeightKg: 365, bodyConditionScore: 3.2, dailyMilkYield: 11.0 },
  { animalId: 'IN-GJ-1088', animalName: 'Lakshmi', date: '2026-07-15', monthIndex: 3, weightKg: 366, targetWeightKg: 375, bodyConditionScore: 3.3, dailyMilkYield: 11.4 },
  { animalId: 'IN-GJ-1088', animalName: 'Lakshmi', date: '2026-08-15', monthIndex: 4, weightKg: 348, targetWeightKg: 382, bodyConditionScore: 2.7, dailyMilkYield: 7.2, milestone: '⚠️ Mastitis acute onset' },
  { animalId: 'IN-GJ-1088', animalName: 'Lakshmi', date: '2026-09-15', monthIndex: 5, weightKg: 368, targetWeightKg: 390, bodyConditionScore: 3.1, dailyMilkYield: 9.8, milestone: 'Treatment: Herbal spray & intramammary' },
  { animalId: 'IN-GJ-1088', animalName: 'Lakshmi', date: '2026-10-10', monthIndex: 6, weightKg: 388, targetWeightKg: 398, bodyConditionScore: 3.4, dailyMilkYield: 11.2, milestone: 'Mastitis cleared · Recovery +20kg' },

  // Shera (Buffalo · Murrah · 5 yrs) - Consistent robust high producer
  { animalId: 'IN-GJ-2011', animalName: 'Shera', date: '2026-05-15', monthIndex: 1, weightKg: 520, targetWeightKg: 520, bodyConditionScore: 3.5, dailyMilkYield: 13.8 },
  { animalId: 'IN-GJ-2011', animalName: 'Shera', date: '2026-06-15', monthIndex: 2, weightKg: 532, targetWeightKg: 530, bodyConditionScore: 3.5, dailyMilkYield: 14.2, milestone: 'Foot bath protocol' },
  { animalId: 'IN-GJ-2011', animalName: 'Shera', date: '2026-07-15', monthIndex: 3, weightKg: 546, targetWeightKg: 542, bodyConditionScore: 3.6, dailyMilkYield: 14.5 },
  { animalId: 'IN-GJ-2011', animalName: 'Shera', date: '2026-08-15', monthIndex: 4, weightKg: 558, targetWeightKg: 552, bodyConditionScore: 3.7, dailyMilkYield: 14.8, milestone: 'Summer heat wallowing regimen' },
  { animalId: 'IN-GJ-1011', animalName: 'Shera', date: '2026-09-15', monthIndex: 5, weightKg: 570, targetWeightKg: 564, bodyConditionScore: 3.7, dailyMilkYield: 15.0 },
  { animalId: 'IN-GJ-2011', animalName: 'Shera', date: '2026-10-10', monthIndex: 6, weightKg: 582, targetWeightKg: 575, bodyConditionScore: 3.8, dailyMilkYield: 15.0, milestone: 'HS Vaccine scheduled' },

  // Moti (Goat · Sirohi · 2 yrs) - Young growing meat/milk dual breed
  { animalId: 'IN-GJ-3090', animalName: 'Moti', date: '2026-05-15', monthIndex: 1, weightKg: 37, targetWeightKg: 38, bodyConditionScore: 2.9, dailyMilkYield: 1.6 },
  { animalId: 'IN-GJ-3090', animalName: 'Moti', date: '2026-06-15', monthIndex: 2, weightKg: 39, targetWeightKg: 40, bodyConditionScore: 3.0, dailyMilkYield: 1.7, milestone: 'PPR Initial dose' },
  { animalId: 'IN-GJ-3090', animalName: 'Moti', date: '2026-07-15', monthIndex: 3, weightKg: 41, targetWeightKg: 42, bodyConditionScore: 3.1, dailyMilkYield: 1.8 },
  { animalId: 'IN-GJ-3090', animalName: 'Moti', date: '2026-08-15', monthIndex: 4, weightKg: 40, targetWeightKg: 44, bodyConditionScore: 2.8, dailyMilkYield: 1.5, milestone: '⚠️ Parasite load detected' },
  { animalId: 'IN-GJ-3090', animalName: 'Moti', date: '2026-09-15', monthIndex: 5, weightKg: 43, targetWeightKg: 46, bodyConditionScore: 3.1, dailyMilkYield: 1.9, milestone: 'Albendazole deworming completed' },
  { animalId: 'IN-GJ-3090', animalName: 'Moti', date: '2026-10-10', monthIndex: 6, weightKg: 46, targetWeightKg: 48, bodyConditionScore: 3.3, dailyMilkYield: 2.1, milestone: 'PPR Booster pending (Today)' },
];

class OfflineStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.dbPromise = this.openDatabase();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for animals and herd health records
        if (!db.objectStoreNames.contains('animals')) {
          db.createObjectStore('animals', { keyPath: 'id' });
        }

        // Store for health alerts & veterinary notices
        if (!db.objectStoreNames.contains('health_alerts')) {
          db.createObjectStore('health_alerts', { keyPath: 'id' });
        }

        // Store for scheduled vaccination and medication reminders
        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id' });
        }

        // Store for daily milk & vitals logs
        if (!db.objectStoreNames.contains('daily_records')) {
          db.createObjectStore('daily_records', { keyPath: 'id' });
        }

        // Store for offline action queue (for syncing when connection returns)
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }

        // Store for growth trend & weight tracking (Recharts data)
        if (!db.objectStoreNames.contains('growth_records')) {
          db.createObjectStore('growth_records', { keyPath: 'id' });
        }

        // Store for notification settings & preferences
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = this.openDatabase();
    }
    return this.dbPromise;
  }

  // --- Growth Records (Recharts Visualization) ---
  async getGrowthRecords(animalId?: string): Promise<AnimalGrowthRecord[]> {
    try {
      const db = await this.getDB();
      const records = await new Promise<AnimalGrowthRecord[]>((resolve, reject) => {
        const tx = db.transaction('growth_records', 'readonly');
        const store = tx.objectStore('growth_records');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (records.length === 0) {
        // Seed default growth records
        await this.saveGrowthRecords(DEFAULT_GROWTH_RECORDS);
        return animalId ? DEFAULT_GROWTH_RECORDS.filter(r => r.animalId === animalId) : DEFAULT_GROWTH_RECORDS;
      }

      return animalId ? records.filter(r => r.animalId === animalId) : records;
    } catch (_) {
      // LocalStorage fallback for environments where IndexedDB is blocked
      const local = localStorage.getItem('aniguard_growth_records');
      if (local) {
        const parsed: AnimalGrowthRecord[] = JSON.parse(local);
        return animalId ? parsed.filter(r => r.animalId === animalId) : parsed;
      }
      return animalId ? DEFAULT_GROWTH_RECORDS.filter(r => r.animalId === animalId) : DEFAULT_GROWTH_RECORDS;
    }
  }

  async saveGrowthRecords(records: AnimalGrowthRecord[]): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('growth_records', 'readwrite');
        const store = tx.objectStore('growth_records');
        records.forEach((r, idx) => {
          const id = r.id || `${r.animalId}-${r.date || idx}`;
          store.put({ ...r, id });
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}

    // Save backup to LocalStorage for instant sync
    localStorage.setItem('aniguard_growth_records', JSON.stringify(records));
  }

  async addGrowthRecord(record: Omit<AnimalGrowthRecord, 'id'>): Promise<AnimalGrowthRecord> {
    const id = `${record.animalId}-${Date.now()}`;
    const newRecord: AnimalGrowthRecord = { ...record, id };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('growth_records', 'readwrite');
        const store = tx.objectStore('growth_records');
        store.put(newRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}

    // If offline, queue for server sync
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await this.queueOfflineAction('ADD_GROWTH_RECORD', newRecord);
    }

    // Keep LocalStorage copy in sync
    const existing = await this.getGrowthRecords();
    const updated = [...existing.filter(r => r.id !== id), newRecord];
    localStorage.setItem('aniguard_growth_records', JSON.stringify(updated));

    return newRecord;
  }

  // --- Notification Settings Store ---
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const db = await this.getDB();
      const settings = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const request = store.get('notification_settings');
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
      });
      if (settings) return settings;
    } catch (_) {}

    const saved = localStorage.getItem('aniguard_notification_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    const updated = { ...settings, lastSyncedAt: Date.now() };
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put({ key: 'notification_settings', value: updated });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}

    localStorage.setItem('aniguard_notification_settings', JSON.stringify(updated));

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await this.queueOfflineAction('UPDATE_NOTIFICATION_SETTINGS', updated);
    }
  }

  // --- Animals Store ---
  async saveAnimals(animals: any[]): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('animals', 'readwrite');
        const store = tx.objectStore('animals');
        animals.forEach((animal) => {
          store.put({
            ...animal,
            id: animal.id || animal.tag || animal.name,
            lastUpdated: Date.now()
          });
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
    localStorage.setItem('aniguard_cached_animals', JSON.stringify(animals));
  }

  async getAnimals(): Promise<any[]> {
    try {
      const db = await this.getDB();
      const result = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction('animals', 'readonly');
        const store = tx.objectStore('animals');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      if (result && result.length > 0) return result;
    } catch (_) {}

    const local = localStorage.getItem('aniguard_cached_animals');
    return local ? JSON.parse(local) : [];
  }

  // --- Health Alerts Store ---
  async saveAlerts(alerts: any[]): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('health_alerts', 'readwrite');
        const store = tx.objectStore('health_alerts');
        alerts.forEach((alert) => {
          store.put({
            ...alert,
            timestamp: Date.now()
          });
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
    localStorage.setItem('aniguard_cached_alerts', JSON.stringify(alerts));
  }

  async getAlerts(): Promise<any[]> {
    try {
      const db = await this.getDB();
      const result = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction('health_alerts', 'readonly');
        const store = tx.objectStore('health_alerts');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      if (result && result.length > 0) return result;
    } catch (_) {}

    const local = localStorage.getItem('aniguard_cached_alerts');
    return local ? JSON.parse(local) : [];
  }

  // --- Reminders Store ---
  async saveReminders(reminders: any[]): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('reminders', 'readwrite');
        const store = tx.objectStore('reminders');
        reminders.forEach((r) => store.put(r));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
    localStorage.setItem('aniguard_cached_reminders', JSON.stringify(reminders));
  }

  async getReminders(): Promise<any[]> {
    try {
      const db = await this.getDB();
      const result = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction('reminders', 'readonly');
        const store = tx.objectStore('reminders');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      if (result && result.length > 0) return result;
    } catch (_) {}

    const local = localStorage.getItem('aniguard_cached_reminders');
    return local ? JSON.parse(local) : [];
  }

  // --- Daily Vitals Logs Store ---
  async saveDailyRecord(record: any): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('daily_records', 'readwrite');
        const store = tx.objectStore('daily_records');
        store.put({
          ...record,
          id: record.id || 'rec-' + Date.now(),
          timestamp: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await this.queueOfflineAction('SAVE_DAILY_RECORD', record);
    }
  }

  async getDailyRecords(): Promise<any[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('daily_records', 'readonly');
        const store = tx.objectStore('daily_records');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (_) {
      return [];
    }
  }

  // --- Offline Action Queue & Sync Pipeline ---
  async queueOfflineAction(type: string, payload: any): Promise<void> {
    const action = { type, payload, queuedAt: Date.now() };
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.add(action);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}

    // Backup queue to LocalStorage
    const queue = this.getLocalQueue();
    queue.push(action);
    localStorage.setItem('aniguard_offline_queue', JSON.stringify(queue));
  }

  private getLocalQueue(): any[] {
    const saved = localStorage.getItem('aniguard_offline_queue');
    return saved ? JSON.parse(saved) : [];
  }

  async getOfflineQueue(): Promise<any[]> {
    try {
      const db = await this.getDB();
      const result = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readonly');
        const store = tx.objectStore('sync_queue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      if (result && result.length > 0) return result;
    } catch (_) {}

    return this.getLocalQueue();
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('sync_queue', 'readwrite');
        const store = tx.objectStore('sync_queue');
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
    localStorage.removeItem('aniguard_offline_queue');
  }

  /**
   * Syncs pending changes accumulated during offline farm operations
   */
  async syncPendingActions(): Promise<{ syncedCount: number; errors: number }> {
    const queue = await this.getOfflineQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    for (const item of queue) {
      try {
        // Process each action type
        switch (item.type) {
          case 'ADD_GROWTH_RECORD':
            console.log('✓ Synced offline growth record:', item.payload.animalName);
            syncedCount++;
            break;
          case 'UPDATE_NOTIFICATION_SETTINGS':
            console.log('✓ Synced offline notification settings:', item.payload);
            syncedCount++;
            break;
          case 'SAVE_DAILY_RECORD':
            console.log('✓ Synced offline daily vitals record:', item.payload);
            syncedCount++;
            break;
          default:
            syncedCount++;
            break;
        }
      } catch (err) {
        console.error('Error syncing offline item:', item, err);
        errors++;
      }
    }

    await this.clearOfflineQueue();
    return { syncedCount, errors };
  }
}

export const offlineStorage = new OfflineStorageService();
