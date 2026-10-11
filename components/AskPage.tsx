import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { AudioDiagnosticOverlay } from './AudioDiagnosticOverlay';

interface Props {
  profile: UserProfile;
}

interface Message {
  id: number;
  from: 'bot' | 'user';
  text: string;
  structured?: {
    summary: string;
    couldBe: string[];
    doNow: string[];
    callVetIf: string;
  };
}

const suggestions = ['Udder swelling', 'Goat with fever', 'Not eating fodder', 'Lumpy skin patches'];

const initialMessages: Message[] = [
  { id: 1, from: 'bot', text: 'Namaste Ramesh. What is happening with your herd? You can type or speak in Hindi, Gujarati, or English.' },
  { id: 2, from: 'user', text: 'My cow is eating less and giving less milk.' },
  {
    id: 3,
    from: 'bot',
    text: '',
    structured: {
      summary: 'Eating less and giving less milk can mean early stress, subclinical mastitis, or digestive acidosis.',
      couldBe: ['Subclinical Mastitis', 'Acidosis or ketosis after silage feed change', 'Mild tick-borne fever'],
      doNow: [
        'Check rectal temperature. Normal is 38.3–39.2°C.',
        'Look for clots or watery milk using a CMT paddle or strip cup.',
        'Provide shade, clean water, and oral electrolyte salts.',
      ],
      callVetIf: 'temperature exceeds 39.5°C, or milk drops more than 20% over 48 hours.',
    },
  },
];

