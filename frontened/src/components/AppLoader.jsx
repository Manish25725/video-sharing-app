import { useEffect, useState } from "react";
import { Play } from "lucide-react";

const STEPS = [
  "Synchronizing your library...",
  "Loading your profile...",
  "Curating your feed...",
  "Almost there...",
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
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden transition-colors duration-500"
      style={{ background: "#141414", fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full"
          style={{ background: "rgba(236,91,19,0.1)", filter: "blur(120px)" }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full"
          style={{ background: "rgba(236,91,19,0.05)", filter: "blur(120px)" }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-[960px] w-full px-6">

        {/* Spinner + logo */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Static ring */}
          <div className="absolute w-32 h-32 rounded-full border-2"
            style={{ borderColor: "rgba(236,91,19,0.2)" }} />
          {/* Spinning ring */}
          <div className="absolute w-32 h-32 rounded-full border-t-2"
            style={{ borderColor: "#ec5b13", animation: "loaderSpin 1.5s linear infinite" }} />
          {/* Logo circle */}
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full"
            style={{
              background: "linear-gradient(135deg, #ec5b13, #fb923c)",
              boxShadow: "0 0 40px rgba(236,91,19,0.3)",
            }}>
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
          {/* Pulsing halo */}
          <div className="absolute w-24 h-24 rounded-full animate-ping"
            style={{ background: "rgba(236,91,19,0.4)", opacity: 0.2 }} />
        </div>

        {/* Text & progress */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-slate-100 text-2xl font-semibold tracking-tight">PlayVibe</h1>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-[0.2em] animate-pulse">
              Loading Experience
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: "#ec5b13" }}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-slate-400 text-xs font-normal">{STEPS[stepIdx]}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-4"
              style={{ color: "#ec5b13" }}>
              Premium Membership Active
            </p>
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-slate-600 text-[11px] font-medium tracking-widest uppercase">
          Cinematic Intelligence • Ultra HD Ready
        </p>
      </div>

      <style>{`@keyframes loaderSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AppLoader;
