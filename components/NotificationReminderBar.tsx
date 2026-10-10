import React, { useState, useEffect } from 'react';
import { useLocalNotificationScheduler, ScheduledReminder } from '../hooks/useLocalNotificationScheduler';

export const NotificationReminderBar: React.FC = () => {
  const {
    permission,
    requestPermission,
    reminders,
    addReminder,
    dismissReminder,
    sendNotification,
    triggerUpcomingReminders
  } = useLocalNotificationScheduler();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Form state for adding custom schedule
  const [animalName, setAnimalName] = useState('Gauri');
  const [tagId, setTagId] = useState('IN-GJ-1042');
  const [remType, setRemType] = useState<'vaccine' | 'medication' | 'checkup'>('vaccine');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dateStr, setDateStr] = useState('2026-10-27');

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addReminder({
      animalName,
      tagId,
      title: `${remType === 'vaccine' ? '💉 Vaccine' : '💊 Medication'}: ${title}`,
      body: body || `Scheduled ${remType} for ${animalName} (${tagId}) on ${dateStr}.`,
      dateStr,
      type: remType
    });

    setTitle('');
    setBody('');
    setShowAddModal(false);
  };

  const handleAnimalChange = (name: string) => {
    setAnimalName(name);
    if (name === 'Moti') setTagId('IN-GJ-3090');
    else if (name === 'Lakshmi') setTagId('IN-GJ-1088');
    else if (name === 'Shera') setTagId('IN-GJ-2011');
    else setTagId('IN-GJ-1042');
  };

  const activeCount = reminders.filter(r => r.status === 'pending').length;

  return (
    <>
      {/* Network Connectivity & IndexedDB Offline Status Badge */}
      {!isOnline && (
        <div className="mb-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-amber-900 font-semibold animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>📡 Offline Mode: Livestock records & reminders active via IndexedDB</span>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Local Cache</span>
        </div>
      )}

      {/* Top Reminder Banner */}
      <div className="mb-4">
        {permission !== 'granted' ? (
          <div className="bg-emerald-900 text-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔔</span>
              <div>
                <p className="font-bold">Livestock Vaccine Reminders</p>
                <p className="text-emerald-200 text-[11px]">Get browser alerts for upcoming boosters & feeding</p>
              </div>
            </div>
            <button
              onClick={() => requestPermission()}
              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-3.5 py-1.5 rounded-full transition flex-shrink-0"
            >
              Enable
            </button>
          </div>
        ) : (
          <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="text-gray-700 font-semibold">
                Reminders active ({activeCount} scheduled)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerUpcomingReminders()}
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
                title="Send test alert notification"
              >
                Test Alert
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="text-[11px] font-bold text-white px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#1a3c2b' }}
              >
                Manage
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Livestock Reminders</h3>
                  <p className="text-xs text-gray-500">Upcoming vaccines & medication schedule</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {reminders.map(rem => (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    rem.status === 'dismissed'
                      ? 'bg-gray-50 border-gray-100 opacity-60'
                      : rem.title.includes('Overdue')
                      ? 'bg-red-50/60 border-red-100'
                      : 'bg-emerald-50/40 border-emerald-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          rem.type === 'vaccine' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rem.type}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {rem.animalName} · {rem.tagId}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{rem.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{rem.body}</p>
                      <p className="text-[11px] font-bold text-emerald-800 mt-2">
                        📅 Due: {rem.dateStr}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => sendNotification(rem.title, rem.body)}
                        className="text-[11px] font-bold text-white px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: '#1a3c2b' }}
                      >
                        Notify
                      </button>
                      {rem.status === 'pending' && (
                        <button
                          onClick={() => dismissReminder(rem.id)}
                          className="text-[10px] text-gray-400 hover:text-gray-700 py-0.5"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                style={{ backgroundColor: '#1a3c2b' }}
              >
                + Add New Reminder
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Schedule Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSchedule}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-base">Schedule Reminder</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Animal</label>
              <select
                value={animalName}
                onChange={(e) => handleAnimalChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Gauri">Gauri (Cow · IN-GJ-1042)</option>
                <option value="Lakshmi">Lakshmi (Cow · IN-GJ-1088)</option>
                <option value="Shera">Shera (Buffalo · IN-GJ-2011)</option>
                <option value="Moti">Moti (Goat · IN-GJ-3090)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['vaccine', 'medication', 'checkup'] as const).map(type => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setRemType(type)}
                    className={`py-2 text-xs font-bold rounded-xl border capitalize transition ${
                      remType === type
                        ? 'bg-emerald-900 text-white border-emerald-900'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Title / Drug Name</label>
              <input
                type="text"
                placeholder="e.g., Anthrax spore vaccine or Calcium gel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Dosage / Notes</label>
              <input
                type="text"
                placeholder="e.g., 2 ml subcutaneous, post-evening milking"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                style={{ backgroundColor: '#1a3c2b' }}
              >
                Save & Schedule
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
