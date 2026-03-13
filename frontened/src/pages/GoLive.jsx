import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import socketService from "../services/socketService.js";
import streamService from "../services/streamService.js";
import {
  Radio, Copy, CheckCircle, Eye, EyeOff, Wifi, AlertTriangle,
  Play, Square, BookOpen, ChevronDown, ChevronUp, ExternalLink,
  ImagePlus, X, Video, Calendar,
} from "lucide-react";

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
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-[0.2em]" style={{ color: "#ec5b13" }}>{label}</label>
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 px-4 py-3 rounded-xl text-sm truncate ${mono ? "font-mono" : ""}`}
          style={{
            background: "rgba(18,12,8,0.8)",
            border: "1px solid rgba(236,91,19,0.14)",
            color: "#f8fafc",
          }}
        >
          {value}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
          style={{
            background: copied ? "rgba(74,222,128,0.14)" : "rgba(236,91,19,0.14)",
            border: copied ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(236,91,19,0.2)",
            color: copied ? "#86efac" : "#ec5b13",
          }}
        >
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

const StatusBadge = ({ isLive }) =>
  isLive ? (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{ background: "rgba(239,68,68,0.14)", color: "#fda4af", border: "1px solid rgba(239,68,68,0.25)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.16)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> OFFLINE
    </span>
  );

const GoLive = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("details"); // "details" | "live"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState(null);       // File object
  const [thumbnailPreview, setThumbnailPreview] = useState(""); // Object URL
  const thumbnailInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [streamData, setStreamData] = useState(null); // { stream, rtmpUrl, hlsUrl, streamKey }
  const [showKey, setShowKey] = useState(false);
  const [showObs, setShowObs] = useState(false);
  const [ending, setEnding] = useState(false);

  // Post-stream: save recording state
  const [endedStreamKey, setEndedStreamKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedVideoId, setSavedVideoId] = useState(null);

  // Schedule mode
  const [mode, setMode] = useState("live"); // "live" | "schedule"
  const [sched, setSched] = useState({ title: "", description: "", scheduledAt: "" });
  const [schedThumb, setSchedThumb] = useState(null);
  const [schedThumbPreview, setSchedThumbPreview] = useState("");
  const schedThumbRef = useRef(null);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState("");
  const [schedSuccess, setSchedSuccess] = useState(null);
  const [autoPost, setAutoPost] = useState(true);

  // Re-hydrate only if OBS is actively connected (isLive: true).
  // Never auto-restore a stale stream where the key was generated but OBS never connected.
  useEffect(() => {
    streamService.getMyStream()
      .then(({ data }) => {
        const { stream, rtmpUrl, hlsUrl, streamKey } = data || {};
        if (stream && stream.isLive === true) {
          setStreamData({ stream, rtmpUrl, hlsUrl, streamKey });
          setTitle(stream.title);
          setDescription(stream.description || "");
          setStep("live");
        }
      })
      .catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Stream title is required"); return; }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      if (category) formData.append("category", category);
      if (thumbnail) formData.append("thumbnail", thumbnail);
      const { data } = await streamService.goLive(formData);
      setStreamData(data);
      setStep("live");
    } catch (err) {
      setError(err?.message || "Failed to create stream");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e) => {
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
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

    useEffect(() => {
    const socket = socketService?.socket;
    if (!socket || !streamData?.streamKey) return;
    const onEnd = (data) => {
      if (data.streamKey === streamData.streamKey) {
          setEndedStreamKey(streamData.streamKey);
          setStreamData(null);
          setStep("ended");
      }
    };
    socket.on("stream-ended", onEnd);
    return () => socket.off("stream-ended", onEnd);
  }, [streamData?.streamKey]);

  const handleEndStream = async () => {
    if (!window.confirm("Are you sure you want to end this stream?")) return;
    setEnding(true);
    try {
      await streamService.endStream(streamData.streamKey);
      setEndedStreamKey(streamData.streamKey);
      setStreamData(null);
      setStep("ended"); // go to save-recording step
    } catch (err) {
      setError(err?.message || "Failed to end stream");
    } finally {
      setEnding(false);
    }
  };

  const handleSaveRecording = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await streamService.saveRecording(endedStreamKey);
      setSavedVideoId(data.videoId);
    } catch (err) {
      setError(
        err?.message ||
          "Recording file not found. Make sure FFmpeg is installed and the stream ran for at least a few seconds."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSchedThumb = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (schedThumbPreview) URL.revokeObjectURL(schedThumbPreview);
    setSchedThumb(file);
    setSchedThumbPreview(URL.createObjectURL(file));
  };

  const clearSchedThumb = () => {
    if (schedThumbPreview) URL.revokeObjectURL(schedThumbPreview);
    setSchedThumb(null);
    setSchedThumbPreview("");
    if (schedThumbRef.current) schedThumbRef.current.value = "";
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!sched.title.trim() || !sched.scheduledAt) {
      setSchedError("Title and scheduled time are required");
      return;
    }
    setSchedLoading(true);
    setSchedError("");
    try {
      const fd = new FormData();
      fd.append("title", sched.title.trim());
      fd.append("description", sched.description.trim());
      fd.append("scheduledAt", new Date(sched.scheduledAt).toISOString());
      if (schedThumb) fd.append("thumbnail", schedThumb);
      const { data } = await streamService.scheduleStream(fd);
      setSchedSuccess(data);
    } catch (err) {
      setSchedError(err?.message || "Failed to schedule stream");
    } finally {
      setSchedLoading(false);
    }
  };

  const getMinDatetime = () => {
    const dt = new Date(Date.now() + 5 * 60_000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  const obsSteps = [
    "Open OBS Studio → Settings → Stream",
    'Set "Service" to Custom',
    `Set "Server" to the RTMP URL below`,
    `Set "Stream Key" to your stream key`,
    'Click OK then click "Start Streaming" in OBS',
  ];

  const panelStyle = {
    background: "rgba(42,27,20,0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(236,91,19,0.1)",
  };

  const inputStyle = {
    background: "rgba(26,15,10,0.7)",
    border: "1px solid rgba(236,91,19,0.18)",
    color: "#f8fafc",
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#1a0f0a", color: "#f8fafc" }}>
      <main className="min-h-screen overflow-y-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2">{step === "live" ? "Broadcast Control" : step === "ended" ? "Stream Recap" : "Stream Setup"}</h1>
              <p style={{ color: "#94a3b8" }}>
                {step === "live"
                  ? "Manage your stream, copy OBS settings, and monitor your live status in one place."
                  : step === "ended"
                    ? "Your stream has ended. Save the recording so your audience can watch it later."
                    : "Configure your broadcast and connect with your audience in real-time."}
              </p>
            </div>
            {streamData && <StatusBadge isLive={streamData.stream?.isLive} />}
          </div>

          {step !== "live" && step !== "ended" && (
            <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: "rgba(236,91,19,0.05)" }}>
              <button
                onClick={() => setMode("live")}
                className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={mode === "live" ? { background: "#ec5b13", color: "#fff", boxShadow: "0 8px 18px rgba(236,91,19,0.24)" } : { color: "#94a3b8" }}
              >
                Go Live Now
              </button>
              <button
                onClick={() => setMode("schedule")}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={mode === "schedule" ? { background: "#ec5b13", color: "#fff", boxShadow: "0 8px 18px rgba(236,91,19,0.24)" } : { color: "#94a3b8" }}
              >
                Schedule
              </button>
            </div>
          )}

          {error && mode === "live" && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-2.5 text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#fecaca" }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === "live" && step === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <form id="go-live-form" onSubmit={handleCreate} className="p-6 rounded-2xl space-y-5" style={panelStyle}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Stream Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What are you streaming today?"
                      maxLength={120}
                      className="w-full px-4 py-3 rounded-xl outline-none text-base"
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tell your viewers what's happening..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl outline-none text-base resize-none"
                      style={inputStyle}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none text-base appearance-none" style={inputStyle}>
                        <option value="">Select category</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Music">Music</option>
                        <option value="Learning">Learning</option>
                        <option value="Sports">Sports</option>
                        <option value="Movies">Movies</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Privacy</label>
                      <div className="w-full px-4 py-3 rounded-xl text-base flex items-center justify-between" style={inputStyle}>
                        <span>Public broadcast</span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(236,91,19,0.12)", color: "#ec5b13" }}>Default</span>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="p-6 rounded-2xl border-l-4" style={{ ...panelStyle, borderLeftColor: "#ec5b13" }}>
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div>
                      <h3 className="font-bold text-lg">Stream Key</h3>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>Your secure key appears after you start setup and will be ready for OBS.</p>
                    </div>
                    <button type="button" className="text-sm font-bold" style={{ color: "#ec5b13" }}>
                      Generate
                    </button>
                  </div>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <div className="flex-1 px-4 py-3 rounded-xl border flex items-center justify-between text-sm font-mono" style={{ background: "rgba(18,12,8,0.8)", borderColor: "rgba(236,91,19,0.12)", color: "#e2e8f0" }}>
                      <span>•••• •••• •••• •••• ••••</span>
                      <EyeOff className="w-4 h-4" style={{ color: "#94a3b8" }} />
                    </div>
                    <button type="submit" form="go-live-form" disabled={loading} className="px-4 rounded-xl font-bold text-sm py-3 transition-colors disabled:opacity-60" style={{ background: "rgba(236,91,19,0.16)", color: "#ec5b13" }}>
                      {loading ? "Generating..." : "Start Setup"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl space-y-4" style={panelStyle}>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Stream Thumbnail</label>
                  {thumbnailPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden" style={{ background: "rgba(18,12,8,0.8)", border: "1px solid rgba(236,91,19,0.18)" }}>
                      <img src={thumbnailPreview} alt="thumbnail preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={clearThumbnail} className="absolute top-2 right-2 p-1 rounded-full text-white" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center w-full transition-all" style={{ background: "rgba(18,12,8,0.8)", borderColor: "rgba(236,91,19,0.2)", color: "#94a3b8" }}>
                      <ImagePlus className="w-10 h-10 mb-2" style={{ color: "rgba(236,91,19,0.5)" }} />
                      <p className="text-sm font-medium">Click to upload or drag image</p>
                      <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>Recommended: 1280x720px</p>
                    </button>
                  )}
                  <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                </div>

                <div className="p-6 rounded-2xl text-white space-y-6" style={{ background: "linear-gradient(135deg, #ec5b13 0%, #c2410c 100%)", boxShadow: "0 18px 40px rgba(236,91,19,0.25)" }}>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black">Ready to go?</h3>
                    <p className="text-sm text-white/80">Once you start your stream in your software, you'll be live to your followers.</p>
                  </div>
                  <div className="space-y-3">
                    <button type="submit" form="go-live-form" disabled={loading} className="w-full py-4 bg-white text-[#ec5b13] rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                      <Radio className="w-5 h-5" />
                      {loading ? "STARTING..." : "START BROADCAST"}
                    </button>
                    <button type="button" className="w-full py-3 rounded-xl font-bold text-sm transition-colors" style={{ background: "rgba(0,0,0,0.18)" }}>
                      Run a Speed Test
                    </button>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 opacity-80"><CheckCircle className="w-4 h-4" /> Auto-record</span>
                      <span className="flex items-center gap-1 opacity-80"><CheckCircle className="w-4 h-4" /> Low Latency</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl" style={panelStyle}>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#94a3b8" }}>Stream Checklist</h4>
                  <div className="space-y-3">
                    {[
                      { done: Boolean(title.trim()), label: "Title & Description" },
                      { done: Boolean(category), label: "Category Tagging" },
                      { done: Boolean(thumbnailPreview), label: "Thumbnail Uploaded" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3" style={{ opacity: item.done ? 1 : 0.55 }}>
                        <div className="size-5 rounded-full border flex items-center justify-center" style={{ borderColor: item.done ? "rgba(236,91,19,0.45)" : "rgba(100,116,139,0.4)", color: "#ec5b13" }}>
                          {item.done && <CheckCircle className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm" style={{ color: "#cbd5e1" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "live" && step === "live" && streamData && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl space-y-5" style={panelStyle}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">OBS Configuration</h2>
                      <p className="text-sm" style={{ color: "#94a3b8" }}>Copy these values into OBS, Streamlabs, or XSplit.</p>
                    </div>
                    <button onClick={() => navigate(`/live/${streamData.streamKey}`)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#ec5b13" }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Preview stream
                    </button>
                  </div>

                  <CopyField label="RTMP Server URL" value={streamData.rtmpUrl} mono />

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-[0.2em]" style={{ color: "#ec5b13" }}>Stream Key</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 rounded-xl text-sm font-mono truncate" style={{ background: "rgba(18,12,8,0.8)", border: "1px solid rgba(236,91,19,0.14)", color: "#f8fafc" }}>
                        {showKey ? streamData.streamKey : "••••••••••••••••••••••"}
                      </div>
                      <button onClick={() => setShowKey(!showKey)} className="p-3 rounded-xl transition-colors" style={{ background: "rgba(236,91,19,0.14)", border: "1px solid rgba(236,91,19,0.2)", color: "#ec5b13" }}>
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {showKey && (
                        <button onClick={() => navigator.clipboard.writeText(streamData.streamKey)} className="p-3 rounded-xl transition-colors" style={{ background: "rgba(236,91,19,0.14)", border: "1px solid rgba(236,91,19,0.2)", color: "#ec5b13" }}>
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs flex items-center gap-1" style={{ color: "#fdba74" }}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Keep your stream key private. Anyone with it can broadcast on your channel.
                    </p>
                  </div>

                  <CopyField label="HLS Playback URL" value={streamData.hlsUrl} mono />
                </div>

                <div className="rounded-2xl overflow-hidden" style={panelStyle}>
                  <button onClick={() => setShowObs(!showObs)} className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors" style={{ color: "#f8fafc" }}>
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: "#ec5b13" }} /> OBS Setup Guide</span>
                    {showObs ? <ChevronUp className="w-4 h-4" style={{ color: "#94a3b8" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#94a3b8" }} />}
                  </button>
                  {showObs && (
                    <div className="px-6 pb-5" style={{ borderTop: "1px solid rgba(236,91,19,0.08)" }}>
                      <ol className="mt-4 space-y-3">
                        {obsSteps.map((obsStep, i) => (
                          <li key={i} className="flex gap-3 text-sm" style={{ color: "#cbd5e1" }}>
                            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: "rgba(236,91,19,0.14)", color: "#ec5b13" }}>
                              {i + 1}
                            </span>
                            {obsStep}
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 p-3.5 rounded-xl text-xs" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.16)", color: "#bfdbfe" }}>
                        Tip: Set OBS output to 1080p at 30fps with 3000 to 6000 kbps bitrate for a stable stream.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(236,91,19,0.18), rgba(194,65,12,0.35))", border: "1px solid rgba(236,91,19,0.18)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Live Status</h3>
                      <p className="text-sm" style={{ color: "#fed7aa" }}>
                        {streamData.stream?.isLive ? "Your broadcast is active." : "Waiting for OBS connection..."}
                      </p>
                    </div>
                    <StatusBadge isLive={streamData.stream?.isLive} />
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <Wifi className="w-5 h-5" style={{ color: streamData.stream?.isLive ? "#86efac" : "#94a3b8" }} />
                    <div>
                      <p className="text-sm font-semibold">{streamData.stream?.isLive ? "Stream is live" : "Stand by"}</p>
                      <p className="text-xs" style={{ color: "#fdba74" }}>
                        {streamData.stream?.isLive ? `${(streamData.stream.viewerCount || 0).toLocaleString()} viewers right now` : "Start streaming in OBS to go live."}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleEndStream} disabled={ending} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50" style={{ background: "rgba(0,0,0,0.24)", color: "#fff", border: "1px solid rgba(255,255,255,0.14)" }}>
                    {ending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Square className="w-4 h-4" />}
                    End Stream
                  </button>
                </div>

                <div className="p-6 rounded-2xl" style={panelStyle}>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#94a3b8" }}>Broadcast Notes</h4>
                  <div className="space-y-3 text-sm" style={{ color: "#cbd5e1" }}>
                    <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" style={{ color: "#ec5b13" }} /> Your stream key is ready and secure.</p>
                    <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" style={{ color: "#ec5b13" }} /> Preview your stream before sharing the link.</p>
                    <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" style={{ color: "#ec5b13" }} /> Ending the stream unlocks recording save options.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "live" && step === "ended" && (
            <div className="max-w-2xl mx-auto p-8 text-center space-y-6 rounded-2xl" style={panelStyle}>
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Square className="w-8 h-8" style={{ color: "#fda4af" }} />
              </div>

              <div>
                <h2 className="text-xl font-bold">Stream Ended</h2>
                <p className="text-sm mt-1.5" style={{ color: "#94a3b8" }}>
                  Save it as a video so anyone can watch it later, including live chat replay.
                </p>
              </div>

              {savedVideoId ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl flex flex-col items-center gap-2" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)" }}>
                    <CheckCircle className="w-7 h-7" style={{ color: "#86efac" }} />
                    <p className="text-sm font-semibold" style={{ color: "#dcfce7" }}>Recording saved successfully.</p>
                    <p className="text-xs" style={{ color: "#bbf7d0" }}>
                      Chat messages are saved with exact timestamps so viewers see them appear naturally during playback.
                    </p>
                  </div>
                  <button onClick={() => navigate(`/video/${savedVideoId}`)} className="w-full py-3 rounded-xl text-sm font-semibold transition-colors" style={{ background: "#ec5b13", color: "#fff" }}>
                    View Recording
                  </button>
                  <button
                    onClick={() => {
                      setStep("details");
                      setTitle("");
                      setDescription("");
                      setEndedStreamKey(null);
                      setSavedVideoId(null);
                    }}
                    className="w-full py-2 text-sm transition-colors"
                    style={{ color: "#94a3b8" }}
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={handleSaveRecording} disabled={saving} className="w-full py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60" style={{ background: "#ec5b13", color: "#fff" }}>
                    {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading recording...</> : <><Video className="w-4 h-4" /> Save Stream as Video</>}
                  </button>
                  {saving && (
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      This may take a few minutes depending on stream length. Please keep this page open.
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setStep("details");
                      setTitle("");
                      setDescription("");
                      setEndedStreamKey(null);
                    }}
                    disabled={saving}
                    className="w-full py-2 text-sm transition-colors disabled:opacity-40"
                    style={{ color: "#94a3b8" }}
                  >
                    Skip — Don't Save
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "schedule" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl space-y-4" style={panelStyle}>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Stream Thumbnail</label>
                  {schedThumbPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden" style={{ background: "rgba(18,12,8,0.8)", border: "1px solid rgba(236,91,19,0.18)" }}>
                      <img src={schedThumbPreview} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={clearSchedThumb} className="absolute top-2 right-2 p-1 rounded-full text-white" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => schedThumbRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center w-full transition-all" style={{ background: "rgba(18,12,8,0.8)", borderColor: "rgba(236,91,19,0.2)", color: "#94a3b8" }}>
                      <ImagePlus className="w-10 h-10 mb-2" style={{ color: "rgba(236,91,19,0.5)" }} />
                      <p className="text-sm font-medium">Click to upload or drag image</p>
                      <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>Recommended: 1280x720px</p>
                    </button>
                  )}
                  <input ref={schedThumbRef} type="file" accept="image/*" onChange={handleSchedThumb} className="hidden" />
                </div>

                <div className="p-6 rounded-2xl" style={panelStyle}>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#94a3b8" }}>Streaming Tips</h4>
                  <div className="space-y-3 text-sm" style={{ color: "#cbd5e1" }}>
                    <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" style={{ color: "#ec5b13" }} /> Schedule at least 15 minutes early so followers can set reminders.</p>
                    <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" style={{ color: "#ec5b13" }} /> Add a custom thumbnail to improve click-through when the event is announced.</p>
                    <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" style={{ color: "#ec5b13" }} /> Use a clear title so viewers know exactly what they'll join.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="p-6 rounded-2xl" style={panelStyle}>
                  {schedSuccess ? (
                    <div className="space-y-4 text-center py-4">
                      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(236,91,19,0.12)", border: "1px solid rgba(236,91,19,0.18)" }}>
                        <Calendar className="w-7 h-7" style={{ color: "#ec5b13" }} />
                      </div>
                      <div>
                        <p className="text-base font-bold">Stream Scheduled!</p>
                        <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>&ldquo;{schedSuccess.title}&rdquo;</p>
                        <p className="text-sm font-medium mt-2" style={{ color: "#fdba74" }}>
                          {new Date(schedSuccess.scheduledAt).toLocaleString(undefined, {
                            weekday: "short", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        Subscribers with notifications enabled will be notified. Come back before stream time and use Go Live Now to get your OBS key.
                      </p>
                      <button onClick={() => { setSchedSuccess(null); setSched({ title: "", description: "", scheduledAt: "" }); clearSchedThumb(); }} className="w-full py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: "#ec5b13", color: "#fff" }}>
                        Schedule Another
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSchedule} className="space-y-5">
                      <div>
                        <h2 className="text-lg font-bold mb-1">Schedule a Stream</h2>
                        <p className="text-sm" style={{ color: "#94a3b8" }}>Plan ahead and notify your audience before you go live.</p>
                      </div>

                      {schedError && (
                        <div className="p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#fecaca" }}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {schedError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Stream Title</label>
                        <input type="text" value={sched.title} onChange={(e) => setSched((s) => ({ ...s, title: e.target.value }))} required maxLength={120} placeholder="What will you stream?" className="w-full px-4 py-3 rounded-xl outline-none text-base" style={inputStyle} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Description</label>
                        <textarea value={sched.description} onChange={(e) => setSched((s) => ({ ...s, description: e.target.value }))} rows={4} maxLength={500} placeholder="Tell viewers what your stream is about..." className="w-full px-4 py-3 rounded-xl outline-none text-base resize-none" style={inputStyle} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Date & Time</label>
                          <input type="datetime-local" value={sched.scheduledAt} min={getMinDatetime()} onChange={(e) => setSched((s) => ({ ...s, scheduledAt: e.target.value }))} required className="w-full px-4 py-3 rounded-xl outline-none text-base" style={inputStyle} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-[0.2em] block" style={{ color: "#ec5b13" }}>Notifications</label>
                          <button type="button" onClick={() => setAutoPost((prev) => !prev)} className="w-full px-4 py-3 rounded-xl text-left flex items-center justify-between" style={inputStyle}>
                            <span>Auto-post reminder</span>
                            <span className="w-11 h-6 rounded-full p-1 transition-all" style={{ background: autoPost ? "#ec5b13" : "rgba(100,116,139,0.35)" }}>
                              <span className="block w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: autoPost ? "translateX(20px)" : "translateX(0)" }} />
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                        <button type="button" className="px-5 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.18)", color: "#cbd5e1" }}>
                          Save Draft
                        </button>
                        <button type="submit" disabled={schedLoading} className="px-5 py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60" style={{ background: "#ec5b13", color: "#fff" }}>
                          {schedLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling...</> : <><Calendar className="w-4 h-4" /> Schedule Stream</>}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GoLive;
