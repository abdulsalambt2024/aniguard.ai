/**
 * IndexedDB Persistence Service for AniGuard
 * Ensures livestock health records, herd data, alerts, and medication schedules
 * are completely persisted and accessible when farmers are offline in rural pastures.
 */

const DB_NAME = 'aniguard_offline_db';
const DB_VERSION = 1;

export interface OfflineAnimalRecord {
  id: string;
  tagId: string;
  name: string;
  species: string;
  breed: string;
  ageYears: number;
  dailyMilkLiters: number;
  currentHealthScore: number;
  healthStatus: string;
  pregnancyStatus?: boolean;
  pregnancyMonth?: number;
  lastUpdated: number;
}

export interface OfflineAlertRecord {
  id: number | string;
  tagId: string;
  animalName: string;
  severity: string;
  title: string;
  description: string;
  nextStep: string;
  actionLabel: string;
  isResolved: boolean;
  timestamp: number;
}

export interface OfflineReminderRecord {
  id: string;
  animalName: string;
  tagId: string;
  title: string;
  body: string;
  dateStr: string;
  type: string;
  status: string;
  scheduledTime?: number;
}

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

  // --- Animals Store ---
  async saveAnimals(animals: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('animals', 'readwrite');
      const store = tx.objectStore('animals');
      animals.forEach((animal) => {
        store.put({
          ...animal,
          lastUpdated: Date.now()
        });
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAnimals(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('animals', 'readonly');
      const store = tx.objectStore('animals');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Health Alerts Store ---
  async saveAlerts(alerts: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
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
  }

  async getAlerts(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('health_alerts', 'readonly');
      const store = tx.objectStore('health_alerts');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Reminders Store ---
  async saveReminders(reminders: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readwrite');
      const store = tx.objectStore('reminders');
      reminders.forEach((r) => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getReminders(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readonly');
      const store = tx.objectStore('reminders');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Daily Vitals Logs Store ---
  async saveDailyRecord(record: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
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
  }

  async getDailyRecords(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('daily_records', 'readonly');
      const store = tx.objectStore('daily_records');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Offline Action Queue ---
  async queueOfflineAction(type: string, payload: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      store.add({ type, payload, queuedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getOfflineQueue(): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOfflineQueue(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const offlineStorage = new OfflineStorageService();
