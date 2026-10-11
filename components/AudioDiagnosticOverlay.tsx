import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranscript?: (transcript: string) => void;
  suggestedLanguage?: string;
}

export const AudioDiagnosticOverlay: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyTranscript,
  suggestedLanguage = 'hi-IN'
}) => {
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 - 100
  const [peakLevel, setPeakLevel] = useState<number>(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(16).fill(0));
  const [noiseFloor, setNoiseFloor] = useState<number>(15);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Live Speech Recognition test
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [testLanguage, setTestLanguage] = useState<string>(suggestedLanguage);

  // Audio API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Start microphone diagnostics
  const startDiagnostics = async () => {
    try {
      setMicStatus('requesting');
      setErrorMessage('');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicStatus('active');

      // Setup speech recognition for test transcription
      setupSpeechRecognition();

      // Start animation loop to monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let localPeak = 0;

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average RMS level (0 - 100)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 255) * 160));

        setAudioLevel(normalized);

        // Peak hold calculation
        if (normalized > localPeak) {
          localPeak = normalized;
        } else {
          localPeak = Math.max(0, localPeak - 0.8);
        }
        setPeakLevel(Math.round(localPeak));

        // Subsample frequency bands for visualizer (16 bars)
        const bands: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / 16));
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          bands.push(Math.round((val / 255) * 100));
        }
        setFrequencyData(bands);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setMicStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : err.message || 'Could not access audio device.'
      );
    }
  };

  // Stop microphone diagnostics
  const stopDiagnostics = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecognizing(false);
  };

  // Setup Web Speech Recognition
  const setupSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = testLanguage;

      recognition.onstart = () => setIsRecognizing(true);
      recognition.onend = () => setIsRecognizing(false);
      recognition.onerror = () => setIsRecognizing(false);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
    }
  };

  // Calibrate barn background noise
  const handleCalibrateNoise = () => {
    setIsCalibrating(true);
    let sampleSum = 0;
    let count = 0;
    const interval = setInterval(() => {
      sampleSum += audioLevel;
      count++;
      if (count >= 15) {
        clearInterval(interval);
        const baseline = Math.round(sampleSum / count);
        setNoiseFloor(Math.max(10, baseline));
        setIsCalibrating(false);
      }
    }, 100);
  };

  useEffect(() => {
    if (isOpen) {
      startDiagnostics();
    } else {
      stopDiagnostics();
    }
    return () => {
      stopDiagnostics();
    };
  }, [isOpen, testLanguage]);

  if (!isOpen) return null;

  // Evaluate audio signal quality
  let audioQuality = 'Quiet / Low';
  let qualityColor = 'text-amber-600 bg-amber-50 border-amber-200';
  let qualityBadge = '🟡 Low Level';
  let qualityAdvice = 'Voice volume is low. Bring phone closer to mouth (~15 cm).';

  if (audioLevel >= 30 && audioLevel <= 80) {
    audioQuality = 'Optimal Speech Level';
    qualityColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    qualityBadge = '🟢 Optimal';
    qualityAdvice = 'Signal is crisp and clear. Perfect for AI diagnostic transcription.';
  } else if (audioLevel > 80) {
    audioQuality = 'Too Loud / Clipping';
    qualityColor = 'text-red-700 bg-red-50 border-red-200';
    qualityBadge = '🔴 Too Loud';
    qualityAdvice = 'High volume or barn background noise detected (mooing/tractor). Step away from noise source.';
  }

  const handleUseTranscript = () => {
    if (onApplyTranscript && liveTranscript) {
      onApplyTranscript(liveTranscript);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm">🎙️</span>
              <h3 className="text-base font-bold text-gray-900">Microphone Audio Diagnostic</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Live VU meter & speech testing for reliable voice-to-text health queries
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Permission / Status Alert */}
        {micStatus === 'denied' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 font-medium">
            <div className="font-bold mb-1">Microphone Access Blocked</div>
            {errorMessage}
            <div className="mt-2 text-[11px] text-red-700">
              Please click the lock/settings icon in your browser URL bar and set Microphone to "Allow".
            </div>
          </div>
        )}

        {micStatus === 'requesting' && (
          <div className="p-4 text-center text-xs text-gray-500">
            Requesting microphone permission from your device...
          </div>
        )}

        {micStatus === 'active' && (
          <div className="space-y-4">
            {/* Real-time Decibel VU Meter */}
            <div className="bg-gray-900 rounded-2xl p-4 text-white shadow-inner space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Live Audio Input Level</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {audioLevel} <span className="text-[10px] text-gray-500">/ 100 VU</span>
                </span>
              </div>

              {/* Multi-segment Level Bar */}
              <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${audioLevel}%`,
                    background:
                      audioLevel < 30
                        ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                        : audioLevel <= 80
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #10b981, #ef4444)'
                  }}
                />
                {/* Peak Hold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-sm transition-all duration-150"
                  style={{ left: `${peakLevel}%` }}
                />
              </div>

              {/* Threshold Zones Guide */}
              <div className="flex justify-between text-[10px] text-gray-400 px-1 font-mono">
                <span>0 (Silent)</span>
                <span className="text-emerald-400 font-bold">30–80 (Ideal Speech)</span>
                <span className="text-red-400">100 (Clip)</span>
              </div>

              {/* Animated 16-Band Equalizer / Waveform */}
              <div className="pt-2 border-t border-gray-800">
                <div className="flex items-end justify-between h-14 gap-1 px-1">
                  {frequencyData.map((band, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm transition-all duration-75"
                      style={{
                        height: `${Math.max(8, band)}%`,
                        backgroundColor:
                          band > 80 ? '#ef4444' : band > 30 ? '#10b981' : '#f59e0b',
                        opacity: band > 10 ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                <div className="text-center text-[9px] text-gray-500 mt-1 font-mono">
                  SPECTRUM ANALYZER (20 Hz - 8 kHz SPEECH BAND)
                </div>
              </div>
            </div>

            {/* Quality Evaluation Scorecard */}
            <div className={`p-3.5 rounded-2xl border ${qualityColor} space-y-1`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Status: {audioQuality}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/80 shadow-2xs">
                  {qualityBadge}
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed">{qualityAdvice}</p>
            </div>

            {/* Barn Noise Calibration */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
              <div>
                <div className="font-bold text-gray-800">Barn Noise Floor Calibration</div>
                <div className="text-[11px] text-gray-500">Current noise threshold: {noiseFloor}%</div>
              </div>
              <button
                onClick={handleCalibrateNoise}
                disabled={isCalibrating}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 font-bold text-gray-700 shadow-2xs active:scale-95 transition"
              >
                {isCalibrating ? 'Calibrating...' : 'Calibrate Mic'}
              </button>
            </div>

            {/* Live Speech Recognition Test Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span className="text-xs font-bold text-emerald-950">Live Voice Transcription Test</span>
                </div>
                <select
                  value={testLanguage}
                  onChange={(e) => setTestLanguage(e.target.value)}
                  className="text-xs font-semibold px-2 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none"
                >
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                  <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                  <option value="en-IN">English (India)</option>
                </select>
              </div>

              <div className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200 min-h-[50px]">
                {liveTranscript ? (
                  <span className="text-gray-900 font-medium">"{liveTranscript}"</span>
                ) : (
                  <span className="text-gray-400 italic">
                    Say something: "मेरी गाय चारा नहीं खा रही है" or "My buffalo has mild fever"...
                  </span>
                )}
              </div>

              {liveTranscript && (
                <button
                  onClick={handleUseTranscript}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Use This Voice Query in AskPage</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
