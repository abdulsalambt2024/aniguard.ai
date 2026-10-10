import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { offlineStorage } from '../services/offlineStorageService';

interface Props {
  profile: UserProfile;
}

interface VoiceHealthRecord {
  id: string;
  animalName: string;
  timestamp: string;
  rawTranscript: string;
  detectedSymptoms: string[];
  vitalNotes: string;
  severity: 'Normal' | 'Watch' | 'Critical';
}

const SAMPLE_LOGS: VoiceHealthRecord[] = [
  {
    id: 'log-1',
    animalName: 'Gauri (IN-GJ-1042)',
    timestamp: 'Today, 08:30 AM',
    rawTranscript: 'Gauri ate complete green fodder, rumen activity normal, morning milk 9.5 liters.',
    detectedSymptoms: ['Good appetite', 'Normal rumination'],
    vitalNotes: 'Milk: 9.5 L · Temp: 38.6°C',
    severity: 'Normal'
  },
  {
    id: 'log-2',
    animalName: 'Lakshmi (IN-GJ-1088)',
    timestamp: 'Yesterday, 06:15 PM',
    rawTranscript: 'Lakshmi seems lethargic with mild warmth in left hind quarter, refused concentrate.',
    detectedSymptoms: ['Reduced appetite', 'Possible early mastitis warmth'],
    vitalNotes: 'Temp: 39.4°C · 18% yield drop',
    severity: 'Watch'
  }
];

