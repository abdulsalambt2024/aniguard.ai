import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateVeterinarySummaryPDF } from '../services/pdfExportService';
import { offlineStorage } from '../services/offlineStorageService';
import { LivestockGrowthChart } from './LivestockGrowthChart';

interface Props {
  profile: UserProfile;
}

const initialAnimals = [
  {
    initial: 'M', name: 'Moti', tag: 'IN-GJ-3090', breed: 'Goat · Sirohi · 2 yrs',
    milk: '2.1 L/day', health: 5, status: 'Critical',
    color: '#fdecea', textColor: '#c62828',
    badgeBg: '#fdecea', badgeText: '#c62828',
  },
  {
    initial: 'L', name: 'Lakshmi', tag: 'IN-GJ-1088', breed: 'Cow · Gir · 3 yrs',
    milk: '11.2 L/day', health: 51, status: 'Sick',
    color: '#fff3e0', textColor: '#e65100',
    badgeBg: '#fff3e0', badgeText: '#e65100',
    badge2: null,
  },
  {
    initial: 'G', name: 'Gauri', tag: 'IN-GJ-1042', breed: 'Cow · Holstein cross · 4 yrs',
    milk: '18.5 L/day', health: 90, status: 'Healthy',
    color: '#e8f5e9', textColor: '#2e7d32',
    badgeBg: '#e8f5e9', badgeText: '#2e7d32',
    extraBadge: 'Month 6',
  },
  {
    initial: 'S', name: 'Shera', tag: 'IN-GJ-2011', breed: 'Buffalo · Murrah · 5 yrs',
    milk: '15 L/day', health: 90, status: 'Healthy',
    color: '#e8f5e9', textColor: '#2e7d32',
    badgeBg: '#e8f5e9', badgeText: '#2e7d32',
  },
];

const filters = ['All', 'Cows', 'Buffalo', 'Goats'];

