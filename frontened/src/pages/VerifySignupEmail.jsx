import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Mail, Play, RefreshCw } from "lucide-react";
import { useSignup } from "../contexts/SignupContext.jsx";
import api from "../services/api.js";

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-3 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
          ${i + 1 === current ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : ""}
          ${i + 1 < current ? "bg-indigo-100 text-indigo-600" : ""}
          ${i + 1 > current ? "bg-gray-100 text-gray-400" : ""}`}>
          {i + 1 < current ? "✓" : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 w-8 rounded-full ${i + 1 < current ? "bg-indigo-400" : "bg-gray-200"}`} />
        )}
      </div>
    ))}
    <span className="ml-1 text-xs font-medium text-gray-400">Step {current} of {total}</span>
  </div>
);

const VerifySignupEmail = () => {
  const { signupData }        = useSignup();
  const navigate              = useNavigate();
  const [digits, setDigits]   = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]     = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const inputRefs             = useRef([]);

  const email = signupData.email || "";

  // If somehow landed here without email, go back
  if (!email) {
    navigate("/signup");
    return null;
  }

  const otp = digits.join("");

  const handleDigitChange = (idx, val) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    if (ch && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Please enter all 6 digits."); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/users/verify-signup-otp", { email, otp });
      navigate("/upload-avatar");
    } catch (err) {
      setError(err?.message || "Invalid or expired code. Try again or request a new one.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMsg("");
    setResending(true);
    try {
      await api.post("/users/send-signup-otp", { email });
      setResendMsg("A new code has been sent to your email.");
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Too many requests. Please wait a moment before trying again.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-bold text-xl text-gray-900">PlayVibe</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <StepIndicator current={2} total={4} />

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-indigo-500" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verify your email</h2>
            <p className="text-sm text-gray-500">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-gray-700">{maskedEmail}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
          )}
          {resendMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">{resendMsg}</div>
          )}

          <form onSubmit={handleVerify}>
            {/* 6 OTP boxes */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className={`w-12 h-14 text-center text-xl font-bold border rounded-xl bg-gray-50 focus:bg-white focus:outline-none transition-all
                    ${d ? "border-indigo-400 text-indigo-700 focus:ring-2 focus:ring-indigo-500/30" : "border-gray-200 text-gray-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : "Verify & continue"}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Didn't receive a code?{" "}
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors disabled:opacity-60 inline-flex items-center gap-1"
              >
                {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                {resending ? "Sending…" : "Resend code"}
              </button>
            </p>
            <p className="text-xs text-gray-400">
              <button onClick={() => navigate("/signup")} className="hover:text-gray-600 transition-colors">
                ← Back to sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifySignupEmail;