const AskPage: React.FC<Props> = ({ profile }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micLanguage, setMicLanguage] = useState<'hi-IN' | 'gu-IN' | 'en-IN'>('hi-IN');
  const [audioFeedbackNotice, setAudioFeedbackNotice] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Quick speech recognition toggle
  const toggleQuickListen = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setShowDiagnostic(true);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = micLanguage;

        rec.onstart = () => {
          setIsListening(true);
          setAudioFeedbackNotice('🎙️ Listening... Speak your animal symptoms clearly.');
        };

        rec.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        rec.onerror = (e: any) => {
          setIsListening(false);
          setAudioFeedbackNotice('Mic error. Click "Test Mic Levels" to calibrate.');
          setTimeout(() => setAudioFeedbackNotice(''), 3500);
        };

        rec.onend = () => {
          setIsListening(false);
          setAudioFeedbackNotice('✓ Voice transcribed. Tap Send for AI clinical advice.');
          setTimeout(() => setAudioFeedbackNotice(''), 3000);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (e) {
        setShowDiagnostic(true);
      }
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), from: 'user', text };
    
    // Dynamic simulated veterinarian advice
    let summary = 'Guidance based on your clinical description.';
    let couldBe = ['Environmental stress', 'Subclinical infection', 'Nutritional imbalance'];
    let doNow = ['Isolate affected animal in a clean shed.', 'Record body temperature morning and evening.', 'Ensure clean fresh water with electrolytes.'];
    let callVetIf = 'vital signs worsen or animal remains off-feed for more than 24 hours.';

    const lower = text.toLowerCase();
    if (lower.includes('fever') || lower.includes('बुखार') || lower.includes('તાવ')) {
      summary = 'High temperature indicates acute systemic infection or blood protozoan disease.';
      couldBe = ['Theileriosis or Babesiosis (Tick fever)', 'Hemorrhagic Septicemia (HS)', 'Ephemeral Fever (Three-day sickness)'];
      doNow = ['Administer cold water head sponge.', 'Keep in shaded, well-ventilated enclosure.', 'Provide oral paracetamol bolus if prescribed by vet.'];
      callVetIf = 'rectal temperature remains above 40°C or rapid labored breathing occurs.';
    } else if (lower.includes('udder') || lower.includes('mastitis') || lower.includes('थन') || lower.includes('swelling')) {
      summary = 'Udder inflammation strongly indicates bovine mastitis requiring prompt therapeutic action.';
      couldBe = ['Acute Coliform Mastitis', 'Staphylococcal udder infection', 'Physical trauma/udder hematoma'];
      doNow = ['Complete strip milking of affected quarter every 2 hours.', 'Apply cooling herbal udder paste or ice compress.', 'Disinfect teat after milking.'];
      callVetIf = 'milk shows bloody clots, quarter is hot and hard, or systemic fever develops.';
    }

    const botMsg: Message = {
      id: Date.now() + 1,
      from: 'bot',
      text: '',
      structured: { summary, couldBe, doNow, callVetIf },
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col pb-8 animate-in fade-in duration-400" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Title & Diagnostic Trigger */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ask AniGuard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vet guidance in English, Hindi, or Gujarati</p>
        </div>

        <button
          onClick={() => setShowDiagnostic(true)}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-emerald-800 text-emerald-950 bg-white hover:bg-emerald-50 transition shadow-xs active:scale-95 flex items-center gap-1.5"
          title="Open audio level meter and microphone diagnostic overlay"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>🎙️ Test Mic Levels</span>
        </button>
      </div>

      {/* Audio Diagnostic Modal */}
      <AudioDiagnosticOverlay
        isOpen={showDiagnostic}
        onClose={() => setShowDiagnostic(false)}
        suggestedLanguage={micLanguage}
        onApplyTranscript={(trans) => {
          setInput(trans);
          setAudioFeedbackNotice('✓ Audio calibrated. Voice query inserted below.');
          setTimeout(() => setAudioFeedbackNotice(''), 3000);
        }}
      />

      {/* Audio Feedback Alert Banner */}
      {audioFeedbackNotice && (
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center justify-between animate-in fade-in">
          <span>{audioFeedbackNotice}</span>
          <button
            onClick={() => setShowDiagnostic(true)}
            className="text-[11px] underline font-bold"
          >
            Check Meter
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4">
        {messages.map(msg => {
          if (msg.from === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-medium text-white shadow-xs"
                  style={{ backgroundColor: '#1a3c2b' }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.structured) {
            return (
              <div key={msg.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                <p className="text-sm font-bold text-gray-900 leading-snug">{msg.structured.summary}</p>

                <div>
                  <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: '#e65100' }}>
                    It could be
                  </p>
                  <ul className="space-y-1">
                    {msg.structured.couldBe.map((item, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5 font-medium">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: '#1a5c30' }}>
                    Do this now
                  </p>
                  <ul className="space-y-1">
                    {msg.structured.doNow.map((item, i) => (
                      <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5 font-medium">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-3 border border-red-200" style={{ backgroundColor: '#fdecea' }}>
                  <p className="text-xs text-red-900">
                    <span className="font-bold">🚨 Call a vet immediately if:</span> {msg.structured.callVetIf}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[80%] bg-white px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-gray-800 shadow-sm border border-gray-100">
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion Pills */}
      <div className="flex gap-2 flex-wrap mb-3">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 border border-gray-200 bg-white hover:bg-emerald-50 transition shadow-2xs"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Bar with Voice Support */}
      <div className="flex gap-2 items-center">
        {/* Language selector chip */}
        <select
          value={micLanguage}
          onChange={(e: any) => setMicLanguage(e.target.value)}
          className="px-2.5 py-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 outline-none"
          title="Select Voice Language"
        >
          <option value="hi-IN">हिन्दी</option>
          <option value="gu-IN">ગુજરાતી</option>
          <option value="en-IN">English</option>
        </select>

        {/* Text Input */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder={isListening ? "Listening... speak now" : "Describe symptoms or ask clinical query..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-700 outline-none pr-10 ${
              isListening
                ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/20'
                : 'border-gray-200 bg-white'
            }`}
          />
          {/* Quick Voice Mic Button */}
          <button
            type="button"
            onClick={toggleQuickListen}
            className={`absolute right-2 p-1.5 rounded-lg transition active:scale-90 ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Speak symptoms using voice-to-text"
          >
            {isListening ? '⏹️' : '🎙️'}
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={() => sendMessage(input)}
          className="px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          style={{ backgroundColor: '#F5A623', color: '#1a3c2b' }}
        >
          Send
        </button>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-2">
        Guidance only. Always consult a registered veterinarian for prescription medicines.
      </p>
    </div>
  );
};

export default AskPage;