const HerdPage: React.FC<Props> = ({ profile }) => {
  const [animals, setAnimals] = useState(initialAnimals);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAnimalTag, setSelectedAnimalTag] = useState('IN-GJ-1042');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showAddAnimalModal, setShowAddAnimalModal] = useState(false);
  const [showGrowthChart, setShowGrowthChart] = useState(true);

  // New animal form state
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newBreed, setNewBreed] = useState('Cow · Gir · 2 yrs');
  const [newMilk, setNewMilk] = useState('12 L/day');
  const [newWeight, setNewWeight] = useState('380');

  // Sync to IndexedDB for offline persistence
  useEffect(() => {
    offlineStorage.saveAnimals(animals).catch((err) => {
      console.warn('Offline cache error:', err);
    });
  }, [animals]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const growthRecords = await offlineStorage.getGrowthRecords();
      generateVeterinarySummaryPDF(profile, animals, growthRecords);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (e) {
      console.error('PDF Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddAnimalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const tagToUse = newTag.trim() || `IN-GJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const isCow = newBreed.toLowerCase().includes('cow');
    const isBuffalo = newBreed.toLowerCase().includes('buffalo');

    const newAnimalEntry = {
      initial: newName[0].toUpperCase(),
      name: newName,
      tag: tagToUse,
      breed: newBreed,
      milk: newMilk || '10 L/day',
      health: 88,
      status: 'Healthy',
      color: '#e8f5e9',
      textColor: '#2e7d32',
      badgeBg: '#e8f5e9',
      badgeText: '#2e7d32',
    };

    const updated = [newAnimalEntry, ...animals];
    setAnimals(updated);
    await offlineStorage.saveAnimals(updated);

    // Also add initial weight log
    if (newWeight) {
      await offlineStorage.addGrowthRecord({
        animalId: tagToUse,
        animalName: newName,
        date: new Date().toISOString().split('T')[0],
        monthIndex: 1,
        weightKg: parseFloat(newWeight) || 350,
        targetWeightKg: (parseFloat(newWeight) || 350) + 10,
        bodyConditionScore: 3.5,
        dailyMilkYield: parseFloat(newMilk) || 10,
        milestone: 'Initial farm intake & baseline recorded'
      });
    }

    setSelectedAnimalTag(tagToUse);
    setNewName('');
    setNewTag('');
    setShowAddAnimalModal(false);
  };

  const filtered = animals.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      a.breed.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Cows' && a.breed.startsWith('Cow')) ||
      (activeFilter === 'Buffalo' && a.breed.startsWith('Buffalo')) ||
      (activeFilter === 'Goats' && a.breed.startsWith('Goat'));
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-400">
      {/* Title with Export Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your herd</h1>
          <p className="text-sm text-gray-500 mt-0.5">{animals.length} animals · 46.8 L today</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrowthChart(!showGrowthChart)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition flex items-center gap-1 shadow-xs active:scale-95"
            title="Toggle Growth Visualizer"
          >
            <span>📈</span>
            <span>{showGrowthChart ? 'Hide Trends' : 'View Trends'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-800 text-emerald-900 bg-white hover:bg-emerald-50 transition flex items-center gap-1.5 shadow-xs active:scale-95"
            title="Export vaccination & clinical summary PDF for vet visit"
          >
            <span>📄</span>
            <span>{isExporting ? 'Exporting...' : 'Export Vet PDF'}</span>
          </button>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between animate-in fade-in">
          <span>✓ Veterinary summary PDF downloaded successfully!</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">IndexedDB Cached</span>
        </div>
      )}

      {/* Recharts Data Visualization Component: Weight & Growth Trends */}
      {showGrowthChart && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <LivestockGrowthChart
            selectedAnimalTag={selectedAnimalTag}
            onAnimalSelect={(tag) => setSelectedAnimalTag(tag)}
          />
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="space-y-2.5">
        <input
          type="text"
          placeholder="Search by name, tag or breed..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-800 shadow-2xs"
        />

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0"
              style={activeFilter === f
                ? { backgroundColor: '#1a3c2b', color: 'white' }
                : { backgroundColor: 'white', color: '#374151', border: '1.5px solid #d1d5db' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Animal Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
          <span>LIVESTOCK ROSTER ({filtered.length})</span>
          <span className="text-[11px] text-emerald-800 font-semibold">Tap to visualize growth</span>
        </div>

        {filtered.map((a, i) => {
          const isSelectedInChart = a.tag === selectedAnimalTag;
          return (
            <div
              key={i}
              onClick={() => setSelectedAnimalTag(a.tag)}
              className={`bg-white rounded-2xl p-4 shadow-xs border transition-all cursor-pointer flex items-center gap-3 ${
                isSelectedInChart
                  ? 'border-emerald-800 ring-2 ring-emerald-800/20 bg-emerald-50/20'
                  : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 shadow-2xs"
                style={{ backgroundColor: a.color, color: a.textColor }}
              >
                {a.initial}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-900">{a.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{a.tag}</span>
                  {isSelectedInChart && (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-800 text-white">
                      Charting
                    </span>
                  )}
                  {'extraBadge' in a && a.extraBadge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
                      {a.extraBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.breed}</p>
                <p className="text-xs text-emerald-800 font-medium">{a.milk}</p>
              </div>

              {/* Health Score */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-base font-extrabold" style={{ color: a.textColor }}>{a.health}%</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: a.badgeBg, color: a.badgeText }}
                >
                  {a.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Animal Button */}
      <button
        onClick={() => setShowAddAnimalModal(true)}
        className="w-full py-3.5 rounded-2xl text-white text-sm font-bold shadow-md hover:bg-emerald-900 transition active:scale-98 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#1a3c2b' }}
      >
        <span>+</span>
        <span>Register New Livestock</span>
      </button>

      {/* Register Animal Modal */}
      {showAddAnimalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Add Livestock to Herd</h3>
                <p className="text-xs text-gray-500">Saves locally to IndexedDB & syncs offline</p>
              </div>
              <button
                onClick={() => setShowAddAnimalModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAnimalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Animal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaali, Rani, Nandini"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Ear Tag ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IN-GJ-4022"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Breed & Species
                  </label>
                  <select
                    value={newBreed}
                    onChange={e => setNewBreed(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Cow · Gir · 3 yrs">Cow · Gir</option>
                    <option value="Cow · Sahiwal · 2 yrs">Cow · Sahiwal</option>
                    <option value="Cow · Holstein cross · 4 yrs">Cow · Holstein cross</option>
                    <option value="Buffalo · Murrah · 4 yrs">Buffalo · Murrah</option>
                    <option value="Buffalo · Jaffarabadi · 5 yrs">Buffalo · Jaffarabadi</option>
                    <option value="Goat · Sirohi · 2 yrs">Goat · Sirohi</option>
                    <option value="Goat · Jamnapari · 1.5 yrs">Goat · Jamnapari</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Daily Milk Yield
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14 L/day"
                    value={newMilk}
                    onChange={e => setNewMilk(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Initial Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 420"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 font-medium">
                ✓ Recorded immediately to local IndexedDB store. Growth chart will auto-populate with breed benchmarks.
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAnimalModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md"
                >
                  Add Animal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HerdPage;
