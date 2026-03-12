import { useEffect, useState } from "react";

const STEPS = [
  "Initializing engine…",
  "Loading your profile…",
  "Curating your interface…",
  "Almost there…",
];

const AppLoader = () => {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    // Animate progress from 0 → 95 over ~1.8 s
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) { clearInterval(interval); return 95; }
        const bump = Math.random() * 8 + 3;
        return Math.min(p + bump, 95);
      });
    }, 220);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length);
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: "#120a06", fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: "-10%", left: "-10%",
            width: "40%", height: "40%",
            background: "rgba(236,91,19,0.1)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: "-10%", right: "-10%",
            width: "40%", height: "40%",
            background: "rgba(236,91,19,0.05)",
            filter: "blur(120px)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md px-6">

        {/* Spinning ring + logo */}
        <div className="relative flex items-center justify-center">
          {/* Static outer ring */}
          <div
            className="absolute rounded-full border-2"
            style={{ width: 192, height: 192, borderColor: "rgba(236,91,19,0.2)" }}
          />
          {/* Spinning top-accent ring */}
          <div
            className="absolute rounded-full border-t-2"
            style={{
              width: 192, height: 192,
              borderColor: "#ec5b13",
              boxShadow: "0 0 20px rgba(236,91,19,0.35)",
              animation: "spin 1.6s linear infinite",
            }}
          />
          {/* Center logo */}
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 128, height: 128,
              background: "rgba(18,10,6,0.6)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#ec5b13", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#ff8c52", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="url(#logo-grad)"
              />
            </svg>
          </div>
        </div>

        {/* Text + progress */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">PlayVibe</h2>
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "rgba(236,91,19,0.75)" }}
            >
              Premium Video Experience
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Initializing
              </span>
              <span className="text-sm font-bold" style={{ color: "#ec5b13" }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full overflow-hidden"
              style={{ background: "rgba(236,91,19,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "#ec5b13",
                  boxShadow: "0 0 10px rgba(236,91,19,0.5)",
                }}
              />
            </div>
            <p className="text-[11px] text-center italic text-slate-500">
              {STEPS[stepIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* Footer badge */}
      <div className="absolute bottom-10 z-10">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* star icon */}
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#ec5b13" }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: "#64748b" }}
          >
            High Fidelity Stream Engine
          </span>
        </div>
      </div>

      {/* Inline spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AppLoader;
