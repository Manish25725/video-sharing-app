import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

const VoiceSearch = ({ onResult }) => {
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
        className="p-1.5 rounded-full text-gray-300 cursor-not-allowed">
        <MicOff className="w-4 h-4" />
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
          className={`relative w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none ${
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
          <Mic className="w-3.5 h-3.5 relative z-10" />
        </button>
      </div>

      {/* Listening overlay — centred on screen */}
      {isListening && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
            onClick={toggleListening}
          />

          {/* Card */}
          <div className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Top gradient strip */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="px-6 py-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-sm font-semibold text-gray-800">Listening…</span>
                </div>
                <button
                  onClick={toggleListening}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Big mic icon */}
              <div className="flex justify-center mb-4">
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-red-50">
                  <span className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-60" />
                  <Mic className="w-8 h-8 text-red-500 relative z-10" />
                </div>
              </div>

              {/* Interim text */}
              <p className="text-center text-sm text-gray-500 min-h-[1.25rem] truncate mb-4">
                {interimText || 'Speak now…'}
              </p>

              {/* Animated waveform bars */}
              <div className="flex items-end justify-center space-x-1 h-8">
                {[40, 70, 55, 90, 60, 100, 75, 50, 85, 45].map((pct, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-400"
                    style={{
                      height: `${pct}%`,
                      animation: `voiceBar 0.7s ease-in-out ${i * 0.07}s infinite alternate`,
                    }}
                  />
                ))}
              </div>

              {/* Helper text */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Click anywhere outside or tap ✕ to cancel
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes voiceBar {
          from { transform: scaleY(0.3); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default VoiceSearch;
