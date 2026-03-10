import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import streamService from "../services/streamService.js";
import {
  Radio, Copy, CheckCircle, Eye, EyeOff, Wifi, AlertTriangle,
  Play, Square, BookOpen, ChevronDown, ChevronUp, ExternalLink,
  ImagePlus, X,
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
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div className={`flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 truncate ${mono ? "font-mono" : ""}`}>
          {value}
        </div>
        <button onClick={copy}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
          {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

const StatusBadge = ({ isLive }) =>
  isLive ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> OFFLINE
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

  // Re-hydrate if creator already has an active stream
  useEffect(() => {
    streamService.getMyStream()
      .then(({ data }) => {
        const { stream, rtmpUrl, hlsUrl, streamKey } = data?.data || {};
        if (stream) {
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
      setStreamData(data.data);
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

  const handleEndStream = async () => {
    if (!window.confirm("Are you sure you want to end this stream?")) return;
    setEnding(true);
    try {
      await streamService.endStream(streamData.streamKey);
      setStreamData(null);
      setStep("details");
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err?.message || "Failed to end stream");
    } finally {
      setEnding(false);
    }
  };

  const obsSteps = [
    "Open OBS Studio → Settings → Stream",
    'Set "Service" to Custom',
    `Set "Server" to the RTMP URL below`,
    `Set "Stream Key" to your stream key`,
    'Click OK then click "Start Streaming" in OBS',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Go Live</h1>
            <p className="text-sm text-gray-500">Broadcast to your audience in real time</p>
          </div>
          {streamData && <div className="ml-auto"><StatusBadge isLive={streamData.stream?.isLive} /></div>}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Step 1: Stream details ── */}
        {step === "details" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Stream Details</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stream Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Coding live — building a chat app"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers what you'll be streaming about..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stream Thumbnail</label>
                {thumbnailPreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={thumbnailPreview} alt="thumbnail preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={clearThumbnail}
                      className="absolute top-2 right-2 p-1 bg-gray-900/60 hover:bg-gray-900/80 text-white rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all">
                    <ImagePlus className="w-8 h-8" />
                    <span className="text-sm font-medium">Click to upload thumbnail</span>
                    <span className="text-xs">PNG, JPG, WEBP up to 5 MB</span>
                  </button>
                )}
                <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-60">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><Play className="w-4 h-4 fill-current" /> Generate Stream Key</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: Live dashboard ── */}
        {step === "live" && streamData && (
          <div className="space-y-4">
            {/* Stream key card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">OBS Configuration</h2>
                <button onClick={() => navigate(`/live/${streamData.streamKey}`)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Preview stream
                </button>
              </div>

              <CopyField label="RTMP Server URL" value={streamData.rtmpUrl} mono />

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Stream Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 truncate">
                    {showKey ? streamData.streamKey : "••••••••••••••••••••••"}
                  </div>
                  <button onClick={() => setShowKey(!showKey)}
                    className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {showKey && (
                    <button onClick={() => navigator.clipboard.writeText(streamData.streamKey)}
                      className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Keep your stream key private — anyone with it can broadcast on your channel.
                </p>
              </div>

              <CopyField label="HLS Playback URL (for testing)" value={streamData.hlsUrl} mono />
            </div>

            {/* OBS Setup Guide */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowObs(!showObs)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" /> OBS Setup Guide</span>
                {showObs ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showObs && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  <ol className="mt-4 space-y-3">
                    {obsSteps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                    💡 Tip: Set your OBS output to 1080p 30fps, bitrate 3000–6000 kbps for best quality.
                  </div>
                </div>
              )}
            </div>

            {/* Status + end button */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className={`w-5 h-5 ${streamData.stream?.isLive ? "text-emerald-500" : "text-gray-300"}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {streamData.stream?.isLive ? "Stream is live" : "Waiting for OBS connection…"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {streamData.stream?.isLive
                      ? `${(streamData.stream.viewerCount || 0).toLocaleString()} viewers`
                      : "Start streaming in OBS to go live"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEndStream}
                disabled={ending}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                {ending ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Square className="w-4 h-4" />}
                End Stream
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoLive;
