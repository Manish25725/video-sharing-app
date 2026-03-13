import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import streamService from "../services/streamService.js";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Plus, X, Radio, User, AlertTriangle, ImagePlus, Play, Copy, CheckCircle
} from "lucide-react";

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const timeUntil = (iso) => {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return "Starting soon";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return "In ${days}d ${hours}h";
  if (hours > 0) return "In ${hours}h ${mins}m";
  return "In ${mins} min";
};

const CountdownTimer = ({ scheduledAt, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(scheduledAt) - Date.now();
      if (diff <= 0) {
        setTimeLeft('Time is up!');
        if (onTimeUp) onTimeUp();
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      
      if (days > 0) setTimeLeft(`In ${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`In ${hours}h ${mins}m`);
      else if (mins > 0) setTimeLeft(`In ${mins}m ${secs}s`);
      else setTimeLeft(`In ${secs}s`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt, onTimeUp]);

  return <>{timeLeft}</>;
};

/* â”€â”€ Stream Detail Modal (shown to subscribers when they click a card) â”€â”€ */
const StreamDetailModal = ({ stream, onClose }) => {
  const streamer = stream.streamerId;
  const name = streamer?.fullName || streamer?.userName || "Creator";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#121212] rounded-2xl shadow-2xl border border-gray-800 w-full max-w-sm overflow-hidden">
        {/* Thumbnail */}
        {stream.thumbnailUrl ? (
          <div className="relative w-full aspect-video bg-gray-900">
            <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-14 h-14 rounded-full bg-[#121212]/20 backdrop-blur-sm border-2 border-white flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center">
            <Radio className="w-12 h-12 text-white/60" />
          </div>
        )}

        <div className="p-5">
          <h2 className="text-base font-bold text-gray-100 leading-snug">{stream.title}</h2>
          
          {/* Streamer */}
          <div className="flex items-center gap-2 mt-2">
            {streamer?.avatar ? (
              <img src={streamer.avatar} alt={name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            )}
            <span className="text-xs text-gray-500">{name}</span>
          </div>

          {stream.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-3">{stream.description}</p>
          )}

          {/* Starts at */}
          <div className="mt-4 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-xs text-indigo-500 uppercase tracking-wider font-semibold mb-1">Stream starts at</p>
            <p className="text-sm font-bold text-indigo-300">{formatDateTime(stream.scheduledAt)}</p>
            <p className="text-xs font-medium text-indigo-500 mt-1">{timeUntil(stream.scheduledAt)}</p>
          </div>
          
          <div className="flex gap-2 mt-4">
            {stream.streamKey && (
              <Link to={`/live/${stream.streamKey}`} className="flex-1 text-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
                Waiting Room
              </Link>
            )}
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* â”€â”€ Stream Card â”€â”€ */
const StreamCard = ({ stream, isOwn, onCancel }) => {  const streamer = stream.streamerId;  const name = streamer?.fullName || streamer?.userName || "Creator";  const [showDetail, setShowDetail] = useState(false);  const [isTimeUp, setIsTimeUp] = useState(false);  const [streamKey, setStreamKey] = useState("");  const [rtmpUrl, setRtmpUrl] = useState("");  const [isLoadingKey, setIsLoadingKey] = useState(false);  const [copied, setCopied] = useState(false);  const [isLiveActive, setIsLiveActive] = useState(false);  const [streamEnded, setStreamEnded] = useState(false);  const [saving, setSaving] = useState(false);  const [savedVideoId, setSavedVideoId] = useState(null);  useEffect(() => {    /* Sockets */    const socket = window.io ? window.io : null;    if (!socket || !streamKey) return;    const onStreamStarted = (data) => { if (data.streamKey === streamKey) setIsLiveActive(true); };    const onStreamEnded = (data) => { if (data.streamKey === streamKey) { setIsLiveActive(false); setStreamEnded(true); } };    socket.on("stream-started", onStreamStarted);    socket.on("stream-ended", onStreamEnded);    return () => { socket.off("stream-started", onStreamStarted); socket.off("stream-ended", onStreamEnded); };  }, [streamKey]);  useEffect(() => { if (new Date(stream.scheduledAt) - Date.now() <= 0) setIsTimeUp(true); }, [stream.scheduledAt]);  const handleTimeUp = () => setIsTimeUp(true);  const handleSaveRecording = async (e) => {    e.stopPropagation(); setSaving(true);    try { const { data } = await streamService.saveRecording(streamKey); setSavedVideoId(data.videoId); alert("Saved!"); }    catch (err) { console.error(err); alert("Failed"); }    finally { setSaving(false); }  };
const handleGetKey = async (e) => {
    e.stopPropagation();
    try {
      setIsLoadingKey(true);
      const fd = new FormData();
      fd.append("title", stream.title);
      fd.append("description", stream.description || "");
      if (stream.streamKey) fd.append("streamKey", stream.streamKey);
      const res = await streamService.goLive(fd);
      if (res.data) {
        setStreamKey(res.data.streamKey);
        setRtmpUrl(res.data.rtmpUrl);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get stream key");
    } finally {
      setIsLoadingKey(false);
    }
  };

  const copyKey = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(streamKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        onClick={() => !isOwn && setShowDetail(true)}
        className={`bg-[#121212] rounded-2xl border border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow ${!isOwn ? "cursor-pointer" : ""}`}
      >
        <div className="flex gap-0">
          {/* Thumbnail column */}
          <div className="relative w-36 flex-shrink-0 bg-gray-800">
            {stream.thumbnailUrl ? (
              <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full min-h-[90px] bg-gradient-to-br from-indigo-400 to-fuchsia-500 flex items-center justify-center">
                <Radio className="w-8 h-8 text-white/70" />
              </div>
            )}
            {/* Countdown badge */}
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-semibold">
              <CountdownTimer scheduledAt={stream.scheduledAt} onTimeUp={handleTimeUp} />
            </div>
          </div>

          {/* Info column */}
          <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
            <div>
              <p className="font-semibold text-gray-100 text-sm leading-snug line-clamp-2">{stream.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {streamer?.avatar ? (
                  <img src={streamer.avatar} alt={name} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-2.5 h-2.5 text-indigo-500" />
                  </div>
                )}
                <span className="text-xs text-gray-500 truncate">{name}</span>
              </div>
              {stream.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{stream.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  {new Date(stream.scheduledAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>

                <div className="flex items-center gap-1.5">
                  {isOwn && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onCancel(stream._id); }} 
                        className="flex items-center gap-1 px-2.5 py-1 bg-red-900/40 hover:bg-red-900/60 text-red-500 rounded-lg text-xs font-semibold transition-colors">
                        <X className="w-3 h-3" /> Cancel                      </button>                      {!streamKey ? (
                          <button onClick={handleGetKey} disabled={isLoadingKey}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                            <Radio className="w-3 h-3" /> {isLoadingKey ? "Preparing..." : "Get Stream Key"}
                          </button>
                        ) : null}
                    </>
                  )}
                  {!isOwn && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                      <Play className="w-3 h-3 fill-current" /> Tap to view
                    </span>
                  )}
                </div>
              </div>
              
              {streamKey && (
                <div onClick={e => e.stopPropagation()} className="mt-3 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <p className="text-xs font-bold text-indigo-300 mb-1">OBS Connection Info</p>
                  <p className="text-[10px] text-indigo-600 mb-2">Use this URL and Stream Key in your broadcasting software to start streaming.</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-[#121212] px-2 py-1.5 rounded border border-indigo-500/20">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-[10px] text-indigo-400 block font-semibold">Server URL</span>
                        <code className="text-xs text-gray-300 truncate block">{rtmpUrl}</code>
                      </div>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(rtmpUrl);
                      }} className="p-1 text-indigo-500 hover:bg-indigo-500/10 rounded transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-[#121212] px-2 py-1.5 rounded border border-indigo-500/20">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-[10px] text-indigo-400 block font-semibold">Stream Key</span>
                        <code className="text-xs text-gray-300 truncate block">{streamKey}</code>
                      </div>
                      <button onClick={copyKey} className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-semibold shadow-sm transition-colors">
                        {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy Key"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                     <Link to="/live" className="text-xs font-semibold text-indigo-600 hover:text-indigo-300 transition-colors flex items-center gap-1">
                        Go to Live Streams →
                     </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <StreamDetailModal stream={stream} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
};


const ScheduleForm = ({ onScheduled, onClose }) => {
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "" });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const thumbnailRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const minDt = new Date(Date.now() + 5 * 60_000);
  const pad = (n) => String(n).padStart(2, "0");
  const minDatetime = `${minDt.getFullYear()}-${pad(minDt.getMonth() + 1)}-${pad(minDt.getDate())}T${pad(minDt.getHours())}:${pad(minDt.getMinutes())}`;

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
      onScheduled(data);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to schedule stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#121212] rounded-2xl shadow-xl border border-gray-800 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold text-gray-100">Schedule a Stream</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-900/30 flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream Thumbnail</label>
            {thumbnailPreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-800 bg-gray-800">
                <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={clearThumbnail}
                  className="absolute top-2 right-2 p-1 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-full transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => thumbnailRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 py-6 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-500/10/30 transition-all">
                <ImagePlus className="w-7 h-7" />
                <span className="text-xs font-medium">Click to upload thumbnail</span>
                <span className="text-xs text-gray-500">PNG, JPG, WEBP up to 5 MB</span>
              </button>
            )}
            <input ref={thumbnailRef} type="file" accept="image/*" onChange={handleThumbnail} className="hidden" />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Stream Title *</label>
            <input type="text" value={form.title} onChange={set("title")} required maxLength={120}
              placeholder="What will you stream?"
              className="w-full px-3.5 py-2.5 border border-gray-800 rounded-xl text-sm bg-[#0f0f0f] focus:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/200 transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={set("description")} rows={2} maxLength={500}
              placeholder="Tell viewers what your stream is aboutâ€¦"
              className="w-full px-3.5 py-2.5 border border-gray-800 rounded-xl text-sm bg-[#0f0f0f] focus:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/200 transition-all resize-none" />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date &amp; Time *</label>
            <input type="datetime-local" value={form.scheduledAt} min={minDatetime} onChange={set("scheduledAt")} required
              className="w-full px-3.5 py-2.5 border border-gray-800 rounded-xl text-sm bg-[#0f0f0f] focus:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/200 transition-all" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Schedulingâ€¦</>
              : <><Calendar className="w-4 h-4" /> Schedule Stream</>}
          </button>
        </form>
      </div>
    </div>
  );
};

/* â”€â”€ Page â”€â”€ */
const ScheduledStreams = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    streamService.getScheduledStreams()
      .then(({ data }) => setStreams(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleScheduled = (newStream) => {
    setStreams((prev) =>
      [...prev, newStream].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    );
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this scheduled stream?")) return;
    try {
      await streamService.cancelScheduledStream(id);
      setStreams((prev) => prev.filter((s) => s._id !== id));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Upcoming Streams</h1>
              <p className="text-sm text-gray-500">Scheduled live streams from creators</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
              <Plus className="w-4 h-4" /> Schedule
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#121212] rounded-2xl animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Radio className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No upcoming streams scheduled</p>
            {user && (
              <button onClick={() => setShowForm(true)}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Be the first to schedule one â†’
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream._id}
                stream={stream}
                isOwn={user && (String(stream.streamerId?._id) === String(user._id) || String(stream.streamerId) === String(user._id) || stream.streamerId?.userName === user?.userName || stream.streamerId?.fullName === user?.fullName)}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ScheduleForm onScheduled={handleScheduled} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};

export default ScheduledStreams;