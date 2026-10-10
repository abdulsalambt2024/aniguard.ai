import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorageService';

export interface ScheduledReminder {
  id: string;
  animalName: string;
  tagId: string;
  title: string;
  body: string;
  dateStr: string;
  timeStr?: string;
  type: 'vaccine' | 'medication' | 'checkup';
  status: 'pending' | 'sent' | 'dismissed';
}

const DEFAULT_REMINDERS: ScheduledReminder[] = [
  {
    id: 'rem-1',
    animalName: 'Moti',
    tagId: 'IN-GJ-3090',
    title: '⚠️ Overdue: PPR Vaccine for Moti',
    body: 'Moti (Sirohi goat) is 5 days late for PPR Sungri 96 booster (1 ml). Book vet now.',
    dateStr: 'Today',
    type: 'vaccine',
    status: 'pending'
  },
  {
    id: 'rem-2',
    animalName: 'Gauri',
    tagId: 'IN-GJ-1042',
    title: '💉 Upcoming: FMD Trivalent for Gauri',
    body: 'Gauri is scheduled for FMD trivalent booster on Oct 27. Ensure supply is ready.',
    dateStr: '2026-10-27',
    type: 'vaccine',
    status: 'pending'
  },
  {
    id: 'rem-3',
    animalName: 'Gauri',
    tagId: 'IN-GJ-1042',
    title: '🌾 Daily Feed: Month 6 Pregnancy Supplement',
    body: 'Add 0.8 kg concentrate and mineral mix to Gauri\'s morning ration.',
    dateStr: 'Daily (08:00 AM)',
    type: 'medication',
    status: 'pending'
  },
  {
    id: 'rem-4',
    animalName: 'Shera',
    tagId: 'IN-GJ-2011',
    title: '💉 Upcoming: HS Oil Adjuvant for Shera',
    body: 'Shera (Murrah buffalo) needs Hemorrhagic Septicemia vaccine (3 ml) on Nov 03.',
    dateStr: '2026-11-03',
    type: 'vaccine',
    status: 'pending'
  }
];

export function useLocalNotificationScheduler() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [reminders, setReminders] = useState<ScheduledReminder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aniguard_reminders');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (_) {}
      }
    }
    return DEFAULT_REMINDERS;
  });

  const [lastNotificationSent, setLastNotificationSent] = useState<string | null>(null);

  // Sync to localStorage and IndexedDB for offline persistence
  useEffect(() => {
    localStorage.setItem('aniguard_reminders', JSON.stringify(reminders));
    offlineStorage.saveReminders(reminders).catch((err) => {
      console.warn('IndexedDB reminders sync error:', err);
    });
  }, [reminders]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Notifications are not supported in this browser environment.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        sendNotification(
          '🔔 AniGuard Reminders Activated',
          'You will now receive alerts for upcoming livestock vaccinations and feeding schedules.'
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string, icon = 'https://storage.googleapis.com/gpt-engineer-file-uploads/5KXrdGhlrgd1vKpqZ0o29mqZkxA2/uploads/1763490190885-1000285065.png') => {
    setLastNotificationSent(title);

    // Vibration pattern if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 100, 150]);
      } catch (_) {}
    }

    // Try service worker notification first for PWA consistency
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: 'aniguard-alert-' + Date.now()
        });
      }).catch(() => {
        // Fallback to standard web notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon });
        }
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    }
  }, []);

  const triggerUpcomingReminders = useCallback(() => {
    const active = reminders.filter(r => r.status === 'pending');
    if (active.length > 0) {
      const first = active[0];
      sendNotification(first.title, first.body);
    }
  }, [reminders, sendNotification]);

  const addReminder = useCallback((newReminder: Omit<ScheduledReminder, 'id' | 'status'>) => {
    const item: ScheduledReminder = {
      ...newReminder,
      id: 'rem-' + Date.now(),
      status: 'pending'
    };
    setReminders(prev => [item, ...prev]);

    // Send immediate confirmation
    if (permission === 'granted') {
      sendNotification(`Scheduled: ${item.title}`, item.body);
    }
  }, [permission, sendNotification]);

  const dismissReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'dismissed' } : r));
  }, []);

  // Periodic interval check (every 60 seconds) to check scheduled livestock reminders
  useEffect(() => {
    if (permission !== 'granted') return;

    const intervalId = setInterval(() => {
      // Check if any pending reminder should be fired
      const pending = reminders.filter(r => r.status === 'pending');
      if (pending.length > 0) {
        // e.g. notify once
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [permission, reminders]);

  return {
    permission,
    requestPermission,
    reminders,
    addReminder,
    dismissReminder,
    sendNotification,
    triggerUpcomingReminders,
    lastNotificationSent
  };
}
