import { useState, useRef } from "react";
import {
  X, Radio, Calendar, ImagePlus, Play, Copy, CheckCircle, Eye, EyeOff,
  AlertTriangle, Square, BookOpen, ChevronDown, ChevronUp, Wifi, Clock,
} from "lucide-react";
import streamService from "../services/streamService.js";

/* ── tiny helper: copy-field ── */
const CopyField = ({ label, value, mono = false }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div className={`flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 truncate ${mono ? "font-mono" : ""}`}>
          {value}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

/* ── datetime min helper ── */
const getMinDatetime = () => {
  const dt = new Date(Date.now() + 5 * 60_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

/* ══════════════════════════════════════════════════
   GO LIVE PANEL (step 1: form, step 2: OBS config)
══════════════════════════════════════════════════ */
const GoLivePanel = () => {
  const [step, setStep] = useState("form"); // "form" | "obskey"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const thumbnailRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [streamData, setStreamData] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const [showObsGuide, setShowObsGuide] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endMsg, setEndMsg] = useState("");

  const handleThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const clearThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(null);
    setThumbnailPreview("");
    if (thumbnailRef.current) thumbnailRef.current.value = "";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Stream title is required"); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      if (category) fd.append("category", category);
      if (thumbnail) fd.append("thumbnail", thumbnail);
      const { data } = await streamService.goLive(fd);
      setStreamData(data);
      setStep("obskey");
    } catch (err) {
      setError(err?.message || "Failed to create stream");
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!window.confirm("End this stream?")) return;
    setEnding(true);
    try {
      await streamService.endStream(streamData.streamKey);
      setEndMsg("Stream ended.");
      setStreamData(null);
      setStep("form");
      setTitle(""); setDescription(""); setCategory("");
      clearThumbnail();
    } catch (err) {
      setError(err?.message || "Failed to end stream");
    } finally {
      setEnding(false);
    }
  };

  const obsSteps = [
    "Open OBS Studio → Settings → Stream",
    'Set "Service" to Custom',
    "Copy the RTMP Server URL below and paste it into OBS",
    "Copy the Stream Key below and paste it into OBS",
    'Click OK, then click "Start Streaming" in OBS',
  ];

  if (step === "form") {
    return (
      <form onSubmit={handleCreate} className="space-y-4">
        {endMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">{endMsg}</div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream Title *</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Coding live — building a chat app"
            maxLength={120}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers what you'll be streaming about…"
            rows={2} maxLength={500}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all">
            <option value="">Select a category (optional)</option>
            <option value="Music">Music</option>
            <option value="Gaming">Gaming</option>
            <option value="Movies">Movies</option>
            <option value="News">News</option>
            <option value="Sports">Sports</option>
            <option value="Learning">Learning</option>
            <option value="Fashion">Fashion</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Thumbnail</label>
          {thumbnailPreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={clearThumbnail}
                className="absolute top-2 right-2 p-1 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-full transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => thumbnailRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-50/30 transition-all">
              <ImagePlus className="w-7 h-7" />
              <span className="text-xs font-medium">Click to upload thumbnail</span>
              <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 5 MB</span>
            </button>
          )}
          <input ref={thumbnailRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
            : <><Play className="w-4 h-4 fill-current" /> Generate Stream Key</>}
        </button>
      </form>
    );
  }

  /* OBS config step */
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
        <p className="text-sm font-semibold text-emerald-800">Stream key generated!</p>
        <p className="text-xs text-emerald-600 mt-0.5">Paste the details below into OBS, then start streaming.</p>
      </div>

      {/* RTMP Server */}
      <CopyField label="RTMP Server (paste into OBS › Settings › Stream › Server)" value={streamData?.rtmpUrl} mono />

      {/* Stream Key */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Stream Key</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 truncate">
            {showKey ? streamData?.streamKey : "••••••••••••••••••••••"}
          </div>
          <button onClick={() => setShowKey(!showKey)}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {showKey && (
            <button onClick={() => navigator.clipboard.writeText(streamData?.streamKey)}
              className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Keep your stream key private — anyone with it can broadcast to your channel.
        </p>
      </div>

      {/* OBS Guide toggle */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <button onClick={() => setShowObsGuide(!showObsGuide)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" /> OBS Setup Steps</span>
          {showObsGuide ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showObsGuide && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <ol className="mt-3 space-y-2">
              {obsSteps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
              💡 Recommended: 1080p 30fps, bitrate 3000–6000 kbps.
            </div>
          </div>
        )}
      </div>

      {/* Status + end button */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
        <div className="flex items-center gap-2.5">
          <Wifi className={`w-5 h-5 ${streamData?.stream?.isLive ? "text-emerald-500" : "text-gray-300"}`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {streamData?.stream?.isLive ? "Stream is live" : "Waiting for OBS connection…"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {streamData?.stream?.isLive
                ? `${(streamData.stream.viewerCount || 0).toLocaleString()} viewers`
                : "Start streaming in OBS to go live"}
            </p>
          </div>
        </div>
        <button onClick={handleEndStream} disabled={ending}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
          {ending
            ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            : <Square className="w-4 h-4" />}
          End Stream
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════
   SCHEDULE PANEL
══════════════════════════════ */
const SchedulePanel = ({ onClose }) => {
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "" });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const thumbnailRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const clearThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnail(null);
    setThumbnailPreview("");
    if (thumbnailRef.current) thumbnailRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) {
      setError("Title and scheduled time are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("scheduledAt", new Date(form.scheduledAt).toISOString());
      if (thumbnail) fd.append("thumbnail", thumbnail);

      const { data } = await streamService.scheduleStream(fd);
      setSuccess(data);
    } catch (err) {
      setError(err?.message || "Failed to schedule stream");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const dt = new Date(success.scheduledAt);
    const formatted = dt.toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    return (
      <div className="space-y-4 text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
          <Calendar className="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">Stream Scheduled!</p>
          <p className="text-sm text-gray-500 mt-1">"{success.title}"</p>
          <p className="text-sm font-medium text-indigo-600 mt-2 flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4" /> {formatted}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          At stream time, click the stream icon again and use "Go Live Now" to get your OBS server &amp; key.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Thumbnail */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream Thumbnail</label>
        {thumbnailPreview ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
            <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
            <button type="button" onClick={clearThumbnail}
              className="absolute top-2 right-2 p-1 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-full transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => thumbnailRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-1.5 py-5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all">
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs font-medium">Click to upload thumbnail</span>
          </button>
        )}
        <input ref={thumbnailRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream Title *</label>
        <input type="text" value={form.title} onChange={set("title")} required maxLength={120}
          placeholder="What will you stream?"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
        <textarea value={form.description} onChange={set("description")} rows={2} maxLength={500}
          placeholder="Optional details…"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Date &amp; Time *</label>
        <input type="datetime-local" value={form.scheduledAt} min={getMinDatetime()} onChange={set("scheduledAt")} required
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling…</>
          : <><Calendar className="w-4 h-4" /> Schedule Stream</>}
      </button>
    </form>
  );
};

/* ══════════════════════════════
   MAIN MODAL
══════════════════════════════ */
const StreamModal = ({ onClose }) => {
  const [tab, setTab] = useState("live"); // "live" | "schedule"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-20 px-4 pb-4">
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Stream</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          <button
            onClick={() => setTab("live")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "live"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <Radio className="w-4 h-4" /> Go Live Now
          </button>
          <button
            onClick={() => setTab("schedule")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "schedule"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <Calendar className="w-4 h-4" /> Schedule
          </button>
        </div>

        {/* Panel content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {tab === "live" ? (
            <GoLivePanel />
          ) : (
            <SchedulePanel onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamModal;
