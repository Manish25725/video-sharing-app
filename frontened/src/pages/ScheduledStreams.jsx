import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import streamService from "../services/streamService.js";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Plus, X, Radio, User, AlertTriangle, ChevronRight
} from "lucide-react";

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const timeUntil = (iso) => {
  const diff = new Date(iso) - Date.now();
  if (diff <= 0) return "Starting soon";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${mins}m`;
  return `In ${mins} min`;
};

const StreamCard = ({ stream, isOwn, onCancel }) => {
  const streamer = stream.streamerId;
  const name = streamer?.fullName || streamer?.userName || "Creator";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow">
      {/* Avatar */}
      {streamer?.avatar ? (
        <img src={streamer.avatar} alt={name}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0 mt-0.5" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-5 h-5 text-indigo-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 leading-snug">{stream.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{name}</p>
        {stream.description && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{stream.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {formatDateTime(stream.scheduledAt)}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-indigo-600">
            <Clock className="w-3.5 h-3.5" />
            {timeUntil(stream.scheduledAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {isOwn && (
          <button
            onClick={() => onCancel(stream._id)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Cancel stream">
            <X className="w-4 h-4" />
          </button>
        )}
        <Link to={`/go-live`}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-auto">
          Go live <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

const ScheduleForm = ({ onScheduled, onClose }) => {
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Min datetime = now + 5 min, formatted in LOCAL time so the
  // datetime-local input (which always works in local time) shows
  // the correct floor. Using toISOString() would give UTC, causing
  // users in UTC+ timezones to submit times the server rejects as past.
  const minDt = new Date(Date.now() + 5 * 60_000);
  const pad = (n) => String(n).padStart(2, "0");
  const minDatetime = `${minDt.getFullYear()}-${pad(minDt.getMonth() + 1)}-${pad(minDt.getDate())}T${pad(minDt.getHours())}:${pad(minDt.getMinutes())}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) {
      setError("Title and scheduled time are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await streamService.scheduleStream({
        title: form.title.trim(),
        description: form.description.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      onScheduled(data.data);
      onClose();
    } catch (err) {
      // API client throws Error with .message (not .response), so read directly
      setError(err?.message || "Failed to schedule stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Schedule a Stream</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date & Time *</label>
            <input type="datetime-local" value={form.scheduledAt} min={minDatetime} onChange={set("scheduledAt")} required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scheduling…</>
            ) : "Schedule Stream"}
          </button>
        </form>
      </div>
    </div>
  );
};

const ScheduledStreams = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    streamService.getScheduledStreams()
      .then(({ data }) => setStreams(data.data || []))
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upcoming Streams</h1>
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
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Radio className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No upcoming streams scheduled</p>
            {user && (
              <button onClick={() => setShowForm(true)}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Be the first to schedule one →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {streams.map((stream) => (
              <StreamCard
                key={stream._id}
                stream={stream}
                isOwn={user && String(stream.streamerId?._id) === String(user._id)}
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
