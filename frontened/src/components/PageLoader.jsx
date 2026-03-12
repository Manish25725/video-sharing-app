import { Play } from "lucide-react";

/**
 * PageLoader — compact full-area loader for page-level data fetching.
 * Drop-in replacement for inline loading spinners across pages.
 *
 * Usage:  {loading && <PageLoader />}
 *         {loading && <PageLoader message="Loading videos..." />}
 */
const PageLoader = ({ message = "Loading..." }) => (
  <div
    className="flex flex-col items-center justify-center w-full py-24 gap-6"
    style={{ fontFamily: "'Public Sans', sans-serif" }}
  >
    {/* Spinner + logo */}
    <div className="relative flex items-center justify-center">
      {/* static ring */}
      <div
        className="absolute w-16 h-16 rounded-full border-2"
        style={{ borderColor: "rgba(236,91,19,0.2)" }}
      />
      {/* spinning ring */}
      <div
        className="absolute w-16 h-16 rounded-full border-t-2"
        style={{ borderColor: "#ec5b13", animation: "pageLoaderSpin 1.5s linear infinite" }}
      />
      {/* logo */}
      <div
        className="relative flex items-center justify-center w-12 h-12 rounded-full"
        style={{
          background: "linear-gradient(135deg, #ec5b13, #fb923c)",
          boxShadow: "0 0 24px rgba(236,91,19,0.35)",
        }}
      >
        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
      </div>
      {/* pulse halo */}
      <div
        className="absolute w-12 h-12 rounded-full animate-ping"
        style={{ background: "rgba(236,91,19,0.35)", opacity: 0.25 }}
      />
    </div>

    {/* Message */}
    <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>

    <style>{`@keyframes pageLoaderSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default PageLoader;
