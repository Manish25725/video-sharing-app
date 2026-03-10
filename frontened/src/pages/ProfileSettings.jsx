import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  User, Camera, ImagePlus, Lock, Eye, EyeOff, Save, ArrowLeft,
  CheckCircle, AlertTriangle, X, Upload
} from "lucide-react";
import api from "../services/api.js";

const TABS = ["Profile", "Security"];

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all
    ${type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"}`}>
    {type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-2 text-current opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
  </div>
);

/* ─── Profile Tab ─────────────────────────────────────────── */
const ProfileTab = ({ user, updateUser }) => {
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvatar = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCover = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tasks = [];

      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        tasks.push(api.patch("/users/update-avatar", fd));
      }
      if (coverFile) {
        const fd = new FormData();
        fd.append("coverImage", coverFile);
        tasks.push(api.patch("/users/update-coverimage", fd));
      }
      if (fullName !== (user?.fullName || "") || bio !== (user?.bio || "")) {
        tasks.push(api.patch("/users/update-account", { fullName, bio }));
      }

      if (tasks.length === 0) { showToast("Nothing to update."); setSaving(false); return; }

      await Promise.all(tasks);
      if (updateUser) updateUser({ fullName, bio });
      showToast("Profile updated successfully!");
      setAvatarFile(null);
      setCoverFile(null);
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update profile.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
        <div
          onClick={() => coverRef.current?.click()}
          className="relative cursor-pointer h-36 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
          {coverPreview
            ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center justify-center h-full gap-2">
                <ImagePlus className="w-8 h-8 text-gray-300" />
                <span className="text-xs text-gray-400">Upload cover image</span>
              </div>}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Upload className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">Change cover</span>
            </div>
          </div>
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCover(e.target.files[0])} />
      </div>

      {/* Avatar + name */}
      <div className="flex items-end gap-5">
        <div className="relative">
          <div
            onClick={() => avatarRef.current?.click()}
            className="w-20 h-20 rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-md group">
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-400" />
                </div>}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatar(e.target.files[0])} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        <textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell viewers about your channel..."
          maxLength={300}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">{bio.length}/300</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
};

/* ─── Security Tab ────────────────────────────────────────── */
const SecurityTab = () => {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k) => () => setShow((s) => ({ ...s, [k]: !s[k] }));

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { showToast("New passwords do not match.", "error"); return; }
    if (form.newPassword.length < 8) { showToast("Password must be at least 8 characters.", "error"); return; }
    setSaving(true);
    try {
      await api.post("/users/change-password", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      showToast("Password changed successfully!");
      setForm({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to change password.", "error");
    }
    setSaving(false);
  };

  const pwField = (id, label, key, showKey) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          id={id}
          type={show[showKey] ? "text" : "password"}
          value={form[key]}
          onChange={set(key)}
          required
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
        <button type="button" onClick={toggle(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-md">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Change password</h3>
        <p className="text-sm text-gray-500 mb-5">Use a strong, unique password to secure your account.</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {pwField("oldPw", "Current password", "oldPassword", "old")}
          {pwField("newPw", "New password", "newPassword", "new")}
          {pwField("confirmPw", "Confirm new password", "confirm", "confirm")}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>

      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Two-factor authentication</h3>
        <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account.</p>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-700">Authenticator app</p>
            <p className="text-xs text-gray-400 mt-0.5">Use an app like Google Authenticator</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-gray-200 text-gray-500 rounded-full font-medium">Coming soon</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────── */
const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Profile Settings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          {activeTab === "Profile"
            ? <ProfileTab user={user} updateUser={updateUser} />
            : <SecurityTab />}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
