import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User, Bell, Shield, Monitor, ChevronRight, CheckCircle,
  AlertTriangle, X, Save, Eye, History, Search, Lock,
  BookOpen, Play, Volume2, Captions, Zap, Mail, Calendar,
  CreditCard,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api.js"

/* ─── shared UI helpers ──────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div
    className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium`}
    style={{
      background: type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      border: `1px solid ${type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      color: type === "success" ? "#6ee7b7" : "#fca5a5",
    }}
  >
    {type === "success"
      ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
      : <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
  </div>
)

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none"
    style={{
      background: checked ? "#ec5b13" : "rgba(65,46,36,1)",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
    }}
  >
    <span
      className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
      style={{ transform: checked ? "translateX(24px)" : "translateX(4px)" }}
    />
  </button>
)

const SaveBtn = ({ saving, onClick }) => (
  <button
    onClick={onClick}
    disabled={saving}
    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    style={{ background: "#ec5b13", boxShadow: "0 4px 15px rgba(236,91,19,0.25)" }}
  >
    {saving
      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      : <Save className="w-4 h-4" />}
    {saving ? "Saving…" : "Save changes"}
  </button>
)

const SectionCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl overflow-hidden ${className}`}
    style={{
      background: "rgba(236,91,19,0.05)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(236,91,19,0.1)",
    }}
  >
    {children}
  </div>
)

const Settings = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("account")
  const [toast, setToast] = useState(null)

  /* ── notification state ── */
  const [notifSaving, setNotifSaving] = useState(null)
  const [notif, setNotif] = useState({
    subscriptions: false, recommendations: false,
    comments: false, mentions: false, email: false,
  })

  /* ── privacy state ── */
  const [privacy, setPrivacy] = useState({
    watchHistoryEnabled: true, searchHistoryEnabled: true,
    subscriptionListPublic: false, savedPlaylistsPublic: true,
  })
  const [privacySaving, setPrivacySaving] = useState(false)

  /* ── playback state ── */
  const [playback, setPlayback] = useState({
    autoplay: true, quality: "1080p", volume: 75, subtitles: false,
  })
  const [playbackSaving, setPlaybackSaving] = useState(false)

  /* ── sync from user on load ── */
  useEffect(() => {
    if (!user) return
    setNotif({
      subscriptions: user.notifyOnVideo ?? false,
      recommendations: user.notifyOnPost ?? false,
      comments: user.notifyOnComment ?? false,
      mentions: user.notifyOnMention ?? false,
      email: user.notifyOnEmail ?? false,
    })
    if (user.privacy) {
      setPrivacy({
        watchHistoryEnabled:    user.privacy.watchHistoryEnabled    ?? true,
        searchHistoryEnabled:   user.privacy.searchHistoryEnabled   ?? true,
        subscriptionListPublic: user.privacy.subscriptionListPublic ?? false,
        savedPlaylistsPublic:   user.privacy.savedPlaylistsPublic   ?? true,
      })
    }
    if (user.playback) {
      setPlayback({
        autoplay:  user.playback.autoplay  ?? true,
        quality:   user.playback.quality   ?? "1080p",
        volume:    user.playback.volume    ?? 75,
        subtitles: user.playback.subtitles ?? false,
      })
    }
  }, [user])

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleNotifToggle = async (key) => {
    const endpointMap = {
      subscriptions: '/users/toggle-notify-video',
      recommendations: '/users/toggle-notify-post',
      comments: '/users/toggle-notify-comment',
      mentions: '/users/toggle-notify-mention',
      email: '/users/toggle-notify-email',
    }
    const endpoint = endpointMap[key]
    if (!endpoint) return
    setNotifSaving(key)
    try {
      const res = await api.post(endpoint)
      if (res?.data) updateUser(res.data)
      setNotif(prev => ({ ...prev, [key]: !prev[key] }))
    } catch {
      showToast("Failed to update notification setting.", "error")
    } finally {
      setNotifSaving(null)
    }
  }

  const handleSavePrivacy = async () => {
    setPrivacySaving(true)
    try {
      const res = await api.patch("/users/preferences", { privacy })
      if (res?.data) updateUser(res.data)
      showToast("Privacy settings saved.")
    } catch {
      showToast("Failed to save privacy settings.", "error")
    } finally {
      setPrivacySaving(false)
    }
  }

  const handleSavePlayback = async () => {
    setPlaybackSaving(true)
    try {
      const res = await api.patch("/users/preferences", { playback })
      if (res?.data) updateUser(res.data)
      showToast("Playback settings saved.")
    } catch {
      showToast("Failed to save playback settings.", "error")
    } finally {
      setPlaybackSaving(false)
    }
  }

  /* ══════════════ ACCOUNT ══════════════ */
  const renderAccountSettings = () => (
    <div className="space-y-6">
      {/* Profile card */}
      <SectionCard className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div
              className="w-32 h-32 rounded-full overflow-hidden border-4"
              style={{ borderColor: "rgba(236,91,19,0.2)" }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                : <div
                    className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                    style={{ background: "#ec5b13" }}
                  >
                    {(user?.fullName || user?.userName || "U").charAt(0).toUpperCase()}
                  </div>}
            </div>
            <button
              onClick={() => navigate("/profile-settings")}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center text-white border-4 shadow-xl hover:scale-105 transition-transform"
              style={{ background: "#ec5b13", borderColor: "#221610" }}
            >
              <User className="w-4 h-4" />
            </button>
          </div>
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-100">{user?.fullName || "—"}</h3>
            <p className="text-slate-400 mb-1">@{user?.userName || "—"}</p>
            <p className="text-slate-500 text-sm mb-5">{user?.email || "—"}</p>
            <button
              onClick={() => navigate("/profile-settings")}
              className="px-6 py-2.5 text-white rounded-xl font-bold text-sm transition-all"
              style={{ background: "#ec5b13", boxShadow: "0 4px 15px rgba(236,91,19,0.2)" }}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >
              Edit Profile &amp; Account Settings
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Quick links */}
      <div className="space-y-2">
        <h4 className="text-base font-bold text-slate-100 px-1">Quick Links</h4>
        <div className="flex flex-col gap-3">
          {[
            { label: "Edit profile & avatar",    desc: "Update your public identity",              path: "/profile-settings", icon: User },
            { label: "Change password",           desc: "Last changed 3 months ago",               path: "/profile-settings", icon: Lock },
            { label: "Watch history",             desc: "Manage your activity and cleared history", path: "/watch-history",    icon: History },
            { label: "Premium Subscription",      desc: "Manage billing and payments",              path: "#",                 icon: CreditCard },
          ].map(({ label, desc, path, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="group flex items-center justify-between p-4 rounded-2xl text-left transition-all w-full"
              style={{ background: "rgba(236,91,19,0.05)", border: "1px solid rgba(236,91,19,0.05)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,91,19,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(236,91,19,0.05)"; }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-slate-100 font-semibold text-sm">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </div>
              <ChevronRight
                className="w-5 h-5 transition-colors flex-shrink-0"
                style={{ color: "rgba(100,116,139,1)" }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  /* ══════════════ NOTIFICATIONS ══════════════ */
  const renderNotificationSettings = () => {
    const rows = [
      { key: "subscriptions",   label: "New videos",                desc: "When channels you subscribe to upload new videos",  icon: Play },
      { key: "recommendations", label: "New tweets / posts",        desc: "When subscribed channels publish new tweets",       icon: Bell },
      { key: "comments",        label: "Comments on my videos",     desc: "When someone comments on your videos",              icon: BookOpen },
      { key: "mentions",        label: "Mentions",                  desc: "When someone mentions you in a comment",            icon: Zap },
      { key: "email",           label: "Email notifications",       desc: "Receive notifications via email as well",           icon: Mail },
    ]
    return (
      <SectionCard>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(236,91,19,0.1)" }}>
          <h2 className="text-base font-bold text-slate-100">Push Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">Changes are saved automatically.</p>
        </div>
        <div>
          {rows.map(({ key, label, desc, icon: Icon }, idx) => {
            const isSaving = notifSaving === key
            return (
              <div
                key={key}
                className="flex items-center gap-4 px-6 py-4"
                style={{ borderTop: idx === 0 ? "none" : "1px solid rgba(236,91,19,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                {isSaving
                  ? <span className="w-5 h-5 border-2 border-orange-200/30 border-t-orange-400 rounded-full animate-spin flex-shrink-0" />
                  : <Toggle checked={notif[key]} onChange={() => handleNotifToggle(key)} />}
              </div>
            )
          })}
        </div>
      </SectionCard>
    )
  }

  /* ══════════════ PRIVACY ══════════════ */
  const renderPrivacySettings = () => {
    const rows = [
      { key: "watchHistoryEnabled",    label: "Watch history",          desc: "Keep track of videos you've watched for better recommendations.", icon: History },
      { key: "searchHistoryEnabled",   label: "Search history",         desc: "Save your search queries to improve results and suggestions.",    icon: Search },
      { key: "subscriptionListPublic", label: "Public subscription list", desc: "Make your subscription list visible to other users.",           icon: Eye },
      { key: "savedPlaylistsPublic",   label: "Public saved playlists", desc: "Allow others to see your saved playlists on your profile.",       icon: BookOpen },
    ]
    return (
      <SectionCard>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(236,91,19,0.1)" }}>
          <h2 className="text-base font-bold text-slate-100">Data &amp; Privacy</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control what data is recorded and what others can see.</p>
        </div>
        <div>
          {rows.map(({ key, label, desc, icon: Icon }, idx) => (
            <div
              key={key}
              className="flex items-start gap-4 px-6 py-5"
              style={{ borderTop: idx === 0 ? "none" : "1px solid rgba(236,91,19,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-slate-100">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <Toggle checked={privacy[key]} onChange={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}
        </div>
        <div
          className="px-6 pb-5 pt-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(236,91,19,0.1)" }}
        >
          <p className="text-xs text-slate-500">Preferences are saved to your account.</p>
          <SaveBtn saving={privacySaving} onClick={handleSavePrivacy} />
        </div>
      </SectionCard>
    )
  }

  /* ══════════════ PLAYBACK ══════════════ */
  const renderPlaybackSettings = () => (
    <SectionCard>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(236,91,19,0.1)" }}>
        <h2 className="text-base font-bold text-slate-100">Playback Preferences</h2>
        <p className="text-xs text-slate-500 mt-0.5">Customize how videos play across the platform.</p>
      </div>
      <div>
        {/* Autoplay */}
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}>
            <Play className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100">Autoplay next video</p>
            <p className="text-xs text-slate-500">Automatically start the next video when the current one ends</p>
          </div>
          <Toggle checked={playback.autoplay} onChange={() => setPlayback(p => ({ ...p, autoplay: !p.autoplay }))} />
        </div>
        {/* Subtitles */}
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderTop: "1px solid rgba(236,91,19,0.06)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}>
            <Captions className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100">Show subtitles by default</p>
            <p className="text-xs text-slate-500">Automatically enable captions when available</p>
          </div>
          <Toggle checked={playback.subtitles} onChange={() => setPlayback(p => ({ ...p, subtitles: !p.subtitles }))} />
        </div>
        {/* Quality */}
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderTop: "1px solid rgba(236,91,19,0.06)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}>
            <Monitor className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100">Default video quality</p>
            <p className="text-xs text-slate-500">Preferred resolution when streaming</p>
          </div>
          <select
            value={playback.quality}
            onChange={(e) => setPlayback(p => ({ ...p, quality: e.target.value }))}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-200 outline-none flex-shrink-0"
            style={{
              background: "rgba(58,40,30,1)",
              border: "1px solid rgba(65,46,36,1)",
              colorScheme: "dark",
            }}
          >
            {["144p","240p","360p","480p","720p","1080p","1440p","2160p"].map(q => (
              <option key={q} value={q}>{q === "2160p" ? "4K (2160p)" : q}</option>
            ))}
          </select>
        </div>
        {/* Volume */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(236,91,19,0.06)" }}>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100">Default volume</p>
              <p className="text-xs text-slate-500">Starting volume when opening a video</p>
            </div>
            <span className="text-sm font-bold text-slate-300 w-10 text-right flex-shrink-0">{playback.volume}%</span>
          </div>
          <div className="ml-14">
            <input
              type="range" min="0" max="100" value={playback.volume}
              onChange={(e) => setPlayback(p => ({ ...p, volume: parseInt(e.target.value) }))}
              className="w-full h-2 cursor-pointer rounded-full"
              style={{ accentColor: "#ec5b13" }}
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1 select-none">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>
      <div
        className="px-6 pb-5 pt-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(236,91,19,0.1)" }}
      >
        <p className="text-xs text-slate-500">These preferences are saved to your account.</p>
        <SaveBtn saving={playbackSaving} onClick={handleSavePlayback} />
      </div>
    </SectionCard>
  )

  const tabs = [
    { id: "account",       label: "Account",       icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy",       label: "Privacy",       icon: Shield },
    { id: "playback",      label: "Playback",      icon: Monitor },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#221610" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Page header ── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-8 h-16 border-b"
        style={{
          background: "rgba(34,22,16,0.2)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderColor: "rgba(236,91,19,0.1)",
        }}
      >
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search settings, videos, creators..."
            className="w-full rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
            style={{ background: "rgba(236,91,19,0.05)", border: "none" }}
            onFocus={e => { e.currentTarget.style.boxShadow = "0 0 0 1px #ec5b13"; }}
            onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        <div className="flex items-center gap-3">
          {[Bell, BookOpen].map((Icon, i) => (
            <button
              key={i}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-all"
              style={{
                background: "rgba(236,91,19,0.05)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(236,91,19,0.1)",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#ec5b13"; }}
              onMouseLeave={e => { e.currentTarget.style.color = ""; }}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account preferences and security settings.</p>
        </div>

        {/* Tabs */}
        <div
          className="flex mb-8 overflow-x-auto whitespace-nowrap"
          style={{ borderBottom: "1px solid rgba(236,91,19,0.1)" }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 border-b-2"
              style={{
                borderBottomColor: activeTab === tab.id ? "#ec5b13" : "transparent",
                color: activeTab === tab.id ? "#ec5b13" : "rgba(148,163,184,1)",
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "rgba(148,163,184,1)"; }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "account"       && renderAccountSettings()}
        {activeTab === "notifications" && renderNotificationSettings()}
        {activeTab === "privacy"       && renderPrivacySettings()}
        {activeTab === "playback"      && renderPlaybackSettings()}
      </div>
    </div>
  )
}

export default Settings


/* ─── shared UI helpers ──────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
    ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
    {type === "success"
      ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
  </div>
)

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30
      ${checked ? "bg-blue-600" : "bg-gray-200"} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
)

const SaveBtn = ({ saving, onClick }) => (
  <button onClick={onClick} disabled={saving}
    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
    {saving
      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      : <Save className="w-4 h-4" />}
    {saving ? "Saving…" : "Save changes"}
  </button>
)

const Settings = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("account")
  const [toast, setToast] = useState(null)

  /* ── notification state ── */
  const [notifSaving, setNotifSaving] = useState(null)
  const [notif, setNotif] = useState({
    subscriptions: false, recommendations: false,
    comments: false, mentions: false, email: false,
  })

  /* ── privacy state ── */
  const [privacy, setPrivacy] = useState({
    watchHistoryEnabled: true, searchHistoryEnabled: true,
    subscriptionListPublic: false, savedPlaylistsPublic: true,
  })
  const [privacySaving, setPrivacySaving] = useState(false)

  /* ── playback state ── */
  const [playback, setPlayback] = useState({
    autoplay: true, quality: "1080p", volume: 75, subtitles: false,
  })
  const [playbackSaving, setPlaybackSaving] = useState(false)

  /* ── sync from user on load ── */
  useEffect(() => {
    if (!user) return
    setNotif({
      subscriptions: user.notifyOnVideo ?? false,
      recommendations: user.notifyOnPost ?? false,
      comments: user.notifyOnComment ?? false,
      mentions: user.notifyOnMention ?? false,
      email: user.notifyOnEmail ?? false,
    })
    if (user.privacy) {
      setPrivacy({
        watchHistoryEnabled:    user.privacy.watchHistoryEnabled    ?? true,
        searchHistoryEnabled:   user.privacy.searchHistoryEnabled   ?? true,
        subscriptionListPublic: user.privacy.subscriptionListPublic ?? false,
        savedPlaylistsPublic:   user.privacy.savedPlaylistsPublic   ?? true,
      })
    }
    if (user.playback) {
      setPlayback({
        autoplay:  user.playback.autoplay  ?? true,
        quality:   user.playback.quality   ?? "1080p",
        volume:    user.playback.volume    ?? 75,
        subtitles: user.playback.subtitles ?? false,
      })
    }
  }, [user])

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  /* ── notification toggle – calls real API ── */
  const handleNotifToggle = async (key) => {
    const endpointMap = {
      subscriptions: '/users/toggle-notify-video',
      recommendations: '/users/toggle-notify-post',
      comments: '/users/toggle-notify-comment',
      mentions: '/users/toggle-notify-mention',
      email: '/users/toggle-notify-email',
    }
    const endpoint = endpointMap[key]
    if (!endpoint) return
    setNotifSaving(key)
    try {
      const res = await api.post(endpoint)
      if (res?.data) updateUser(res.data)
      setNotif(prev => ({ ...prev, [key]: !prev[key] }))
    } catch {
      showToast("Failed to update notification setting.", "error")
    } finally {
      setNotifSaving(null)
    }
  }

  /* ── save privacy ── */
  const handleSavePrivacy = async () => {
    setPrivacySaving(true)
    try {
      const res = await api.patch("/users/preferences", { privacy })
      if (res?.data) updateUser(res.data)
      showToast("Privacy settings saved.")
    } catch {
      showToast("Failed to save privacy settings.", "error")
    } finally {
      setPrivacySaving(false)
    }
  }

  /* ── save playback ── */
  const handleSavePlayback = async () => {
    setPlaybackSaving(true)
    try {
      const res = await api.patch("/users/preferences", { playback })
      if (res?.data) updateUser(res.data)
      showToast("Playback settings saved.")
    } catch {
      showToast("Failed to save playback settings.", "error")
    } finally {
      setPlaybackSaving(false)
    }
  }

  /* ══════════════ ACCOUNT ══════════════ */
  const renderAccountSettings = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Account Overview</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <User className="w-7 h-7 text-blue-500" />
                </div>}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.fullName || "—"}</p>
            <p className="text-sm text-gray-500">@{user?.userName || "—"}</p>
            <p className="text-sm text-gray-400 truncate">{user?.email || "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: Mail, label: "Email", value: user?.email || "—" },
            { icon: User, label: "Username", value: `@${user?.userName || "—"}` },
            { icon: Calendar, label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-700 font-medium truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 mb-3">
            Edit your profile photo, display name, bio, and password in Account Settings.
          </p>
          <button onClick={() => navigate("/profile-settings")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
            Edit Profile &amp; Account Settings
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Quick Links</p>
        </div>
        {[
          { label: "Edit profile & avatar", desc: "Update your public profile info", path: "/profile-settings", icon: User },
          { label: "Change password", desc: "Update your account password", path: "/profile-settings", icon: Lock },
          { label: "Watch history", desc: "View and manage your watch history", path: "/history", icon: History },
        ].map(({ label, desc, path, icon: Icon }) => (
          <button key={label} onClick={() => navigate(path)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors text-left">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  )

  /* ══════════════ NOTIFICATIONS ══════════════ */
  const renderNotificationSettings = () => {
    const rows = [
      { key: "subscriptions", label: "New videos", desc: "When channels you subscribe to upload new videos", icon: Play },
      { key: "recommendations", label: "New tweets / posts", desc: "When subscribed channels publish new tweets", icon: Bell },
      { key: "comments", label: "Comments on my videos", desc: "When someone comments on your videos", icon: BookOpen },
      { key: "mentions", label: "Mentions", desc: "When someone mentions you in a comment", icon: Zap },
      { key: "email", label: "Email notifications", desc: "Receive notifications via email as well", icon: Mail },
    ]
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Push Notifications</h2>
          <p className="text-xs text-gray-400 mt-0.5">Changes are saved automatically.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map(({ key, label, desc, icon: Icon }) => {
            const isSaving = notifSaving === key
            return (
              <div key={key} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                {isSaving
                  ? <span className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                  : <Toggle checked={notif[key]} onChange={() => handleNotifToggle(key)} />}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ══════════════ PRIVACY ══════════════ */
  const renderPrivacySettings = () => {
    const rows = [
      {
        key: "watchHistoryEnabled",
        label: "Watch history",
        desc: "Keep track of videos you've watched for better recommendations. When off, new watches are not recorded.",
        icon: History,
        color: "bg-blue-50",
        iconColor: "text-blue-600",
      },
      {
        key: "searchHistoryEnabled",
        label: "Search history",
        desc: "Save your search queries to improve results and suggestions. When off, searches are not saved.",
        icon: Search,
        color: "bg-purple-50",
        iconColor: "text-purple-600",
      },
      {
        key: "subscriptionListPublic",
        label: "Public subscription list",
        desc: "Make your subscription list visible to other users on your profile.",
        icon: Eye,
        color: "bg-indigo-50",
        iconColor: "text-indigo-600",
      },
      {
        key: "savedPlaylistsPublic",
        label: "Public saved playlists",
        desc: "Allow others to see your saved playlists on your profile page.",
        icon: BookOpen,
        color: "bg-emerald-50",
        iconColor: "text-emerald-600",
      },
    ]
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Data &amp; Privacy</h2>
          <p className="text-xs text-gray-400 mt-0.5">Control what data is recorded and what others can see on your profile.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map(({ key, label, desc, icon: Icon, color, iconColor }) => (
            <div key={key} className="flex items-start gap-4 px-6 py-5">
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <Toggle
                checked={privacy[key]}
                onChange={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))}
              />
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">These preferences are saved to your account and apply everywhere.</p>
          <SaveBtn saving={privacySaving} onClick={handleSavePrivacy} />
        </div>
      </div>
    )
  }

  /* ══════════════ PLAYBACK ══════════════ */
  const renderPlaybackSettings = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Playback Preferences</h2>
        <p className="text-xs text-gray-400 mt-0.5">Customize how videos play across the platform.</p>
      </div>
      <div className="divide-y divide-gray-50">
        {/* Autoplay */}
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Autoplay next video</p>
            <p className="text-xs text-gray-400">Automatically start the next video when the current one ends</p>
          </div>
          <Toggle checked={playback.autoplay} onChange={() => setPlayback(p => ({ ...p, autoplay: !p.autoplay }))} />
        </div>
        {/* Subtitles */}
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Captions className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Show subtitles by default</p>
            <p className="text-xs text-gray-400">Automatically enable captions when available</p>
          </div>
          <Toggle checked={playback.subtitles} onChange={() => setPlayback(p => ({ ...p, subtitles: !p.subtitles }))} />
        </div>
        {/* Quality */}
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Monitor className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Default video quality</p>
            <p className="text-xs text-gray-400">Preferred resolution when streaming</p>
          </div>
          <select value={playback.quality}
            onChange={(e) => setPlayback(p => ({ ...p, quality: e.target.value }))}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer flex-shrink-0">
            {["144p","240p","360p","480p","720p","1080p","1440p","2160p"].map(q => (
              <option key={q} value={q}>{q === "2160p" ? "4K (2160p)" : q}</option>
            ))}
          </select>
        </div>
        {/* Volume */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Default volume</p>
              <p className="text-xs text-gray-400">Starting volume when opening a video</p>
            </div>
            <span className="text-sm font-semibold text-gray-700 w-10 text-right flex-shrink-0">{playback.volume}%</span>
          </div>
          <div className="ml-[52px]">
            <input type="range" min="0" max="100" value={playback.volume}
              onChange={(e) => setPlayback(p => ({ ...p, volume: parseInt(e.target.value) }))}
              className="w-full h-2 accent-blue-600 cursor-pointer" />
            <div className="flex justify-between text-xs text-gray-300 mt-1 select-none">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">These preferences are saved to your account.</p>
        <SaveBtn saving={playbackSaving} onClick={handleSavePlayback} />
      </div>
    </div>
  )

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "playback", label: "Playback", icon: Monitor },
  ]

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "account"       && renderAccountSettings()}
      {activeTab === "notifications" && renderNotificationSettings()}
      {activeTab === "privacy"       && renderPrivacySettings()}
      {activeTab === "playback"      && renderPlaybackSettings()}
    </div>
  )
}

export default Settings
