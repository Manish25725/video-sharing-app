import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignup } from "../contexts/SignupContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api.js";
import { GoogleLogin } from '@react-oauth/google';

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
          style={
            i + 1 === current
              ? { background: "#ec5b13", color: "#fff", boxShadow: "0 0 0 3px rgba(236,91,19,0.2)" }
              : i + 1 < current
              ? { background: "rgba(236,91,19,0.2)", color: "#ec5b13" }
              : { background: "rgba(255,255,255,0.06)", color: "#64748b" }
          }
        >
          {i + 1 < current ? "✓" : i + 1}
        </div>
        {i < total - 1 && (
          <div
            className="w-8 h-0.5 rounded-full"
            style={{ background: i + 1 < current ? "rgba(236,91,19,0.5)" : "rgba(255,255,255,0.07)" }}
          />
        )}
      </div>
    ))}
    <span className="ml-2 text-xs font-medium" style={{ color: "#64748b" }}>Step {current} of {total}</span>
  </div>
);

/* Dark glass input style */
const inputStyle = {
  base: {
    height: "48px",
    width: "100%",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(18,10,6,0.5)",
    padding: "0 16px",
    fontSize: "14px",
    color: "#e2e8f0",
    outline: "none",
    transition: "all 0.2s",
  }
};

const DarkInput = ({ hasError, ...props }) => (
  <input
    {...props}
    style={{
      ...inputStyle.base,
      borderColor: hasError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)",
    }}
    onFocus={e => {
      e.target.style.borderColor = hasError ? "rgba(239,68,68,0.7)" : "rgba(236,91,19,0.55)";
      e.target.style.boxShadow = hasError ? "0 0 0 3px rgba(239,68,68,0.1)" : "0 0 0 3px rgba(236,91,19,0.1)";
      e.target.style.background = "rgba(30,15,5,0.8)";
    }}
    onBlur={e => {
      e.target.style.borderColor = hasError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)";
      e.target.style.boxShadow = "none";
      e.target.style.background = "rgba(18,10,6,0.5)";
    }}
  />
);