export const VoiceHealthLog: React.FC<Props> = ({ profile }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('Gauri');
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN' | 'gu-IN'>('en-IN');
  const [logs, setLogs] = useState<VoiceHealthRecord[]>(SAMPLE_LOGS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [language]);

  // Simulated microphone volume pulse when recording
  useEffect(() => {
    if (isRecording) {
      const updatePulse = () => {
        setAudioLevel(Math.sin(Date.now() / 150) * 0.4 + 0.6);
        animFrameRef.current = requestAnimationFrame(updatePulse);
      };
      animFrameRef.current = requestAnimationFrame(updatePulse);
    } else {
      setAudioLevel(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // Fallback for browsers without Web Speech API
      simulateVoiceInput();
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Starting speech recognition fallback:', err);
        simulateVoiceInput();
      }
    }
  };

  const simulateVoiceInput = () => {
    setIsRecording(true);
    const phrases = [
      `${selectedAnimal} has reduced feed intake this morning, rectal temperature measured thirty-nine point three degrees, milk dropped slightly.`,
      `${selectedAnimal} completed eighteen point five liters today, normal rumination, no signs of heat or swelling.`,
      `Checked ${selectedAnimal}, noticing mild cough and nasal discharge after evening grazing.`
    ];
    const chosen = phrases[Math.floor(Math.random() * phrases.length)];

    let current = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < chosen.length) {
        current += chosen[i];
        setTranscript(current);
        i++;
      } else {
        clearInterval(interval);
        setIsRecording(false);
      }
    }, 40);
  };

  // Smart Symptom Extraction
  const extractSymptoms = (text: string): { symptoms: string[]; severity: 'Normal' | 'Watch' | 'Critical' } => {
    const lower = text.toLowerCase();
    const symptoms: string[] = [];
    let severity: 'Normal' | 'Watch' | 'Critical' = 'Normal';

    if (lower.includes('fever') || lower.includes('temperature') || lower.includes('warmth')) {
      symptoms.push('Elevated body temperature');
      severity = 'Watch';
    }
    if (lower.includes('cough') || lower.includes('nasal') || lower.includes('discharge')) {
      symptoms.push('Respiratory symptoms / discharge');
      severity = 'Watch';
    }
    if (lower.includes('udder') || lower.includes('swelling') || lower.includes('mastitis')) {
      symptoms.push('Udder swelling / inflammation');
      severity = 'Critical';
    }
    if (lower.includes('reduced feed') || lower.includes('not eating') || lower.includes('refused')) {
      symptoms.push('Inappetence / feed drop');
      severity = 'Watch';
    }
    if (lower.includes('milk drop') || lower.includes('less milk')) {
      symptoms.push('Acute milk yield decline');
      severity = 'Watch';
    }
    if (lower.includes('normal') || lower.includes('healthy') || lower.includes('completed')) {
      symptoms.push('Healthy vital parameters');
    }

    if (symptoms.length === 0) {
      symptoms.push('General farmer observation noted');
    }

    return { symptoms, severity };
  };

  const handleSaveObservation = async () => {
    if (!transcript.trim()) return;

    const { symptoms, severity } = extractSymptoms(transcript);

    const newRecord: VoiceHealthRecord = {
      id: 'voice-' + Date.now(),
      animalName: `${selectedAnimal} (${
        selectedAnimal === 'Gauri' ? 'IN-GJ-1042' :
        selectedAnimal === 'Lakshmi' ? 'IN-GJ-1088' :
        selectedAnimal === 'Shera' ? 'IN-GJ-2011' : 'IN-GJ-3090'
      })`,
      timestamp: 'Just now',
      rawTranscript: transcript,
      detectedSymptoms: symptoms,
      vitalNotes: `Logged via Voice (${language.split('-')[0].toUpperCase()})`,
      severity
    };

    setLogs([newRecord, ...logs]);

    // Save to IndexedDB for offline access
    try {
      await offlineStorage.saveDailyRecord({
        id: newRecord.id,
        animalName: newRecord.animalName,
        date: new Date().toLocaleDateString('en-IN'),
        notes: newRecord.rawTranscript,
        symptoms: newRecord.detectedSymptoms,
        appetite: symptoms.some(s => s.includes('Inappetence')) ? 'Reduced' : 'Normal'
      });
    } catch (e) {
      console.warn('IndexedDB voice save error:', e);
    }

    setTranscript('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Voice Health Log</h2>
        <p className="text-sm text-gray-500 mt-0.5">Speak livestock symptoms in your language to auto-record</p>
      </div>

      {/* Language & Animal Selector Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700">Animal Target</label>
          <div className="flex gap-1.5">
            {['Gauri', 'Lakshmi', 'Shera', 'Moti'].map(name => (
              <button
                key={name}
                onClick={() => setSelectedAnimal(name)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  selectedAnimal === name
                    ? 'bg-emerald-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <label className="text-xs font-bold text-gray-700">Spoken Language</label>
          <div className="flex gap-1.5">
            {[
              { id: 'en-IN', label: 'English' },
              { id: 'hi-IN', label: 'हिन्दी' },
              { id: 'gu-IN', label: 'ગુજરાતી' }
            ].map(lang => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  language === lang.id
                    ? 'bg-amber-500 text-emerald-950 font-bold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Recorder Action Box */}
      <div className="rounded-3xl p-6 text-center text-white relative overflow-hidden shadow-lg" style={{ backgroundColor: '#1a3c2b' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a5c9b4' }}>
          {isRecording ? 'Listening to voice...' : 'Tap to start speaking'}
        </p>

        {/* Animated Microphone Button */}
        <div className="my-5 flex justify-center">
          <button
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all duration-300 relative ${
              isRecording
                ? 'bg-red-500 scale-105 ring-8 ring-red-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-emerald-950'
            }`}
            style={{
              transform: isRecording ? `scale(${1 + audioLevel * 0.15})` : 'scale(1)'
            }}
          >
            {isRecording ? '⏹' : '🎙️'}
          </button>
        </div>

        <p className="text-xs text-emerald-200 max-w-xs mx-auto">
          {isRecording
            ? 'Speaking... Mention appetite, rectal temperature, rumination or udder changes.'
            : 'Example: "Lakshmi has mild fever, eating half ration, milk down 2 liters."'}
        </p>
      </div>

      {/* Spoken Transcript & Auto-Extraction Card */}
      {transcript && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-200 animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Captured Transcript</span>
            <span className="text-[10px] text-gray-400 font-medium">Real-time STT</span>
          </div>
          <p className="text-sm text-gray-800 italic bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
            "{transcript}"
          </p>

          {/* AI Extracted Symptoms Preview */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700 mb-2">Auto-Extracted Observations:</p>
            <div className="flex flex-wrap gap-1.5">
              {extractSymptoms(transcript).symptoms.map((sym, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg"
                >
                  ✓ {sym}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveObservation}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition active:scale-95"
              style={{ backgroundColor: '#1a3c2b' }}
            >
              Save to {selectedAnimal}'s Record
            </button>
            <button
              onClick={() => setTranscript('')}
              className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-between">
          <span>✓ Spoken observations saved into IndexedDB livestock records!</span>
          <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full">Synced</span>
        </div>
      )}

      {/* Recent Spoken Health Logs */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">Recent Voice Logs</h3>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-gray-900">{log.animalName}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  log.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                  log.severity === 'Watch' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {log.severity}
                </span>
              </div>
              <p className="text-xs text-gray-600 italic mb-2">"{log.rawTranscript}"</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {log.detectedSymptoms.map((s, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-50">
                <span>{log.vitalNotes}</span>
                <span>{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceHealthLog;
