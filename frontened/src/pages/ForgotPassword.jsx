import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Play, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../services/api.js";

const ForgotPassword = () => {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/users/forgot-password", { email });
      if (res?.resetUrl) setDevResetUrl(res.resetUrl);
      alert("Reset link resent to your email.");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSent(false); // Go back to form to show error properly if needed
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/users/forgot-password", { email });
      if (res?.resetUrl) setDevResetUrl(res.resetUrl);
      setSent(true);
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all";

  
  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: "#0a0a0a",
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div
          className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] opacity-40 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle, rgba(236,91,19,0.15) 0%, rgba(200,75,15,0.05) 40%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] opacity-30 mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle, rgba(236,91,19,0.12) 0%, rgba(200,75,15,0.02) 40%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
         <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative group"
            style={{ background: "rgba(236,91,19,0.1)", border: "1px solid rgba(236,91,19,0.2)" }}
          >
             <div className="absolute inset-0 rounded-2xl bg-[#ec5b13] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
             <Play size={32} style={{ color: "#ec5b13", fill: "#ec5b13" }} className="relative z-10 ml-1" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Recover Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Enter your email to receive a reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div
          className="py-8 px-4 shadow sm:rounded-2xl sm:px-10 border relative overflow-hidden"
          style={{
            background: "rgba(28,18,13,0.4)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderColor: "rgba(255,255,255,0.05)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {sent ? (
             <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                If <strong>{email}</strong> is registered, we've sent a password reset link.
                It expires in <strong>1 hour</strong>.
              </p>
              
              {devResetUrl && (
                <div className="mb-4 p-3.5 rounded-xl border text-xs text-left break-all"
                  style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                  <p className="font-semibold mb-1">⚠️ Dev mode — click to reset:</p>
                  <a href={devResetUrl} className="underline text-amber-500 break-all">{devResetUrl}</a>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mb-6">
                Didn't receive it? Check your spam folder, or{" "}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="font-medium disabled:opacity-50 transition-colors"
                  style={{ color: "#ec5b13" }}
                >
                  {loading ? "sending..." : "try again"}
                </button>.
              </p>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border"
                     style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.2)", color: "#f87171" }}
                >
                  <span className="text-sm font-medium leading-relaxed">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#ec5b13] transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full pl-11 pr-4 py-3.5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm transition-all duration-300"
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#ec5b13"; e.target.style.boxShadow = "0 0 0 1px #ec5b13"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: "#ec5b13",
                      boxShadow: "0 4px 14px 0 rgba(236,91,19,0.39)",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-gray-500" style={{ background: "rgba(28,18,13,1)" }}>
                      Remember your password?
                    </span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
                    style={{ color: "#ec5b13" }}
                  >
                     Back to Sign In
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
