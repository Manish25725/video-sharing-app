import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, Play, CheckCircle } from "lucide-react";
import api from "../services/api.js";

const ResetPassword = () => {
  const { token }              = useParams();
  const navigate               = useNavigate();
  const [newPw, setNewPw]       = useState("");
  const [confirm, setConfirm]  = useState("");
  const [showNew, setShowNew]  = useState(false);
  const [showCon, setShowCon]  = useState(false);
  const [loading, setLoading]  = useState(false);
  const [done, setDone]        = useState(false);
  const [error, setError]      = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPw !== confirm)       { setError("Passwords do not match."); return; }
    if (newPw.length < 6)        { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      await api.post(`/users/reset-password/${token}`, { newPassword: newPw });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err?.message || "This link has expired or is invalid. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  
  const pwInput = (id, label, val, setVal, show, setShow) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#ec5b13] transition-colors" />
        </div>
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="••••••••"
          className="appearance-none block w-full pl-11 pr-12 py-3.5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm transition-all duration-300"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#ec5b13"; e.target.style.boxShadow = "0 0 0 1px #ec5b13"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button type="button" onClick={() => setShow(!show)}
            className="p-1 text-gray-400 hover:text-white focus:outline-none transition-colors">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
        </div>
      </div>
    </div>
  );

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
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Create a new secure password.
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
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password Updated!</h2>
              <p className="text-sm text-gray-400">Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border"
                     style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.2)", color: "#f87171" }}
                >
                  <span className="text-sm font-medium leading-relaxed">
                    {error}
                    {error.includes("expired") && (
                      <> <Link to="/forgot-password" style={{ color: "#ec5b13" }} className="underline font-medium ml-1">Request a new link</Link>.</>
                    )}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {pwInput("newPw",     "New Password",      newPw,   setNewPw,   showNew, setShowNew)}
                {pwInput("confirmPw", "Confirm Password",  confirm, setConfirm, showCon, setShowCon)}
                
                {/* Strength hints */}
                {newPw.length > 0 && (
                  <ul className="text-xs space-y-1 text-gray-500 pl-1">
                    <li className={newPw.length >= 6  ? "text-emerald-500" : ""}>✓ At least 6 characters</li>
                    <li className={/[A-Z]/.test(newPw) ? "text-emerald-500" : ""}>✓ One uppercase letter</li>
                    <li className={/[0-9]/.test(newPw) ? "text-emerald-500" : ""}>✓ One number</li>
                  </ul>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !newPw || !confirm}
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
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
                  style={{ color: "#ec5b13" }}
                >
                   Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

};


export default ResetPassword;
