import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X } from 'lucide-react';

const VoiceSearch = ({ onResult, compact = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      if (interim) setInterimText(interim);
      if (final) {
        setInterimText('');
        onResultRef.current(final.trim());
      }
    };

    recognition.onend = () => { setIsListening(false); setInterimText(''); };
    recognition.onerror = () => { setIsListening(false); setInterimText(''); };

    recognitionRef.current = recognition;
    return () => { recognition.abort(); };
  }, [isSupported]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInterimText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch { /* already active */ }
    }
  };

  if (!isSupported) {
    return (
      <button disabled title="Voice search is not supported in this browser"
        className={`rounded-full text-gray-300 cursor-not-allowed flex items-center justify-center ${compact ? 'w-8 h-8' : 'p-1.5'}`}>
        <MicOff className={compact ? 'w-4 h-4' : 'w-4 h-4'} />
      </button>
    );
  }

  return (
    <>
      {/* Mic button */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Search by voice'}
          className={`relative flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none ${compact ? 'w-8 h-8' : 'w-7 h-7'} ${
            isListening
              ? 'bg-red-500 text-white shadow-md shadow-red-200'
              : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {/* Ripple rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
              <span className="absolute -inset-1.5 rounded-full border border-red-300 opacity-50 animate-ping" style={{ animationDelay: '0.15s' }} />
            </>
          )}
          {isListening ? (
            <span className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <span className="flex items-end justify-center gap-[2px] h-3.5 leading-none">
                <span
                  className="block w-[2px] rounded-full bg-white"
                  style={{ height: '45%', transformOrigin: 'bottom center', animation: 'voicePulse 0.55s ease-in-out 0s infinite alternate' }}
                />
                <span
                  className="block w-[2px] rounded-full bg-white"
                  style={{ height: '80%', transformOrigin: 'bottom center', animation: 'voicePulse 0.55s ease-in-out 0.12s infinite alternate' }}
                />
                <span
                  className="block w-[2px] rounded-full bg-white"
                  style={{ height: '60%', transformOrigin: 'bottom center', animation: 'voicePulse 0.55s ease-in-out 0.24s infinite alternate' }}
                />
              </span>
            </span>
          ) : (
            <Mic className="w-3.5 h-3.5 relative z-10" />
          )}
        </button>
      </div>

      {/* Listening overlay — centred on screen (Portalled to escape stacking contexts) */}
      {isListening && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={toggleListening}
          />

          {/* Card - positioned slightly below center for standard view, but safe from header */}
          <div className="fixed z-[1001] left-1/2 top-24 -translate-x-1/2 w-80 glass rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in duration-200">
            {/* Top gradient strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />

            {/* Close button - top right corner */}
            <button
              onClick={toggleListening}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-6 py-8">
              {/* Header row */}
              <div className="flex flex-col items-center justify-center gap-4 mb-6">
                <div className="relative">
                  <span className="absolute -inset-4 rounded-full bg-orange-500/20 animate-ping opacity-75" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white">
                  {isListening ? "Listening..." : "Processing..."}
                </h3>
              </div>

              {/* Interim text */}
              <div className="min-h-[3rem] flex items-center justify-center mb-6 px-4">
                <p className="text-center text-lg text-gray-200 font-medium break-words w-full">
                  {interimText || <span className="text-gray-500 font-normal">Speak now...</span>}
                </p>
              </div>

              {/* Animated waveform bars */}
              <div className="flex items-end justify-center gap-1.5 h-12 pt-2">
                {[40, 70, 55, 90, 60, 100, 75, 50, 85, 45].map((pct, i) => (
                  <span
                    key={i}
                    className="block w-2 rounded-full bg-gradient-to-t from-orange-500 to-red-500 opacity-80"
                    style={{
                      height: `${pct}%`,
                      transformOrigin: 'bottom',
                      animation: `voiceBar 0.7s ease-in-out ${i * 0.07}s infinite alternate`,
                    }}
                  />
                ))}
              </div>

              {/* Helper text */}
              <p className="text-center text-xs text-gray-500 mt-6 font-medium">
                Tap anywhere to cancel
              </p>
            </div>
          </div>
        </>,
        document.body
      )}

      <style>{`
        @keyframes voiceBar {
          from { transform: scaleY(0.3); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
        @keyframes voicePulse {
          from { transform: scaleY(0.45); opacity: 0.7; }
          to   { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default VoiceSearch;
