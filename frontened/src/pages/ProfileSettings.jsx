import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  User, Camera, ImagePlus, Lock, Eye, EyeOff, Save, ArrowLeft,
  CheckCircle, AlertTriangle, X, Upload, Shield, Smartphone,
  Trash2, Mail, Calendar, ChevronRight, MonitorSmartphone,
  Clock, LogOut, ShieldCheck, ShieldOff
} from "lucide-react";
import api from "../services/api.js";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "account", label: "Account", icon: ShieldCheck },
];

/* â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all
    ${type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"}`}>
    {type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-2 text-current opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
  </div>
);

/* â”€â”€â”€ Section Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Card = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    {(title || subtitle) && (
      <div className="px-6 py-5 border-b border-gray-50">
        {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    )}
    <div className="px-6 py-6">{children}</div>
  </div>
);

/* â”€â”€â”€ Input Field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
  </div>
);

const Input = ({ icon: Icon, readOnly, className = "", ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
    <input
      {...props}
      readOnly={readOnly}
      className={`w-full ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm
        ${readOnly ? "bg-gray-50 text-gray-500 cursor-default" : "bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"}
        transition-all ${className}`}
    />
  </div>
);

/* â”€â”€â”€ Profile Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProfileTab = ({ user, updateUser }) => {
  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [userName, setUserName] = useState(user?.userName || "");
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
    if (!fullName.trim()) { showToast("Full name cannot be empty.", "error"); return; }
    setSaving(true);
    try {
      const tasks = [];

      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        tasks.push(api.patch("/users/avatar", fd));
      }
      if (coverFile) {
        const fd = new FormData();
        fd.append("coverImage", coverFile);
        tasks.push(api.patch("/users/cover-Image", fd));
      }
      if (
        fullName !== (user?.fullName || "") ||
        userName !== (user?.userName || "") ||
        bio !== (user?.bio || "")
      ) {
        tasks.push(api.patch("/users/update-account", { fullName, email: user?.email, bio }));
      }

      if (tasks.length === 0) { showToast("Nothing to update."); setSaving(false); return; }

      await Promise.all(tasks);
      updateUser({ ...user, fullName, userName, bio });
      showToast("Profile updated successfully!");
      setAvatarFile(null);
      setCoverFile(null);
    } catch (err) {
      showToast(err?.message || "Failed to update profile.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <Card title="Cover Image" subtitle="Displayed at the top of your channel page.">
        <div
          onClick={() => coverRef.current?.click()}
          className="relative cursor-pointer h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
        >
          {coverPreview
            ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center justify-center h-full gap-2">
                <ImagePlus className="w-8 h-8 text-gray-300" />
                <span className="text-xs text-gray-400">Click to upload cover image</span>
              </div>}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Upload className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">Change cover</span>
            </div>
          </div>
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleCover(e.target.files[0])} />
      </Card>

      <Card title="Profile Photo" subtitle="Your avatar shown across the platform.">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div
              onClick={() => avatarRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden cursor-pointer border-4 border-white shadow-lg group relative"
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-400" />
                  </div>}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Change photo
            </button>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or GIF. Max 5MB.</p>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatar(e.target.files[0])} />
        </div>
      </Card>

      <Card title="Public Information" subtitle="This information is visible on your channel.">
        <div className="space-y-4">
          <Field label="Full name">
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Username" hint="Your unique @handle â€” cannot be changed here.">
            <Input
              type="text"
              value={userName}
              readOnly
              icon={({ className }) => <span className={`text-gray-400 text-sm font-medium ${className}`}>@</span>}
            />
          </Field>
          <Field label="Bio" hint={`${bio.length}/300 characters`}>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell viewers about your channelâ€¦"
              maxLength={300}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Savingâ€¦" : "Save changes"}
        </button>
      </div>
    </div>
  );
};

/* â”€â”€â”€ Security Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SecurityTab = () => {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingOthers, setRevokingOthers] = useState(false);

  useEffect(() => {
    api.get("/users/sessions")
      .then(res => setSessions(res.data || []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k) => () => setShow((s) => ({ ...s, [k]: !s[k] }));

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      await api.delete("/users/sessions/revoke-others");
      setSessions(prev => prev.filter(s => s.current));
      showToast("Other sessions have been logged out.");
    } catch (err) {
      showToast(err?.message || "Failed to revoke sessions.", "error");
    }
    setRevokingOthers(false);
  };

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
      showToast(err?.message || "Failed to change password.", "error");
    }
    setSaving(false);
  };

  const pwField = (id, label, key, showKey) => (
    <Field label={label}>
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
    </Field>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <Card title="Change Password" subtitle="Use a strong, unique password for your account.">
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {pwField("oldPw", "Current password", "oldPassword", "old")}
          {pwField("newPw", "New password", "newPassword", "new")}
          {pwField("confirmPw", "Confirm new password", "confirm", "confirm")}
          <div className="pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
              {saving ? "Updatingâ€¦" : "Update password"}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account.">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 max-w-md">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${twoFaEnabled ? "bg-emerald-100" : "bg-gray-200"}`}>
              {twoFaEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldOff className="w-5 h-5 text-gray-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Authenticator app</p>
              <p className="text-xs text-gray-400 mt-0.5">{twoFaEnabled ? "2FA is enabled" : "Protect your account with 2FA"}</p>
            </div>
          </div>
          <button
            onClick={() => setTwoFaEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${twoFaEnabled ? "bg-indigo-600" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${twoFaEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Full 2FA setup (QR code, recovery codes) coming soon.</p>
      </Card>

      <Card title="Active Sessions" subtitle="Devices currently logged in to your account.">
        <div className="space-y-3 max-w-md">
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <span className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No active sessions found.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl bg-gray-50">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MonitorSmartphone className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{s.device}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(s.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    {s.current && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Current</span>
                    )}
                  </div>
                  {s.ip && s.ip !== "Unknown" && (
                    <p className="text-xs text-gray-400 mt-0.5">{s.ip}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {!sessionsLoading && sessions.filter(s => !s.current).length > 0 && (
            <button
              onClick={handleRevokeOthers}
              disabled={revokingOthers}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium mt-2 transition-colors disabled:opacity-60"
            >
              {revokingOthers
                ? <span className="w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                : <LogOut className="w-4 h-4" />}
              {revokingOthers ? "Logging out…" : "Logout other sessions"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

/* â”€â”€â”€ Account Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const AccountTab = ({ user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "â€”";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.userName) {
      showToast("Username does not match.", "error");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/users/delete-account");
      await logout();
      navigate("/");
    } catch (err) {
      showToast(err?.message || "Failed to delete account.", "error");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <Card title="Account Information" subtitle="Your account details.">
        <div className="space-y-4 max-w-md">
          <Field label="Email address">
            <Input type="email" value={user?.email || ""} readOnly icon={Mail} />
          </Field>
          <Field label="Member since">
            <div className="flex items-center gap-3 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">{formatDate(user?.createdAt)}</span>
            </div>
          </Field>
          <Field label="Username">
            <div className="flex items-center gap-3 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
              <span className="text-gray-400 text-sm font-medium">@</span>
              <span className="text-sm text-gray-500">{user?.userName || "â€”"}</span>
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Danger Zone" subtitle="Irreversible and destructive actions.">
        <div className="border border-red-200 rounded-xl p-5 bg-red-50 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Delete account</p>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Delete my account
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Delete account?</h3>
                  <p className="text-xs text-gray-500">This action is permanent and irreversible.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Type your username <span className="font-semibold text-gray-900">@{user?.userName}</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={user?.userName}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm !== user?.userName}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? "Deletingâ€¦" : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-14">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900 text-base">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar nav */}
          <aside className="sm:w-52 flex-shrink-0">
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all text-left border-b border-gray-50 last:border-0
                    ${activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700 border-l-2 border-l-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-l-transparent"
                    }`}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </nav>

            {/* User summary card */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-2 border-2 border-white shadow-md">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-400" />
                    </div>}
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || "User"}</p>
              <p className="text-xs text-gray-400 truncate">@{user?.userName || ""}</p>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "profile" && <ProfileTab user={user} updateUser={updateUser} />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "account" && <AccountTab user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;