const Signup = () => {
  const { signupData, updateSignup } = useSignup();
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: signupData.fullName || "",
    email: signupData.email || "",
    userName: signupData.userName || "",
    password: signupData.password || "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    setApiError("");
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    if (!result.success) {
      setApiError(result.error || "Google authentication failed.");
    } else {
      navigate("/");
    }
    setLoading(false);
  };
  
  const handleGoogleError = () => {
    setApiError("Google authentication failed.");
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Enter a valid email";
    if (!form.userName.trim()) errs.userName = "Username is required";
    if (form.userName.includes(" ")) errs.userName = "No spaces allowed";
    if (form.password.length < 8) errs.password = "Minimum 8 characters";
    if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    updateSignup(form);
    setLoading(true);
    try {
      const res = await api.post("/users/send-signup-otp", { email: form.email });
      navigate("/verify-signup-email", { state: { otp: res?.otp || null } });
    } catch (err) {
      setApiError(err?.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", fontFamily: "'Public Sans', sans-serif" }}
    >
      {/* Page header */}
      <header
        className="flex items-center justify-between px-6 py-4 lg:px-16 sticky top-0 z-50 border-b"
        style={{ background: "rgba(28,18,13,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#ec5b13 0%,#8b5cf6 100%)", boxShadow: "0 4px 16px rgba(236,91,19,0.3)" }}
          >
            <svg className="w-5 h-5" fill="white" viewBox="0 0 48 48"><path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"/></svg>
          </div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ background: "linear-gradient(90deg,#fff 40%,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            PlayVibe
          </h1>
        </div>
        <a href="#" className="text-sm font-semibold transition-colors" style={{ color: "#ec5b13" }}
          onMouseEnter={e => (e.target.style.color = "#fb923c")}
          onMouseLeave={e => (e.target.style.color = "#ec5b13")}>
          Support
        </a>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[480px] space-y-8">

          {/* Hero banner */}
          <div
            className="relative h-36 w-full overflow-hidden rounded-2xl border"
            style={{ background: "rgba(28,18,13,0.7)", borderColor: "rgba(255,255,255,0.05)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{ background: "linear-gradient(135deg,#ec5b13,#0a0a0a)" }}
            />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
              <h1 className="text-3xl font-black text-white tracking-tight">Join the Vibe</h1>
              <p className="text-slate-400 mt-2 text-sm">Unlock all features and connect with the world</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            </div>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl border p-8 space-y-6"
            style={{ background: "rgba(28,18,13,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}
          >
            <StepIndicator current={1} total={4} />

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
              <p className="text-slate-500 mt-1 text-sm">Fill in your details to get started.</p>
            </div>

            {apiError && (
              <div
                className="p-3.5 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
              >
                {apiError}
              </div>
            )}

            <form onSubmit={handleNext} className="space-y-4">
              {/* Full Name */}
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Full Name</label>
                <DarkInput
                  type="text" placeholder="John Doe"
                  value={form.fullName} onChange={set("fullName")}
                  hasError={!!errors.fullName}
                />
                {errors.fullName && <p className="text-xs ml-1" style={{ color: "#f87171" }}>{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Email</label>
                <DarkInput
                  type="email" placeholder="name@example.com"
                  value={form.email} onChange={set("email")}
                  hasError={!!errors.email}
                />
                {errors.email && <p className="text-xs ml-1" style={{ color: "#f87171" }}>{errors.email}</p>}
              </div>

              {/* Username */}
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Username</label>
                <DarkInput
                  type="text" placeholder="johndoe"
                  value={form.userName} onChange={set("userName")}
                  hasError={!!errors.userName}
                />
                {errors.userName && <p className="text-xs ml-1" style={{ color: "#f87171" }}>{errors.userName}</p>}
              </div>

              {/* Password + Confirm Password — 2-col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                  <div className="relative">
                    <DarkInput
                      type={showPw ? "text" : "password"} placeholder="••••••••"
                      value={form.password} onChange={set("password")}
                      hasError={!!errors.password}
                      style={{ ...inputStyle.base, paddingRight: "42px", borderColor: errors.password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)" }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "#64748b" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ec5b13")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs ml-1" style={{ color: "#f87171" }}>{errors.password}</p>}
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Confirm Password</label>
                  <div className="relative">
                    <DarkInput
                      type={showCpw ? "text" : "password"} placeholder="••••••••"
                      value={form.confirmPassword} onChange={set("confirmPassword")}
                      hasError={!!errors.confirmPassword}
                      style={{ ...inputStyle.base, paddingRight: "42px", borderColor: errors.confirmPassword ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)" }}
                    />
                    <button type="button" onClick={() => setShowCpw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "#64748b" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ec5b13")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                      {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs ml-1" style={{ color: "#f87171" }}>{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#ec5b13", boxShadow: "0 4px 16px rgba(236,91,19,0.3)" }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    Sending OTP…
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="px-3 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(28,18,13,0.9)", color: "#475569" }}
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
                 width="320px"
                 theme="filled_black"
                 text="signup_with"
              />
            </div>

            <p className="text-center text-sm" style={{ color: "#64748b" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-bold transition-colors" style={{ color: "#ec5b13" }}
                onMouseEnter={e => (e.target.style.textDecoration = "underline")}
                onMouseLeave={e => (e.target.style.textDecoration = "none")}>
                Log in
              </Link>
            </p>

            <p className="text-center text-sm mt-4" style={{ color: "#64748b" }}>
              Are you an admin?{" "}
              <Link to="/admin-login" className="font-bold transition-colors" style={{ color: "#ec5b13" }}
                onMouseEnter={e => (e.target.style.textDecoration = "underline")}
                onMouseLeave={e => (e.target.style.textDecoration = "none")}>
                Admin Login
              </Link>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-xs leading-relaxed px-4" style={{ color: "#475569" }}>
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 transition-colors hover:text-orange-400">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 transition-colors hover:text-orange-400">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
