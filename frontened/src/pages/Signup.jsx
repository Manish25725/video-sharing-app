import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSignup } from "../contexts/SignupContext.jsx";
import { User, Mail, Lock, AtSign, Eye, EyeOff, Play } from "lucide-react";
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

const Signup = () => {
  const { signupData, updateSignup } = useSignup();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: signupData.fullName || "",
    email: signupData.email || "",
    userName: signupData.userName || "",
    password: signupData.password || "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Enter a valid email";
    if (!form.userName.trim()) errs.userName = "Username is required";
    if (form.userName.includes(" ")) errs.userName = "No spaces allowed";
    if (form.password.length < 8) errs.password = "Minimum 8 characters";
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

  const inputClass = (key) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all
    ${errors[key] ? "border-red-400 focus:ring-red-400/30" : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/30"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-bold text-xl text-gray-900">PlayVibe</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <StepIndicator current={1} total={4} />

          <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-6">Tell us a bit about yourself</p>

          {apiError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{apiError}</div>
          )}

          <form onSubmit={handleNext} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Jane Smith" value={form.fullName} onChange={set("fullName")} className={inputClass("fullName")} />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="janesmith" value={form.userName} onChange={set("userName")} className={inputClass("userName")} />
              </div>
              {errors.userName && <p className="mt-1 text-xs text-red-500">{errors.userName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="email" placeholder="jane@example.com" value={form.email} onChange={set("email")} className={inputClass("email")} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                  value={form.password} onChange={set("password")}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <button type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending code…
                </span>
              ) : "Continue →"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
