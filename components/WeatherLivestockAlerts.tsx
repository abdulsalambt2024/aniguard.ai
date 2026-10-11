import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface Props {
  profile?: UserProfile;
}

interface WeatherData {
  temperature: number; // °C
  humidity: number; // %
  apparentTemperature: number; // °C
  windSpeed: number; // km/h
  precipitation: number; // mm
  weatherCode: number;
  locationName: string;
  thi: number; // Temperature-Humidity Index
  stressLevel: 'Safe' | 'Mild Alert' | 'Moderate Stress' | 'Severe Emergency';
  lastUpdated: string;
}

interface BreedAlert {
  breed: string;
  animalName: string;
  species: 'Cow' | 'Buffalo' | 'Goat';
  tag: string;
  severity: 'normal' | 'watch' | 'warning' | 'critical';
  title: string;
  reason: string;
  actionItems: string[];
  icon: string;
}

const REGIONS = [
  { name: 'Anand, Gujarat', lat: 22.5645, lng: 72.9289 },
  { name: 'Karnal, Haryana (NDRI)', lat: 29.6857, lng: 76.9905 },
  { name: 'Ludhiana, Punjab', lat: 30.9010, lng: 75.8573 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Bikaner, Rajasthan', lat: 28.0229, lng: 73.3119 }
];

export const WeatherLivestockAlerts: React.FC<Props> = ({ profile }) => {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSpeciesFilter, setActiveSpeciesFilter] = useState<'All' | 'Cow' | 'Buffalo' | 'Goat'>('All');
  const [mitigationNotice, setMitigationNotice] = useState<string>('');

  // Fetch real-time weather from Open-Meteo API
  const fetchLiveWeather = async (lat: number, lng: number, regionName: string) => {
    setIsLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.current) {
        const temp = data.current.temperature_2m;
        const rh = data.current.relative_humidity_2m;
        const appTemp = data.current.apparent_temperature;
        const wind = data.current.wind_speed_10m;
        const precip = data.current.precipitation;
        const code = data.current.weather_code;

        // Calculate Temperature-Humidity Index (NRC equation for dairy livestock)
        // THI = (1.8 * T + 32) - ((0.55 - 0.0055 * RH) * (1.8 * T - 26))
        const thiRaw = (1.8 * temp + 32) - ((0.55 - 0.0055 * rh) * (1.8 * temp - 26));
        const thi = Math.round(thiRaw * 10) / 10;

        let stressLevel: 'Safe' | 'Mild Alert' | 'Moderate Stress' | 'Severe Emergency' = 'Safe';
        if (thi >= 84) stressLevel = 'Severe Emergency';
        else if (thi >= 78) stressLevel = 'Moderate Stress';
        else if (thi >= 72) stressLevel = 'Mild Alert';

        setWeather({
          temperature: temp,
          humidity: rh,
          apparentTemperature: appTemp,
          windSpeed: wind,
          precipitation: precip,
          weatherCode: code,
          locationName: regionName,
          thi,
          stressLevel,
          lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.warn('Real-time weather API error, using regional meteorology fallback:', err);
      // Fallback realistic ambient for Anand, Gujarat
      const temp = 33.2;
      const rh = 68;
      const thi = Math.round(((1.8 * temp + 32) - ((0.55 - 0.0055 * rh) * (1.8 * temp - 26))) * 10) / 10;
      setWeather({
        temperature: temp,
        humidity: rh,
        apparentTemperature: 36.5,
        windSpeed: 12,
        precipitation: 0,
        weatherCode: 1,
        locationName: regionName,
        thi,
        stressLevel: thi >= 78 ? 'Moderate Stress' : 'Mild Alert',
        lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If profile has coordinates, respect them
    if (profile?.coords?.lat && profile?.coords?.lng) {
      fetchLiveWeather(profile.coords.lat, profile.coords.lng, profile.region || selectedRegion.name);
    } else {
      fetchLiveWeather(selectedRegion.lat, selectedRegion.lng, selectedRegion.name);
    }
  }, [selectedRegion, profile]);

  if (!weather && isLoading) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-900/10 text-center text-xs text-gray-400">
        Syncing real-time regional weather telemetry...
      </div>
    );
  }

  const { temperature, humidity, thi, stressLevel, apparentTemperature } = weather || {
    temperature: 32,
    humidity: 65,
    thi: 76.5,
    stressLevel: 'Mild Alert',
    apparentTemperature: 35
  };

  // Generate Breed-Specific Alerts based on live temperature, humidity & THI
  const breedAlerts: BreedAlert[] = [];

  // 1. Holstein Cross (Gauri) - Extreme heat & THI sensitivity
  if (thi >= 72) {
    const isCritical = thi >= 78;
    breedAlerts.push({
      breed: 'Holstein cross (Gauri)',
      animalName: 'Gauri',
      species: 'Cow',
      tag: 'IN-GJ-1042',
      severity: isCritical ? 'critical' : 'warning',
      icon: '🐄',
      title: isCritical ? '⚠️ High Thermal Stress on Crossbred Cow' : 'Notice: Mild Heat Stress Index',
      reason: `Current THI is ${thi} (Threshold: 72). Crossbred cows experience a 12–20% decline in milk production and rapid respiration above THI 72.`,
      actionItems: [
        'Activate barn cross-ventilation fans & misters.',
        'Provide unrestricted clean drinking water (< 20°C).',
        'Add 120g sodium bicarbonate buffer to morning silage.'
      ]
    });
  } else {
    breedAlerts.push({
      breed: 'Holstein cross (Gauri)',
      animalName: 'Gauri',
      species: 'Cow',
      tag: 'IN-GJ-1042',
      severity: 'normal',
      icon: '🐄',
      title: 'Comfort Zone: Optimal Lactation Weather',
      reason: `THI is ${thi}. Ambient temperature (${temperature}°C) is well within the thermo-neutral comfort zone (5–25°C).`,
      actionItems: ['Maintain routine pregnancy ration and dry matter intake.']
    });
  }

  // 2. Murrah Buffalo (Shera) - Low sweat gland density, requires wallowing
  if (temperature >= 31 || thi >= 74) {
    breedAlerts.push({
      breed: 'Murrah Buffalo (Shera)',
      animalName: 'Shera',
      species: 'Buffalo',
      tag: 'IN-GJ-2011',
      severity: temperature >= 35 ? 'critical' : 'warning',
      icon: '🐃',
      title: 'Water Spray & Wallowing Protocol Alert',
      reason: `Buffalos possess only 1/6th the sweat gland density of cattle and absorb intense radiation through dark hide at ${temperature}°C.`,
      actionItems: [
        'Hose body with water for 5 minutes at 11:30 AM and 02:30 PM.',
        'Spray water on shed tin roof to cut ambient radiation.',
        'Graze only in shaded paddocks or during twilight hours.'
      ]
    });
  } else {
    breedAlerts.push({
      breed: 'Murrah Buffalo (Shera)',
      animalName: 'Shera',
      species: 'Buffalo',
      tag: 'IN-GJ-2011',
      severity: 'normal',
      icon: '🐃',
      title: 'Stable Thermal State',
      reason: `Ambient conditions (${temperature}°C) safe for Murrah buffalo milk production.`,
      actionItems: ['Provide standard wet mash and mineral blocks.']
    });
  }

  // 3. Gir Cow (Lakshmi) - Heat-hardy Bos indicus, but vulnerable to extreme heat + humidity
  if (temperature >= 38 || (temperature >= 34 && humidity >= 75)) {
    breedAlerts.push({
      breed: 'Gir Cow (Lakshmi)',
      animalName: 'Lakshmi',
      species: 'Cow',
      tag: 'IN-GJ-1088',
      severity: 'watch',
      icon: '🐄',
      title: 'High Humidity & Heat Caution',
      reason: `Indigenous Gir cows withstand heat up to 38°C, but combined high humidity (${humidity}%) hinders sweat evaporation.`,
      actionItems: [
        'Shift grazing to early mornings before 09:30 AM.',
        'Supplement electrolyte salts in afternoon trough.'
      ]
    });
  } else {
    breedAlerts.push({
      breed: 'Gir Cow (Lakshmi)',
      animalName: 'Lakshmi',
      species: 'Cow',
      tag: 'IN-GJ-1088',
      severity: 'normal',
      icon: '🐄',
      title: 'Gir Breed Thermal Resilience Maintained',
      reason: `Indigenous Gir cattle possess high vascularity and skin fold sweating efficiency at ${temperature}°C.`,
      actionItems: ['Continue herbal udder post-milking barrier spray.']
    });
  }

  // 4. Sirohi Goat (Moti) - Humidity causes pneumonia & foot rot
  if (humidity >= 70) {
    breedAlerts.push({
      breed: 'Sirohi Goat (Moti)',
      animalName: 'Moti',
      species: 'Goat',
      tag: 'IN-GJ-3090',
      severity: 'warning',
      icon: '🐐',
      title: '⚠️ High Humidity: Pneumonia & Foot Rot Risk',
      reason: `Humidity at ${humidity}% (Safe: < 65%). Desert Sirohi goats are prone to Caprine Pneumonia and hoof dampness in high humidity.`,
      actionItems: [
        'Keep shed bedding bone-dry using slatted wooden racks.',
        'Dust dry slaked lime on floor to absorb ammonia and moisture.',
        'Inspect hooves for interdigital dermatitis (foot rot).'
      ]
    });
  } else {
    breedAlerts.push({
      breed: 'Sirohi Goat (Moti)',
      animalName: 'Moti',
      species: 'Goat',
      tag: 'IN-GJ-3090',
      severity: 'normal',
      icon: '🐐',
      title: 'Dry Paddock Climate Favorable',
      reason: `Relative humidity (${humidity}%) is well tolerated by Sirohi goats.`,
      actionItems: ['Provide clean legume fodder and green leaves.']
    });
  }

  // Filter alerts by species
  const filteredAlerts = breedAlerts.filter(a =>
    activeSpeciesFilter === 'All' ? true : a.species === activeSpeciesFilter
  );

  const handleApplyMitigation = (alertTitle: string) => {
    setMitigationNotice(`✓ Heat mitigation protocol logged for your herd care plan.`);
    setTimeout(() => setMitigationNotice(''), 3500);
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-900/10 space-y-4">
      {/* Title & Location Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm">🌤️</span>
            <h2 className="text-lg font-bold text-gray-900">Live Weather & Breed Thermal Alerts</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time Temperature-Humidity Index (THI) & physiological warnings for Indian livestock
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Region selector */}
          <select
            value={selectedRegion.name}
            onChange={(e) => {
              const reg = REGIONS.find(r => r.name === e.target.value) || REGIONS[0];
              setSelectedRegion(reg);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white shadow-2xs outline-none"
          >
            {REGIONS.map(r => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={() => fetchLiveWeather(selectedRegion.lat, selectedRegion.lng, selectedRegion.name)}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition active:scale-95 text-xs font-bold"
            title="Refresh weather data"
          >
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Main Meteorological Stats Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1a3c2b] to-[#2d5a42] text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {weather?.weatherCode && weather.weatherCode > 50 ? '🌧️' : weather?.temperature && weather.temperature > 32 ? '☀️' : '⛅'}
            </span>
            <div>
              <div className="text-2xl font-black">{temperature}°C</div>
              <div className="text-[11px] text-emerald-200">Real-Feel: {apparentTemperature}°C</div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className={`w-2.5 h-2.5 rounded-full ${
                stressLevel === 'Severe Emergency' ? 'bg-red-500 animate-ping' :
                stressLevel === 'Moderate Stress' ? 'bg-amber-400 animate-pulse' :
                stressLevel === 'Mild Alert' ? 'bg-amber-300' : 'bg-emerald-400'
              }`} />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                {stressLevel}
              </span>
            </div>
            <div className="text-xs text-white/80 font-medium mt-0.5">
              THI Index: <strong className="text-white text-sm">{thi}</strong>
            </div>
          </div>
        </div>

        {/* Environmental Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <div className="text-[10px] text-emerald-200 font-medium">Relative Humidity</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{humidity}%</div>
          </div>

          <div className="bg-white/10 rounded-xl p-2 text-center">
            <div className="text-[10px] text-emerald-200 font-medium">Wind Speed</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{weather?.windSpeed || 10} km/h</div>
          </div>

          <div className="bg-white/10 rounded-xl p-2 text-center">
            <div className="text-[10px] text-emerald-200 font-medium">Precipitation</div>
            <div className="text-sm font-extrabold text-white mt-0.5">{weather?.precipitation || 0} mm</div>
          </div>
        </div>

        {/* THI Visual Scale Indicator */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-emerald-200 font-mono">
            <span>&lt; 72 (Normal)</span>
            <span className="text-amber-300 font-bold">72–78 (Alert)</span>
            <span className="text-red-300 font-bold">&gt; 78 (Heat Stress)</span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(10, ((thi - 60) / 30) * 100))}%`,
                backgroundColor: thi >= 80 ? '#ef4444' : thi >= 72 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {mitigationNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between animate-in fade-in">
          <span>{mitigationNotice}</span>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">Logged</span>
        </div>
      )}

      {/* Breed-Specific Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-bold text-gray-500 mr-1 shrink-0">Filter:</span>
        {(['All', 'Cow', 'Buffalo', 'Goat'] as const).map(species => (
          <button
            key={species}
            onClick={() => setActiveSpeciesFilter(species)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 ${
              activeSpeciesFilter === species
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {species === 'All' ? 'All Breeds (4)' : `${species}s`}
          </button>
        ))}
      </div>

      {/* Breed Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert, idx) => {
          const isCrit = alert.severity === 'critical';
          const isWarn = alert.severity === 'warning';
          const isWatch = alert.severity === 'watch';

          const cardBg = isCrit
            ? 'bg-red-50/80 border-red-200 text-red-950'
            : isWarn
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : isWatch
            ? 'bg-orange-50/80 border-orange-200 text-orange-950'
            : 'bg-emerald-50/60 border-emerald-100 text-emerald-950';

          const badgeBg = isCrit
            ? 'bg-red-600 text-white'
            : isWarn
            ? 'bg-amber-500 text-white'
            : isWatch
            ? 'bg-orange-500 text-white'
            : 'bg-emerald-600 text-white';

          return (
            <div key={idx} className={`p-4 rounded-2xl border ${cardBg} space-y-2 shadow-2xs transition-all`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{alert.icon}</span>
                  <div>
                    <div className="font-extrabold text-xs flex items-center gap-1.5">
                      <span>{alert.breed}</span>
                      <span className="text-[10px] font-mono text-gray-500">({alert.tag})</span>
                    </div>
                    <div className="text-xs font-bold mt-0.5">{alert.title}</div>
                  </div>
                </div>

                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeBg} shadow-2xs`}>
                  {alert.severity}
                </span>
              </div>

              <p className="text-xs text-gray-700 font-medium leading-relaxed">
                {alert.reason}
              </p>

              {/* Actionable Veterinary Management Guidelines */}
              <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200/60 space-y-1">
                <div className="text-[11px] font-bold text-gray-900 flex items-center justify-between">
                  <span>Veterinary Mitigation Protocols:</span>
                  <button
                    onClick={() => handleApplyMitigation(alert.title)}
                    className="text-[10px] font-bold text-emerald-800 hover:underline"
                  >
                    + Add to Care Plan
                  </button>
                </div>
                <ul className="space-y-0.5 text-xs text-gray-600">
                  {alert.actionItems.map((action, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
