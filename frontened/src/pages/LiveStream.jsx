import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Hls from "hls.js";
import streamService, { getHlsUrl } from "../services/streamService.js";
import socketService from "../services/socketService.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import LiveChat from "../components/LiveChat.jsx";
import {
  Users, Radio, AlertCircle, ChevronLeft, Calendar, Monitor
} from "lucide-react";

/* ─── HLS Video Player ─────────────────────────────────────── */
const HlsPlayer = ({ url, isLive }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [playerError, setPlayerError] = useState("");
  const [buffering, setBuffering] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setPlayerError("");
    setBuffering(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 3000,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayerError("");
        setBuffering(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setPlayerError("Stream is not live yet. Waiting for OBS connection…");
            setTimeout(() => {
              if (hlsRef.current) hlsRef.current.loadSource(url);
            }, 5000);
          } else {
            setPlayerError("Playback error. Please refresh.");
          }
        }
      });

      video.addEventListener("waiting", () => setBuffering(true));
      video.addEventListener("playing", () => setBuffering(false));

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = url;
      video.play().catch(() => {});
      setBuffering(false);
    } else {
      setPlayerError("Your browser does not support HLS playback.");
    }
  }, [url]);

  return (
    <div className="relative w-full bg-black aspect-video rounded-none md:rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain"
        playsInline
      />
      {buffering && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-white text-sm">Loading stream…</span>
          </div>
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <Radio className="w-10 h-10 text-gray-500 animate-pulse" />
            <p className="text-white text-sm">{playerError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main LiveStream page ─────────────────────────────────── */
const LiveStream = () => {
  const { streamKey } = useParams();
  const { user } = useAuth();    const navigate = useNavigate();
    const [isEnding, setIsEnding] = useState(false);    const [isSaving, setIsSaving] = useState(false);
    const [savedVideoId, setSavedVideoId] = useState(null);  const [streamInfo, setStreamInfo] = useState(null);
  const [hlsUrl, setHlsUrl] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Fetch stream info from API
  useEffect(() => {
    setLoading(true);
    setFetchError("");
    streamService.getStreamByKey(streamKey)
      .then(({ data }) => {
        const { stream, hlsUrl: url } = data;
        setStreamInfo(stream);
        setHlsUrl(url || getHlsUrl(streamKey));
        setIsLive(stream.isLive);
        setViewerCount(stream.viewerCount || 0);
      })
      .catch(() => setFetchError("Stream not found or no longer available."))
      .finally(() => setLoading(false));

    // Load last 100 messages
    streamService.getStreamMessages(streamKey)
      .then(({ data }) => setChatMessages(data || []))
      .catch(() => {});
  }, [streamKey]);

  // Join socket room and listen for events
  useEffect(() => {
    if (!streamKey) return;

    const joinAndListen = (socket) => {
      socket.emit("join-stream", {
        streamKey,
        userId: user?._id,
        username: user?.fullName || user?.userName || "Viewer",
      });

      const onViewerCount = ({ count }) => setViewerCount(count);
      const onStreamStarted = () => setIsLive(true);
      const onStreamEnded = () => setIsLive(false);

      socket.on("viewer-count", onViewerCount);
      socket.on("stream-started", onStreamStarted);
      socket.on("stream-ended", onStreamEnded);

      return () => {
        socket.emit("leave-stream", { streamKey });
        socket.off("viewer-count", onViewerCount);
        socket.off("stream-started", onStreamStarted);
        socket.off("stream-ended", onStreamEnded);
      };
    };

    const socket = socketService.socket;
    if (!socket) return;

    // If already connected, join immediately; otherwise wait for connect
    if (socketService.isConnected) {
      return joinAndListen(socket);
    } else {
      let cleanup = () => {};
      socket.once("connect", () => { cleanup = joinAndListen(socket); });
      return () => cleanup();
    }
  }, [streamKey, user]);

  // Poll backend every 5 s while offline to detect when OBS goes live
  useEffect(() => {
    if (isLive) return;
    const poll = setInterval(() => {
      streamService.getStreamByKey(streamKey)
        .then(({ data }) => { if (data?.stream?.isLive) setIsLive(true); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(poll);
  }, [streamKey, isLive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading stream…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-700 font-medium">{fetchError}</p>
          <Link to="/" className="text-sm text-indigo-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

    const handleSaveRecording = async () => {
    setIsSaving(true);
    try {
        const { data } = await streamService.saveRecording(streamKey);
        setSavedVideoId(data.videoId);
    } catch (err) {
        console.error(err);
        alert('Failed to save recording.');
    } finally {
        setIsSaving(false);
    }
};

const handleEndStream = async () => {
      if (!window.confirm("Are you sure you want to end this stream?")) return;
      setIsEnding(true);
      try {
        await streamService.endStream(streamKey);
        setIsLive(false);
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setIsEnding(false);
      }
    };

    const streamer = streamInfo?.streamerId;
    const streamerName = streamer?.fullName || streamer?.userName || 'Streamer';

    return (
    <div className="min-h-screen bg-gray-950">
      {/* Back nav */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center gap-3">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="text-gray-200 text-sm font-medium truncate flex-1">{streamInfo?.title}</span>          
          {user?._id === streamer?._id && !isLive && !savedVideoId && (<button onClick={handleSaveRecording} disabled={isSaving} className='bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-md mx-2'>{isSaving ? 'Saving...' : 'Save Recording'}</button>)}{savedVideoId && (<Link to={'/watch/' + savedVideoId} className='bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-md mx-2'>View VOD</Link>)}{user?._id === streamer?._id && isLive && (
            <button
              onClick={handleEndStream}
              disabled={isEnding}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              {isEnding ? "Ending..." : "End Stream"}
            </button>
          )}
        {isLive ? (
          <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        ) : (
          <span className="bg-gray-700 text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-md">OFFLINE</span>
        )}
      </div>

      {/* Main layout: video + chat */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-48px)]">
        {/* Left: video + info */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Video player — remount when stream goes live so hls.js retries cleanly */}
          <HlsPlayer key={`${hlsUrl}-${isLive}`} url={hlsUrl} isLive={isLive} />

          {/* Stream info */}
          <div className="p-4 md:p-6 bg-gray-900 border-b border-gray-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white leading-snug">{streamInfo?.title}</h1>
                {streamInfo?.description && (
                  <p className="mt-1 text-sm text-gray-400 line-clamp-2">{streamInfo.description}</p>
                )}
              </div>
              {/* Viewer count */}
              <div className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 rounded-full text-sm text-gray-300 whitespace-nowrap flex-shrink-0">
                <Users className="w-3.5 h-3.5 text-red-400" />
                {viewerCount.toLocaleString()}
                <span className="text-gray-500 text-xs">watching</span>
              </div>
            </div>

            {/* Streamer info */}
            <div className="mt-4 flex items-center gap-3">
              {streamer?.avatar ? (
                <img src={streamer.avatar} alt={streamerName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center text-indigo-200 font-bold">
                  {streamerName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-sm">{streamerName}</p>
                {streamer?.userName && (
                  <p className="text-gray-500 text-xs">@{streamer.userName}</p>
                )}
              </div>
              {isLive && (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                  <Monitor className="w-3.5 h-3.5" />
                  Live now
                </div>
              )}
            </div>
          </div>

          {/* Offline notice */}
          {!isLive && (
            <div className="m-4 p-4 rounded-xl bg-gray-800 border border-gray-700 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-gray-300 text-sm">
                This stream is currently offline. Check back later or browse{" "}
                <Link to="/live" className="text-indigo-400 hover:underline">live streams</Link>.
              </p>
            </div>
          )}
        </div>

        {/* Right: chat */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 h-full">
          <LiveChat streamKey={streamKey} initialMessages={chatMessages} />
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
