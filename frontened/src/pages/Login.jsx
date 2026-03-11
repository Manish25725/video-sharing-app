import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Eye, EyeOff, Mail, Lock, Play, Zap, Globe, Shield } from "lucide-react";

const BrandPanel = () => (
  <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
    <div className="relative z-10 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
        <Play className="w-5 h-5 text-white fill-current" />
      </div>
      <span className="text-white font-bold text-2xl tracking-tight">PlayVibe</span>
    </div>
    <div className="relative z-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white leading-tight">
          Share your world<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">one video at a time</span>
        </h1>
        <p className="mt-4 text-slate-400 text-base leading-relaxed">Upload, discover, and connect with a global community of creators.</p>
      </div>
      <div className="space-y-4">
        {[
          { icon: Zap,    text: "Upload & stream in HD quality" },
          { icon: Globe,  text: "Reach viewers across the globe" },
          { icon: Shield, text: "Secure & private by default" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-indigo-300" />
            </div>
            <span className="text-slate-300 text-sm">{text}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="relative z-10">
      <Link to="/admin-login" className="flex items-center gap-2 text-slate-600 hover:text-slate-300 transition-colors text-sm group">
        <Shield className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
        Administrator access
      </Link>
    </div>
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error || "Invalid credentials.");
    setLoading(false);
  };

  const field = "w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all";

  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="font-bold text-xl text-gray-900">PlayVibe</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue to PlayVibe</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input id="password" type={showPw ? "text" : "password"} required autoComplete="current-password"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Create one</Link>
          </p>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center lg:hidden">
            <Link to="/admin-login" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <Shield className="w-4 h-4" />
              Administrator login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
