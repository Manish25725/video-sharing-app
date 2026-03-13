import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { videoService, transformVideosArray } from "../services/videoService.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import streamService from "../services/streamService.js";
import { formatTimeAgo, formatViews } from "../utils/formatters.js";

const CATEGORY_MAP = {
  "All":      "",
  "Music":    "Music",
  "Movies":   "Movies",
  "Gaming":   "Gaming",
  "News":     "News",
  "Sports":   "Sports",
  "Learning": "Learning",
  "Fashion":  "Fashion",
  "Live":     "live",
  "Shorts":   "Shorts",
};

const categories = Object.keys(CATEGORY_MAP);

// Compact video card matching the PlayVibe template style
const VideoCard = ({ video, onClick }) => {
  const [imgErr, setImgErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  return (
    <div
      className="group cursor-pointer relative"
      style={{ transition: "transform 0.3s cubic-bezier(.4,0,.2,1)" }}
      onClick={() => onClick(video.id)}
      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-[#1c120d]">
        {!imgErr && video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1c120d]">
            <svg className="w-12 h-12 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 text-white flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
        </div>
        {/* Duration */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white backdrop-blur-sm">
            {video.duration}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[#1c120d] overflow-hidden">
          {!avatarErr && video.channelAvatar ? (
            <img
              src={video.channelAvatar}
              alt={video.channelName}
              className="w-full h-full object-cover rounded-full"
              onError={() => setAvatarErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
              {(video.channelName || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm line-clamp-2 text-slate-100 group-hover:text-[#ec5b13] transition-colors">
            {video.title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{video.channelName}</p>
          <p className="text-[11px] text-slate-600">
            {formatViews(video.views)} views
            {video.uploadTime ? ` • ${formatTimeAgo(video.uploadTime)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

// Live stream card matching the template
const LiveCard = ({ stream }) => (
  <Link to={`/live/${stream.streamKey}`} className="group block">
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1c120d] mb-3">
      {stream.thumbnail ? (
        <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-[#1c120d]">
          <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Live
      </div>
    </div>
    <p className="font-semibold text-sm text-slate-100 line-clamp-2 group-hover:text-[#ec5b13] transition-colors">{stream.title}</p>
    {stream.owner && <p className="text-xs text-slate-500 mt-0.5">{stream.owner.fullName || stream.owner.userName}</p>}
  </Link>
);

const HomeScheduledTimer = ({ scheduledAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(scheduledAt) - Date.now();
      if (diff <= 0) {
        setTimeLeft('Starting soon!');
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
  }, [scheduledAt]);

  return <>{timeLeft}</>;
};

const Home = ({ onVideoSelect }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [liveStreams, setLiveStreams] = useState([]);
  const [scheduledStreams, setScheduledStreams] = useState([]);

  useEffect(() => {
    streamService.getLiveStreams().then(r => {
      if (r.success) setLiveStreams(r.data.slice(0, 4));
    }).catch(() => {});
    streamService.getScheduledStreams().then(r => {
      if (r.success) setScheduledStreams(r.data.slice(0, 3));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const videoTypeFilter = activeCategory === "All" ? "" : CATEGORY_MAP[activeCategory] || activeCategory;
        const response = await videoService.getAllVideos(
          currentPage, 20, "", "createdAt", "desc", "", videoTypeFilter
        );
        if (response.success) {
          setVideos(transformVideosArray(response.data));
          setTotalPages(Math.ceil((response.totalVideos || response.data?.length || 0) / 20) || 1);
        } else {
          setError("Failed to load videos");
          setVideos([]);
        }
      } catch {
        setError("Failed to load videos");
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [activeCategory, currentPage]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleVideoClick = (videoId) => {
    if (onVideoSelect) onVideoSelect(videoId);
    else navigate(`/video/${videoId}`);
  };

  // Hero video = first video in list (most recent)
  const heroVideo = videos[0] ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#ec5b13] border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100">

      {/* ── Hero Section ── */}
      <section className="relative h-[65vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          {heroVideo?.thumbnail ? (
            <img
              src={heroVideo.thumbnail}
              alt={heroVideo.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1c120d] to-[#0a0a0a]" />
          )}
          {/* gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(0deg, #0a0a0a 0%, rgba(18,10,6,0.9) 30%, rgba(18,10,6,0) 100%)" }}
          />
        </div>
        <div className="relative h-full flex flex-col justify-end px-6 pb-14 lg:px-12 max-w-4xl">
          {heroVideo && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border backdrop-blur-md"
                  style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13", borderColor: "rgba(236,91,19,0.3)" }}>
                  Latest
                </span>
                {heroVideo.channelName && (
                  <span className="text-slate-400 text-xs">• {heroVideo.channelName}</span>
                )}
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight tracking-tighter">
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(90deg, #ec5b13, #8b5cf6)" }}>
                  {heroVideo.title}
                </span>
              </h2>
              {heroVideo.description && (
                <p className="text-slate-300 text-base mb-6 max-w-2xl leading-relaxed line-clamp-2">
                  {heroVideo.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleVideoClick(heroVideo.id)}
                  className="flex items-center gap-2 px-7 py-3 text-white rounded-xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  style={{ background: "#ec5b13", boxShadow: "0 10px 30px rgba(236,91,19,0.3)" }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Watch Now
                </button>
                {liveStreams.length > 0 && (
                  <Link to="/live"
                    className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                    style={{ background: "rgba(28,18,13,0.7)", backdropFilter: "blur(12px)" }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {liveStreams.length} Live Now
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Live Now Strip ── */}
      {liveStreams.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-12 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-xl font-bold">Live Now</h3>
            </div>
            <Link to="/live" className="text-sm text-[#ec5b13] hover:underline font-semibold">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {liveStreams.map(stream => (
              <LiveCard key={stream._id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {/* ── Category Pills ── */}
      <section
        className="px-4 sm:px-6 lg:px-12 py-6 border-t border-b"
        style={{ borderColor: "rgba(236,91,19,0.08)" }}
      >
        <div className="flex flex-wrap gap-2.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={
                activeCategory === cat
                  ? { background: "#ec5b13", color: "#fff", boxShadow: "0 4px 15px rgba(236,91,19,0.25)" }
                  : {
                      background: "rgba(28,18,13,0.7)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Video Grid ── */}
      <section className="px-4 sm:px-6 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-7">
          <h3 className="text-2xl font-bold">
            {activeCategory === "All" ? "Recommended for You" : activeCategory}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full border text-slate-400 hover:text-white hover:border-slate-500 transition-all disabled:opacity-30"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border text-slate-400 hover:text-white hover:border-slate-500 transition-all disabled:opacity-30"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-700/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {videos.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
            <p className="text-lg font-medium">No videos found</p>
            <p className="text-sm mt-1">Try a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} onClick={handleVideoClick} />
            ))}
          </div>
        )}
      </section>

      {/* ── Upcoming Streams ── */}
      {scheduledStreams.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-12 py-8 border-t" style={{ borderColor: "rgba(236,91,19,0.08)" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Upcoming Streams
            </h3>
            <Link to="/scheduled-streams" className="text-sm text-[#ec5b13] hover:underline font-semibold">View all →</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {scheduledStreams.map(s => (
              <Link key={s._id} to="/scheduled-streams"
                className="flex-shrink-0 w-64 rounded-2xl p-4 border transition-all hover:border-[#ec5b13]/40"
                style={{ background: "rgba(28,18,13,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="font-semibold text-slate-100 truncate">{s.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                <p className="text-xs mt-2 font-medium" style={{ color: "#ec5b13" }}>
                  {new Date(s.scheduledAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer
        className="px-4 sm:px-6 lg:px-12 py-12 mt-8 border-t"
        style={{
          background: "rgba(28,18,13,0.7)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(236,91,19,0.1)",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #ec5b13 0%, #8b5cf6 100%)" }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <h4 className="text-lg font-bold">PlayVibe</h4>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">The world's premier platform for high-fidelity video sharing and professional content creation.</p>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-4">Platform</h5>
            <ul className="space-y-2 text-slate-500 text-sm">
              <li><Link to="/" className="hover:text-[#ec5b13] transition-colors">Browse</Link></li>
              <li><Link to="/subscriptions" className="hover:text-[#ec5b13] transition-colors">Following</Link></li>
              <li><Link to="/live" className="hover:text-[#ec5b13] transition-colors">Live Studio</Link></li>
              <li><Link to="/help" className="hover:text-[#ec5b13] transition-colors">Support</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-sm mb-4">Library</h5>
            <ul className="space-y-2 text-slate-500 text-sm">
              <li><Link to="/watch-history" className="hover:text-[#ec5b13] transition-colors">History</Link></li>
              <li><Link to="/watch-later" className="hover:text-[#ec5b13] transition-colors">Watch Later</Link></li>
              <li><Link to="/liked-videos" className="hover:text-[#ec5b13] transition-colors">Liked Videos</Link></li>
              <li><Link to="/playlists" className="hover:text-[#ec5b13] transition-colors">Playlists</Link></li>
            </ul>
          </div>
          <div className="col-span-2">
            <h5 className="font-bold text-sm mb-4">Explore</h5>
            <div className="flex flex-wrap gap-2">
              {["Music","Movies","Gaming","News","Sports","Learning","Fashion"].map(cat => (
                <button key={cat} onClick={() => { handleCategoryChange(cat); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="text-xs px-3 py-1.5 rounded-full text-slate-400 border border-slate-700/50 hover:text-[#ec5b13] hover:border-[#ec5b13]/50 transition-all">
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-slate-600">© {new Date().getFullYear()} PlayVibe. All rights reserved.</p>
          <div className="flex gap-6 text-[11px] text-slate-600">
            <Link to="/help" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/help" className="hover:text-slate-400">Terms of Service</Link>
            <Link to="/feedback" className="hover:text-slate-400">Feedback</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
