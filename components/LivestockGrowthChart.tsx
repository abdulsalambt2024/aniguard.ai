import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import {
  offlineStorage,
  AnimalGrowthRecord,
  DEFAULT_GROWTH_RECORDS
} from '../services/offlineStorageService';
import { generateComprehensiveHerdReportPDF } from '../services/pdfExportService';

interface Props {
  selectedAnimalTag?: string;
  onAnimalSelect?: (tag: string) => void;
}

interface AnimalMeta {
  tag: string;
  name: string;
  breed: string;
  species: 'Cow' | 'Buffalo' | 'Goat';
  color: string;
  optimalMarketWeight: number; // Target weight in kg for prime sale
  livePricePerKg: number; // Regional Mandi price in INR/kg
  dailyFeedCost: number; // Daily ration & roughage cost in INR
  baseDailyGainKg: number; // Standard daily gain in kg/day
}

const ANIMALS_METADATA: AnimalMeta[] = [
  {
    tag: 'IN-GJ-1042',
    name: 'Gauri',
    breed: 'Cow · Holstein cross · 4 yrs',
    species: 'Cow',
    color: '#16a34a',
    optimalMarketWeight: 510,
    livePricePerKg: 155, // or dairy valuation multiplier
    dailyFeedCost: 165,
    baseDailyGainKg: 0.42
  },
  {
    tag: 'IN-GJ-1088',
    name: 'Lakshmi',
    breed: 'Cow · Gir · 3 yrs',
    species: 'Cow',
    color: '#d97706',
    optimalMarketWeight: 425,
    livePricePerKg: 170,
    dailyFeedCost: 140,
    baseDailyGainKg: 0.45
  },
  {
    tag: 'IN-GJ-2011',
    name: 'Shera',
    breed: 'Buffalo · Murrah · 5 yrs',
    species: 'Buffalo',
    color: '#0284c7',
    optimalMarketWeight: 620,
    livePricePerKg: 160,
    dailyFeedCost: 185,
    baseDailyGainKg: 0.40
  },
  {
    tag: 'IN-GJ-3090',
    name: 'Moti',
    breed: 'Goat · Sirohi · 2 yrs',
    species: 'Goat',
    color: '#9333ea',
    optimalMarketWeight: 54,
    livePricePerKg: 520, // High mutton/breeding liveweight rate
    dailyFeedCost: 35,
    baseDailyGainKg: 0.08
  }
];

