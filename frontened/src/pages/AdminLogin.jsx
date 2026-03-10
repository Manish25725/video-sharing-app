import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";

const AdminLogin = () => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAdminStatus } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Small delay to prevent brute-force
    await new Promise((r) => setTimeout(r, 400));

    const adminKey = import.meta.env.VITE_ADMIN_KEY;
    if (!adminKey) {
      setError("Admin access is not configured. Contact the system administrator.");
      setLoading(false);
      return;
    }

    if (key.trim() === adminKey) {
      setAdminStatus(true);
      navigate("/admin-dashboard", { replace: true });
    } else {
      setError("Invalid admin key. Access denied.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-500/30 mx-auto mb-6">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-1">Admin Access</h1>
          <p className="text-sm text-slate-400 text-center mb-8">Enter your administrator key to continue</p>

          {error && (
            <div className="flex items-start gap-2.5 mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="adminKey" className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Admin Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="adminKey"
                  type={showKey ? "text" : "password"}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Enter admin key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : "Access Admin Panel"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          This area is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
