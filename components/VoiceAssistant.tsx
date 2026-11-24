import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { UI_STRINGS, OFFLINE_EMERGENCY_COMMANDS, VOICE_EXAMPLES, VOICE_CATEGORIES } from '../constants';

interface VoiceAssistantProps {
  profile: UserProfile;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ profile }) => {
  const [isActive, setIsActive] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeCategory, setActiveCategory] = useState('health');
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);

  const strings = UI_STRINGS[profile.language] || UI_STRINGS.en;
  const examples = VOICE_EXAMPLES[profile.language] || VOICE_EXAMPLES.en;

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const startSession = async () => {
    if (isOffline) {
      setTranscriptionHistory(prev => [
        ...prev,
        "System: Offline reference mode. Type 'rabies' or 'fmd' to view locally stored emergency guidance. Contact a veterinarian immediately for suspected emergencies.",
      ]);
      setIsActive(true);
      return;
    }

    // Live Gemini sessions require short-lived server-minted credentials. Never ship a
    // long-lived API key to the browser; secure live voice is intentionally disabled.
    setTranscriptionHistory(prev => [
      ...prev,
      'System: Secure live voice is not enabled in this prototype. Use the authenticated text assistant instead.',
    ]);
  };

  const stopSession = () => setIsActive(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 px-4">
      <div className={`rounded-[2.5rem] p-10 text-white text-center relative overflow-hidden shadow-2xl transition-all duration-700 ${isOffline ? 'bg-slate-800' : 'bg-emerald-900'}`}>
        <div className="absolute top-6 left-10 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-400'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {isOffline ? strings.voiceOffline : 'Secure voice unavailable'}
          </span>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tight">{strings.voiceTitle}</h2>
          <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
            {isOffline ? strings.voiceExplainer : 'Live voice is paused until secure short-lived credentials are configured.'}
          </p>
          <div className="flex justify-center items-center py-8">
            <button
              onClick={isActive ? stopSession : startSession}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative group ${isActive ? 'bg-red-500 scale-105' : 'bg-white text-emerald-900 hover:scale-105 active:scale-95'}`}
            >
              <i className={`fa-solid ${isActive ? 'fa-stop' : 'fa-microphone'} text-4xl mb-2`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest">{isActive ? 'Stop' : 'Start'}</span>
            </button>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {isActive ? 'Offline reference mode active' : strings.voicePrompt}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {VOICE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
          >
            <i className={`fa-solid ${cat.icon}`}></i>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {examples.filter(ex => ex.category.toLowerCase() === activeCategory).map((ex, i) => (
          <button
            key={i}
            onClick={() => setTranscriptionHistory(prev => [...prev, "You: " + ex.text])}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-left hover:border-emerald-500 transition-all shadow-sm group"
          >
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic mb-2 group-hover:text-emerald-600 transition">"{ex.text}"</p>
            <span className="text-[8px] font-black uppercase text-slate-400">One-tap query</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px]">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Conversation Insight</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
          {transcriptionHistory.map((entry, index) => (
            <div key={index} className={`p-4 rounded-2xl text-xs font-medium leading-relaxed ${entry.startsWith('You:') ? 'bg-slate-50 dark:bg-slate-800 ml-12 text-right' : 'bg-emerald-50 dark:bg-emerald-900/20 mr-12 text-left'}`}>
              {entry}
            </div>
          ))}
          {transcriptionHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <i className="fa-solid fa-microphone-slash text-4xl mb-4"></i>
              <p className="text-xs font-black uppercase tracking-widest">Start to view offline guidance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