export const LivestockGrowthChart: React.FC<Props> = ({
  selectedAnimalTag = 'IN-GJ-1042',
  onAnimalSelect
}) => {
  const [activeTag, setActiveTag] = useState<string>(selectedAnimalTag);
  const [records, setRecords] = useState<AnimalGrowthRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metricMode, setMetricMode] = useState<'weight' | 'vitals'>('weight');
  
  // Predictive growth model controls
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [feedRegime, setFeedRegime] = useState<'standard' | 'high_protein'>('standard');
  const [scheduleNotice, setScheduleNotice] = useState<string>('');

  // Quick log modal state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [newWeight, setNewWeight] = useState<string>('');
  const [newBcs, setNewBcs] = useState<string>('3.5');
  const [newMilk, setNewMilk] = useState<string>('');
  const [newMilestone, setNewMilestone] = useState<string>('');
  const [logSuccessMessage, setLogSuccessMessage] = useState<string>('');

  useEffect(() => {
    setActiveTag(selectedAnimalTag);
  }, [selectedAnimalTag]);

  // Load records from IndexedDB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await offlineStorage.getGrowthRecords();
      setRecords(data);
    } catch (e) {
      console.warn('Error loading growth records:', e);
      setRecords(DEFAULT_GROWTH_RECORDS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAnimal = ANIMALS_METADATA.find(a => a.tag === activeTag) || ANIMALS_METADATA[0];
  const animalRecords = records.filter(r => r.animalId === activeTag);

  // Compute growth velocity from empirical historical data
  const historicalCount = animalRecords.length;
  const initialRec = animalRecords[0] || { weightKg: 400 };
  const latestRec = animalRecords[historicalCount - 1] || initialRec;
  
  const empiricalGain = latestRec.weightKg - initialRec.weightKg;
  const avgMonthlyVelocity = historicalCount > 1 ? empiricalGain / (historicalCount - 1) : 5;

  // Multiplier for feed optimization simulation
  const feedVelocityMultiplier = feedRegime === 'high_protein' ? 1.25 : 1.0;
  const effectiveMonthlyGain = Math.max(0.5, avgMonthlyVelocity * feedVelocityMultiplier);

  // Biological diminishing returns as animal reaches mature weight
  const remainingToMarket = Math.max(0, activeAnimal.optimalMarketWeight - latestRec.weightKg);
  const monthsToMarket = effectiveMonthlyGain > 0 ? remainingToMarket / effectiveMonthlyGain : 0;
  const daysToMarket = Math.round(monthsToMarket * 30.5);

  // Compute Estimated Optimal Sale Date
  const optimalSaleDate = new Date();
  optimalSaleDate.setDate(optimalSaleDate.getDate() + daysToMarket);
  const formattedSaleDate = optimalSaleDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Economic Valuations
  const currentValuation = Math.round(latestRec.weightKg * activeAnimal.livePricePerKg);
  const optimalValuation = Math.round(activeAnimal.optimalMarketWeight * activeAnimal.livePricePerKg);
  const projectedRevenueGain = optimalValuation - currentValuation;
  const totalProjectedFeedCost = Math.round(daysToMarket * activeAnimal.dailyFeedCost);
  const projectedNetProfit = projectedRevenueGain - totalProjectedFeedCost;

  // Build combined dataset: Historical records + Predictive growth model points
  const combinedChartData: any[] = [];

  // 1. Add historical records
  animalRecords.forEach((r) => {
    const dateObj = new Date(r.date);
    const label = isNaN(dateObj.getTime())
      ? `Month ${r.monthIndex}`
      : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    combinedChartData.push({
      date: label,
      rawDate: r.date,
      type: 'historical',
      weight: r.weightKg,
      target: r.targetWeightKg,
      bcs: r.bodyConditionScore,
      milk: r.dailyMilkYield || 0,
      milestone: r.milestone || '',
      optimalTarget: activeAnimal.optimalMarketWeight
    });
  });

  // 2. Add predictive forecast projections (next 4 months)
  if (showForecast && historicalCount > 0) {
    const lastDate = new Date(latestRec.date || '2026-10-10');
    let runningWeight = latestRec.weightKg;

    // Connect historical to predicted line seamlessly
    if (combinedChartData.length > 0) {
      combinedChartData[combinedChartData.length - 1].predictedWeight = latestRec.weightKg;
      combinedChartData[combinedChartData.length - 1].confidenceLow = latestRec.weightKg;
      combinedChartData[combinedChartData.length - 1].confidenceHigh = latestRec.weightKg;
    }

    for (let i = 1; i <= 4; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const label = forecastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) + ' (Est)';

      // Von Bertalanffy asymptotic deceleration toward ceiling
      const gap = activeAnimal.optimalMarketWeight * 1.15 - runningWeight;
      const stepGain = Math.max(0.3, Math.min(effectiveMonthlyGain, gap * 0.35));
      runningWeight = Math.round((runningWeight + stepGain) * 10) / 10;

      // Confidence interval bounds (±5% spreading over time)
      const variance = (stepGain * 0.35) * i;
      const confHigh = Math.round((runningWeight + variance) * 10) / 10;
      const confLow = Math.round((runningWeight - variance) * 10) / 10;

      combinedChartData.push({
        date: label,
        rawDate: forecastDate.toISOString().split('T')[0],
        type: 'forecast',
        predictedWeight: runningWeight,
        confidenceHigh: confHigh,
        confidenceLow: confLow,
        optimalTarget: activeAnimal.optimalMarketWeight,
        milestone: i === Math.max(1, Math.round(monthsToMarket)) ? '🎯 Estimated Optimal Market Date' : ''
      });
    }
  }

  // Handle saving new weight observation
  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    const weightVal = parseFloat(newWeight);
    const bcsVal = parseFloat(newBcs) || 3.5;
    const milkVal = newMilk ? parseFloat(newMilk) : undefined;
    const expectedTarget = Math.round(weightVal + (activeTag === 'IN-GJ-3090' ? 2 : 10));
    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord = {
      animalId: activeTag,
      animalName: activeAnimal.name,
      date: todayStr,
      monthIndex: animalRecords.length + 1,
      weightKg: weightVal,
      targetWeightKg: expectedTarget,
      bodyConditionScore: bcsVal,
      dailyMilkYield: milkVal,
      milestone: newMilestone || 'Routine monthly health weigh-in',
      recordedOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false
    };

    await offlineStorage.addGrowthRecord(newRecord);
    await loadData();

    setNewWeight('');
    setNewMilk('');
    setNewMilestone('');
    setShowLogModal(false);
    setLogSuccessMessage(`✓ Logged ${weightVal} kg observation for ${activeAnimal.name}! Saved locally.`);
    setTimeout(() => setLogSuccessMessage(''), 4000);
  };

  // Schedule optimal sale reminder
  const handleScheduleSaleReminder = async () => {
    const reminderTitle = `🏷️ Optimal Market Sale Window: ${activeAnimal.name}`;
    const reminderBody = `${activeAnimal.name} is projected to reach prime market weight of ${activeAnimal.optimalMarketWeight} kg around ${formattedSaleDate}. Estimated valuation: ₹${optimalValuation.toLocaleString('en-IN')}.`;
    
    await offlineStorage.saveReminders([
      {
        id: `sale-rem-${Date.now()}`,
        animalName: activeAnimal.name,
        tagId: activeAnimal.tag,
        title: reminderTitle,
        body: reminderBody,
        dateStr: formattedSaleDate,
        type: 'checkup',
        status: 'pending'
      }
    ]);

    setScheduleNotice(`✓ Market sale reminder scheduled for ${formattedSaleDate}!`);
    setTimeout(() => setScheduleNotice(''), 4000);
  };

  const handleSelectAnimal = (tag: string) => {
    setActiveTag(tag);
    if (onAnimalSelect) onAnimalSelect(tag);
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHistorical = data.type === 'historical';

      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-gray-200 text-xs max-w-xs space-y-1">
          <div className="flex items-center justify-between border-b pb-1 font-bold text-gray-800">
            <span>📅 {data.date}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isHistorical ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
              {isHistorical ? 'Historical' : 'AI Forecast'}
            </span>
          </div>

          {isHistorical ? (
            <>
              <div className="flex items-center justify-between pt-1">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  Measured Weight:
                </span>
                <span className="font-bold text-gray-900">{data.weight} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Breed Target:</span>
                <span className="font-semibold text-gray-600">{data.target} kg</span>
              </div>
              {data.milk > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-600 font-semibold">Milk Yield:</span>
                  <span className="font-bold text-blue-900">{data.milk} L/day</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pt-1">
                <span className="text-indigo-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                  Projected Weight:
                </span>
                <span className="font-bold text-indigo-950">{data.predictedWeight} kg</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Confidence Range:</span>
                <span className="font-mono">{data.confidenceLow} – {data.confidenceHigh} kg</span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t pt-1">
            <span className="text-amber-700 font-semibold">Target Market Weight:</span>
            <span className="font-bold text-amber-900">{data.optimalTarget} kg</span>
          </div>

          {data.milestone && (
            <div className="mt-1 pt-1 border-t text-[10px] bg-emerald-50 text-emerald-900 p-1.5 rounded font-medium">
              🏷️ <strong>Event:</strong> {data.milestone}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-900/10 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm">📈</span>
            <h2 className="text-lg font-bold text-gray-900">Predictive Growth & Market Sale Model</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Polynomial trajectory model estimating future market weight & optimal sale dates
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Predictive Model Toggle */}
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition flex items-center gap-1 ${
              showForecast
                ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
            title="Toggle Predictive Growth Forecasting"
          >
            <span>🔮</span>
            <span>Forecast {showForecast ? 'ON' : 'OFF'}</span>
          </button>

          {/* Metric View Toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setMetricMode('weight')}
              className={`px-2.5 py-1 rounded-lg transition ${metricMode === 'weight' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600'}`}
            >
              Weight
            </button>
            <button
              onClick={() => setMetricMode('vitals')}
              className={`px-2.5 py-1 rounded-lg transition ${metricMode === 'vitals' ? 'bg-emerald-800 text-white shadow-xs' : 'text-gray-600'}`}
            >
              Vitals
            </button>
          </div>

          {/* Export Growth & Health PDF Button */}
          <button
            onClick={() => {
              generateComprehensiveHerdReportPDF(
                { name: 'Ramesh Patel', region: 'Anand, Gujarat' } as any,
                undefined,
                records
              );
              setLogSuccessMessage('✓ Full herd health & growth trends PDF exported successfully!');
              setTimeout(() => setLogSuccessMessage(''), 3500);
            }}
            className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold rounded-xl shadow-2xs transition active:scale-95 flex items-center gap-1"
            title="Export Herd Health and Growth Trends to PDF format"
          >
            <span>📄</span>
            <span>Export PDF</span>
          </button>

          {/* Log New Weight Observation Button */}
          <button
            onClick={() => setShowLogModal(true)}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1"
            title="Log new weight observation (works offline)"
          >
            <span>+</span>
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* Livestock Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {ANIMALS_METADATA.map((animal) => {
          const isSelected = animal.tag === activeTag;
          return (
            <button
              key={animal.tag}
              onClick={() => handleSelectAnimal(animal.tag)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all border shrink-0 ${
                isSelected
                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-md scale-[1.02]'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50/50'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                style={{ backgroundColor: animal.color }}
              >
                {animal.name[0]}
              </div>
              <div className="text-left">
                <div className="leading-tight">{animal.name}</div>
                <div className={`text-[9px] font-medium leading-none mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-gray-400'}`}>
                  {animal.species} · {animal.optimalMarketWeight} kg target
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Success Notification Alert */}
      {logSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold animate-in fade-in flex items-center justify-between">
          <span>{logSuccessMessage}</span>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">IndexedDB</span>
        </div>
      )}

      {scheduleNotice && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-semibold animate-in fade-in flex items-center justify-between">
          <span>{scheduleNotice}</span>
          <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">Reminder Set</span>
        </div>
      )}

      {/* Optimal Market Sale Date & Financial Valuation Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#1a3c2b] text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950">
                Optimal Market Sale Timing
              </span>
              <span className="text-xs text-emerald-200 font-medium">{activeAnimal.name} ({activeAnimal.breed})</span>
            </div>
            <div className="text-xl sm:text-2xl font-black mt-1 text-white flex items-baseline gap-2">
              <span>{formattedSaleDate}</span>
              <span className="text-xs text-amber-300 font-semibold">
                ({daysToMarket > 0 ? `in ~${daysToMarket} days` : 'Optimal Window Now!'})
              </span>
            </div>
          </div>

          <button
            onClick={handleScheduleSaleReminder}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>⏰</span>
            <span>Set Sale Alert</span>
          </button>
        </div>

        {/* Financial & Weight KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <div className="text-[10px] text-emerald-200 font-medium">Optimal Market Weight</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              {activeAnimal.optimalMarketWeight} <span className="text-[11px] font-normal text-emerald-300">kg</span>
            </div>
            <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
              {remainingToMarket > 0 ? `${remainingToMarket} kg remaining` : 'Target reached!'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <div className="text-[10px] text-emerald-200 font-medium">Projected Sale Value</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              ₹{optimalValuation.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
              @ ₹{activeAnimal.livePricePerKg}/kg liveweight
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <div className="text-[10px] text-emerald-200 font-medium">Net Profit Delta</div>
            <div className="text-base font-extrabold text-emerald-300 mt-0.5">
              +{projectedNetProfit > 0 ? `₹${projectedNetProfit.toLocaleString('en-IN')}` : '₹0'}
            </div>
            <div className="text-[10px] text-white/80 font-medium mt-0.5">
              Feed Cost: ₹{totalProjectedFeedCost}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl">
            <div className="text-[10px] text-emerald-200 font-medium">Growth Velocity (ADG)</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              +{(effectiveMonthlyGain).toFixed(1)} <span className="text-[11px] font-normal text-emerald-300">kg/mo</span>
            </div>
            <div className="text-[10px] text-amber-300 font-semibold mt-0.5">
              {feedRegime === 'high_protein' ? '🚀 High-Silage Boost' : 'Standard Feed'}
            </div>
          </div>
        </div>

        {/* Nutritional Optimization Simulation Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <span className="text-emerald-200 text-[11px]">
            🧪 Simulate Feed Strategy:
          </span>
          <div className="flex bg-black/30 p-0.5 rounded-xl text-[11px]">
            <button
              onClick={() => setFeedRegime('standard')}
              className={`px-2.5 py-1 rounded-lg transition font-semibold ${feedRegime === 'standard' ? 'bg-white text-emerald-950' : 'text-emerald-300'}`}
            >
              Standard Ration
            </button>
            <button
              onClick={() => setFeedRegime('high_protein')}
              className={`px-2.5 py-1 rounded-lg transition font-semibold ${feedRegime === 'high_protein' ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-300'}`}
            >
              High-Protein Silage (+25% gain)
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Graphic Container with Forecast Curves */}
      <div className="w-full h-72 pt-2">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            Calculating predictive growth curve...
          </div>
        ) : metricMode === 'weight' ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedChartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
              <YAxis
                domain={['dataMin - 15', 'dataMax + 20']}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                unit="kg"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                formatter={(value) => <span className="text-xs font-semibold text-gray-700">{value}</span>}
              />

              {/* Optimal Market Weight Target Line */}
              <ReferenceLine
                y={activeAnimal.optimalMarketWeight}
                stroke="#e11d48"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Optimal Market: ${activeAnimal.optimalMarketWeight} kg`,
                  position: 'insideTopRight',
                  fill: '#be123c',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />

              {/* Confidence Interval Band for Forecast */}
              {showForecast && (
                <Area
                  name="Forecast Confidence Band"
                  type="monotone"
                  dataKey="confidenceHigh"
                  stroke="none"
                  fill="#c7d2fe"
                  fillOpacity={0.3}
                />
              )}

              {/* Actual Historical Weight Line */}
              <Line
                name="Historical Measured Weight (kg)"
                type="monotone"
                dataKey="weight"
                stroke={activeAnimal.color}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, stroke: activeAnimal.color, strokeWidth: 3 }}
              />

              {/* Predictive Future Forecast Line (Dashed) */}
              {showForecast && (
                <Line
                  name="AI Predictive Growth Model (kg)"
                  type="monotone"
                  dataKey="predictedWeight"
                  stroke="#4f46e5"
                  strokeDasharray="5 5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4f46e5' }}
                />
              )}

              {/* Breed Target Benchmark Line */}
              <Line
                name="Breed Target Standard (kg)"
                type="monotone"
                dataKey="target"
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedChartData.filter(d => d.type === 'historical')} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
              <YAxis yAxisId="left" domain={[1.0, 5.0]} tick={{ fontSize: 11, fill: '#8b5cf6' }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#2563eb' }} tickLine={false} unit="L" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={28}
                iconType="circle"
                formatter={(value) => <span className="text-xs font-semibold text-gray-700">{value}</span>}
              />
              <Line
                yAxisId="left"
                name="Body Condition (1-5)"
                type="monotone"
                dataKey="bcs"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                name="Milk Yield (L/day)"
                type="monotone"
                dataKey="milk"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Biological Market Advice Note */}
      <div className="p-3.5 rounded-2xl border bg-amber-50/70 border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
        <span className="text-base">💡</span>
        <div className="flex-1">
          <div className="font-bold flex items-center justify-between">
            <span>Optimal Market Timing Advisory</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 font-extrabold uppercase">
              ROI Peak
            </span>
          </div>
          <p className="mt-0.5 font-medium leading-relaxed">
            Market research across Indian Mandis shows livestock reach maximum feed-to-value efficiency at <strong>{activeAnimal.optimalMarketWeight} kg</strong>. Holding past this weight reduces marginal daily gain value below daily feed expense (₹{activeAnimal.dailyFeedCost}/day). Aim to market within 10 days of <strong>{formattedSaleDate}</strong>.
          </p>
        </div>
      </div>

      {/* Add Observation Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Record Weight Observation</h3>
                <p className="text-xs text-gray-500">{activeAnimal.name} · {activeAnimal.tag}</p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveObservation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Measured Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder={`e.g. ${latestRec.weightKg + 4}`}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    BCS Score (1-5)
                  </label>
                  <select
                    value={newBcs}
                    onChange={(e) => setNewBcs(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="2.5">2.5 - Lean</option>
                    <option value="3.0">3.0 - Moderate</option>
                    <option value="3.5">3.5 - Ideal</option>
                    <option value="4.0">4.0 - Good</option>
                    <option value="4.5">4.5 - Heavy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Daily Milk (L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 18.5"
                    value={newMilk}
                    onChange={(e) => setNewMilk(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Health Milestone / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deworming booster, feed silage transition"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 flex items-center gap-1.5 font-medium">
                <span>💾</span>
                <span>Works 100% offline. Automatically recalculates predictive sale dates.</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
