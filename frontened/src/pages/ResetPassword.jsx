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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="••••••••"
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-bold text-xl text-gray-900">PlayVibe</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Set a new password</h2>
                <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                  {error}
                  {error.includes("expired") && (
                    <> <Link to="/forgot-password" className="underline font-medium ml-1">Request a new link</Link>.</>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {pwInput("newPw",     "New password",      newPw,   setNewPw,   showNew, setShowNew)}
                {pwInput("confirmPw", "Confirm password",  confirm, setConfirm, showCon, setShowCon)}

                {/* Strength hints */}
                {newPw.length > 0 && (
                  <ul className="text-xs space-y-1 text-gray-400 pl-1">
                    <li className={newPw.length >= 6  ? "text-emerald-500" : ""}>✓ At least 6 characters</li>
                    <li className={/[A-Z]/.test(newPw) ? "text-emerald-500" : ""}>✓ One uppercase letter</li>
                    <li className={/[0-9]/.test(newPw) ? "text-emerald-500" : ""}>✓ One number</li>
                  </ul>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating…
                    </span>
                  ) : "Update password"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
