import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, AtSign, Shield, Play, Zap, Globe, Image } from "lucide-react";
import Toast from "./Toast.jsx";

const InputField = ({ icon: Icon, label, id, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
      <input
        id={id}
        {...props}
        className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all`}
      />
    </div>
  </div>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "", userName: "" });
  const [files, setFiles] = useState({ avatar: null, coverImage: null });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });
  const showToast = (message, type = "success") => setToast({ show: true, message, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          showToast("Welcome back!", "success");
        } else {
          const msg = result.error || "Invalid credentials. Please try again.";
          setError(msg);
          showToast(msg, "error");
        }
      } else {
        if (!files.avatar) { setError("Avatar image is required"); setLoading(false); return; }
        if (!files.coverImage) { setError("Cover image is required"); setLoading(false); return; }
        if (!formData.fullName.trim()) { setError("Full name is required"); setLoading(false); return; }
        if (!formData.userName.trim()) { setError("Username is required"); setLoading(false); return; }
        const result = await register(formData, files.avatar, files.coverImage);
        if (result.success) {
          setIsLogin(true);
          showToast("Account created! Please sign in.", "success");
          setFormData({ email: "", password: "", fullName: "", userName: "" });
          setFiles({ avatar: null, coverImage: null });
          setError("");
        } else {
          setError(result.error || "Registration failed");
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "", fullName: "", userName: "" });
    setFiles({ avatar: null, coverImage: null });
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">PlayVibe</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Share your world<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">one video at a time</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">Upload, discover, and share stunning videos with a community of creators.</p>
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

        {/* Admin link */}
        <div className="relative z-10">
          <button onClick={() => navigate("/admin-login")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-300 transition-colors text-sm group">
            <Shield className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
            Administrator access
          </button>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="text-gray-900 font-bold text-xl">PlayVibe</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{isLogin ? "Welcome back" : "Create account"}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isLogin ? "Sign in to continue to PlayVibe" : "Join PlayVibe and start sharing"}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <InputField icon={User} id="fullName" name="fullName" label="Full Name" type="text" required placeholder="John Doe" value={formData.fullName} onChange={handleInputChange} autoComplete="name" />
                <InputField icon={AtSign} id="userName" name="userName" label="Username" type="text" required placeholder="johndoe" value={formData.userName} onChange={handleInputChange} autoComplete="username" />

                {/* Avatar upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Avatar Image <span className="text-red-500">*</span>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.avatar ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}>
                    <Image className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500 truncate">{files.avatar ? files.avatar.name : "Click to upload avatar photo"}</span>
                    <input name="avatar" type="file" accept="image/*" required onChange={handleFileChange} className="sr-only" />
                  </label>
                </div>

                {/* Cover upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cover Image <span className="text-red-500">*</span>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${files.coverImage ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}>
                    <Image className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500 truncate">{files.coverImage ? files.coverImage.name : "Click to upload channel cover"}</span>
                    <input name="coverImage" type="file" accept="image/*" required onChange={handleFileChange} className="sr-only" />
                  </label>
                </div>
              </>
            )}

            <InputField icon={Mail} id="email" name="email" label="Email address" type="email" autoComplete={isLogin ? "email" : "new-email"} required placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={toggleMode} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Mobile admin link */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center lg:hidden">
            <button onClick={() => navigate("/admin-login")}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <Shield className="w-4 h-4" />
              Administrator login
            </button>
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />
      )}
    </div>
  );
};

export default AuthPage;
