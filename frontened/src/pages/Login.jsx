import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { login, googleLogin } = useAuth();
  
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    if (!result.success) {
      setError(result.error || "Google authentication failed.");
    } else {
      navigate("/");
    }
    setLoading(false);
  };
  
  const handleGoogleError = () => {
    setError("Google authentication failed.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "Invalid credentials.");
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0a0a0a", fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: "rgba(236,91,19,0.18)", filter: "blur(120px)" }} />
        <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: "rgba(236,91,19,0.1)", filter: "blur(120px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo section */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#ec5b13 0%,#8b5cf6 100%)",
              border: "1px solid rgba(236,91,19,0.3)",
              boxShadow: "0 8px 32px rgba(236,91,19,0.3)",
            }}
          >
            <svg className="w-8 h-8" fill="white" viewBox="0 0 48 48"><path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"/></svg>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ background: "linear-gradient(90deg,#fff 40%,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            PlayVibe
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest mt-1" style={{ color: "rgba(236,91,19,0.7)" }}>
            Experience the Rhythm
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: "rgba(28,18,13,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
            <p className="text-slate-400 mt-1 text-sm">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div
              className="mb-5 p-3.5 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                {/* Mail icon */}
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none" style={{ color: "#64748b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email" type="email" required autoComplete="email"
                  placeholder="name@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(236,91,19,0.2)" }}
                  onFocus={e => { e.target.style.borderColor = "#ec5b13"; e.target.style.boxShadow = "0 0 0 3px rgba(236,91,19,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(236,91,19,0.2)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <Link to="/forgot-password"
                  className="text-xs font-semibold transition-colors"
                  style={{ color: "#ec5b13" }}
                  onMouseEnter={e => (e.target.style.opacity = "0.8")}
                  onMouseLeave={e => (e.target.style.opacity = "1")}
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                {/* Lock icon */}
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none" style={{ color: "#64748b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password" type={showPw ? "text" : "password"} required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pl-12 pr-12 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(236,91,19,0.2)" }}
                  onFocus={e => { e.target.style.borderColor = "#ec5b13"; e.target.style.boxShadow = "0 0 0 3px rgba(236,91,19,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(236,91,19,0.2)"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#64748b" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ec5b13")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: "#ec5b13", boxShadow: "0 4px 20px rgba(236,91,19,0.3)" }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(236,91,19,0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = "#ec5b13"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "rgba(236,91,19,0.1)" }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-xs font-medium uppercase tracking-widest"
                style={{ background: "rgba(28,18,13,0.95)", color: "#475569" }}
              >
                Or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <div className="flex justify-center mt-2 flex-col gap-2 items-center w-full">
            <GoogleLogin
               onSuccess={handleGoogleSuccess}
               onError={handleGoogleError}
               shape="pill"
               width="340px"
               theme="filled_black"
               text="continue_with"
            />
          </div>

          {/* Sign up link */}
          <p className="text-center mt-8 text-sm" style={{ color: "#94a3b8" }}>
            Don&apos;t have an account?{" "}
            <Link to="/signup"
              className="font-bold transition-colors"
              style={{ color: "#ec5b13" }}
              onMouseEnter={e => (e.target.style.textDecoration = "underline")}
              onMouseLeave={e => (e.target.style.textDecoration = "none")}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;




