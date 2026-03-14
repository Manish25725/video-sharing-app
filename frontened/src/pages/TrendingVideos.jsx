import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, Flame, Play, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { videoService, transformVideosArray } from '../services/videoService';
import { formatTimeAgo, formatViews, formatDuration } from '../utils/formatters';
import PageLoader from '../components/PageLoader';

const TABS = ['All', 'Music', 'Gaming', 'Movies'];

const TrendingVideos = ({ onVideoSelect }) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchTrendingVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await videoService.getTrendingVideos();
      if (response.success && response.data) {
        setVideos(transformVideosArray(response.data));
      } else {
        setError(response.message || 'Failed to fetch trending videos');
        setVideos([]);
      }
    } catch (err) {
      setError('Failed to load trending videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingVideos();
    setRefreshing(false);
  };

  const handleVideoClick = (video) => {
    if (onVideoSelect) {
      onVideoSelect(video.id || video._id);
    } else {
      navigate(`/video/${video.id || video._id}`);
    }
  };

  const handleChannelClick = (e, video) => {
    e.stopPropagation();
    const ownerId = video.owner?._id || video.ownerDetails?._id;
    if (ownerId) navigate(`/profile/${ownerId}`);
  };

  useEffect(() => { fetchTrendingVideos(); }, []);

  // ── Unique creators extracted from videos ──
  const creators = Array.from(
    new Map(
      videos
        .filter(v => v.owner?._id || v.ownerDetails?._id)
        .map(v => {
          const id = v.owner?._id || v.ownerDetails?._id;
          const name = v.owner?.fullName || v.ownerDetails?.fullName || 'Unknown';
          const avatar = v.owner?.avatar || v.ownerDetails?.avatar;
          return [id, { id, name, avatar, views: v.views || 0 }];
        })
    ).values()
  ).slice(0, 6);

  const heroBg = "linear-gradient(135deg, rgba(236,91,19,0.25) 0%, rgba(12,6,2,0.95) 100%)";

  // ──────────── LOADING ────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Trending Now" />
      </div>
    );
  }

  // ──────────── ERROR ────────────
  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col" style={{ background: "#0a0a0a" }}>
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center py-32">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Unable to Load Trending Videos</h3>
          <p className="text-slate-400 mb-8 text-center max-w-md">{error}</p>
          <button onClick={handleRefresh}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: "#ec5b13", boxShadow: "0 8px 24px rgba(236,91,19,0.35)" }}>
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const featured = videos[0];
  const gridVideos = videos.slice(1);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "#0a0a0a" }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Title + Tabs ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-8 h-8" style={{ color: "#ec5b13" }} />
              <h2 className="text-4xl font-black tracking-tight text-white">Trending Now</h2>
            </div>
            <p className="text-slate-400 font-medium pl-[44px]">
              See what the world is watching right now.
            </p>
          </div>
          <div className="flex items-center p-1 rounded-xl gap-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
                style={activeTab === tab
                  ? { background: "#ec5b13", color: "#fff", boxShadow: "0 4px 12px rgba(236,91,19,0.35)" }
                  : { color: "#94a3b8" }
                }
                onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.background = "transparent"; }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {videos.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "rgba(236,91,19,0.1)" }}>
              <Flame className="w-10 h-10" style={{ color: "#ec5b13" }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Trending Videos</h3>
            <p className="text-slate-400 mb-8 text-center max-w-md">
              There are no trending videos at the moment. Check back later.
            </p>
            <button onClick={handleRefresh}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{ background: "#ec5b13", boxShadow: "0 8px 24px rgba(236,91,19,0.35)" }}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        ) : (
          <>
            {/* ── Hero Featured Video ── */}
            {featured && (
              <section className="mb-12 group cursor-pointer" onClick={() => handleVideoClick(featured)}>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl"
                  style={{ height: 460 }}>
                  {/* Background image */}
                  {featured.thumbnail ? (
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${featured.thumbnail})` }} />
                  ) : (
                    <div className="absolute inset-0" style={{ background: heroBg }} />
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(12,6,2,0.97) 0%, rgba(12,6,2,0.4) 50%, transparent 100%)" }} />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 p-10 w-full md:w-2/3">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                        style={{ background: "#ec5b13" }}>Featured</span>
                      <span className="text-white/60 text-sm font-medium">
                        • {formatViews(featured.views || 0)} Views
                        {featured.createdAt ? ` • ${formatTimeAgo(featured.createdAt)}` : ''}
                      </span>
                    </div>
                    <h3 className="text-4xl font-black text-white mb-3 leading-tight line-clamp-2">
                      {featured.title}
                    </h3>
                    {featured.description && (
                      <p className="text-slate-300 text-base mb-6 line-clamp-2 max-w-xl">
                        {featured.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleVideoClick(featured)}
                        className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-white transition-all hover:brightness-110 shadow-lg"
                        style={{ background: "#ec5b13", boxShadow: "0 8px 24px rgba(236,91,19,0.3)" }}>
                        <Play className="w-5 h-5 fill-current" />
                        WATCH NOW
                      </button>
                      <button
                        className="p-3.5 rounded-2xl text-white transition-all hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Duration badge */}
                  {featured.duration && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
                      {formatDuration(featured.duration)}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Trending Creators ── */}
            {creators.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold text-white">Trending Creators</h4>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 text-sm font-bold transition-all disabled:opacity-40"
                    style={{ color: "#ec5b13" }}>
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
                  {creators.map((creator) => (
                    <div key={creator.id}
                      onClick={() => navigate(`/profile/${creator.id}`)}
                      className="flex-shrink-0 flex flex-col items-center gap-3 p-5 rounded-2xl w-40 cursor-pointer transition-all hover:-translate-y-1"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(236,91,19,0.4)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
                    >
                      <div className="relative">
                        {creator.avatar ? (
                          <img src={creator.avatar} alt={creator.name}
                            className="w-16 h-16 rounded-full object-cover"
                            style={{ border: "3px solid rgba(255,255,255,0.1)" }} />
                        ) : (
                          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white"
                            style={{ background: "linear-gradient(135deg,#ec5b13,#8b5cf6)", border: "3px solid rgba(255,255,255,0.1)" }}>
                            {creator.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-white truncate w-full">{creator.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatViews(creator.views)} views</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/profile/${creator.id}`); }}
                        className="px-4 py-1.5 rounded-full text-[10px] font-bold transition-all"
                        style={{ border: "1px solid #ec5b13", color: "#ec5b13" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#ec5b13"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ec5b13"; }}
                      >
                        FOLLOW
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Top Videos Grid ── */}
            {gridVideos.length > 0 && (
              <section>
                <h4 className="text-xl font-bold text-white mb-8">Top Videos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                  {gridVideos.map((video, idx) => {
                    const channelName = video.owner?.fullName || video.ownerDetails?.fullName || 'Unknown';
                    const channelAvatar = video.owner?.avatar || video.ownerDetails?.avatar;
                    return (
                      <div key={video.id || idx} className="group cursor-pointer"
                        onClick={() => handleVideoClick(video)}>
                        {/* Thumbnail */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-lg"
                          style={{ background: "rgba(30,17,10,0.8)" }}>
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg,rgba(236,91,19,0.1),rgba(12,6,2,0.9))" }}>
                              <TrendingUp className="w-10 h-10 text-slate-700" />
                            </div>
                          )}
                          {/* Hover play */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300"
                              style={{ background: "rgba(236,91,19,0.9)", boxShadow: "0 4px 20px rgba(236,91,19,0.5)" }}>
                              <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                          {/* Rank badge */}
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black"
                            style={
                              idx === 0
                                ? { background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#fff" }
                                : idx === 1
                                ? { background: "linear-gradient(135deg,#94a3b8,#cbd5e1)", color: "#0f172a" }
                                : idx === 2
                                ? { background: "linear-gradient(135deg,#cd7f32,#b45309)", color: "#fff" }
                                : { background: "rgba(0,0,0,0.7)", color: "#94a3b8", backdropFilter: "blur(4px)" }
                            }>
                            <TrendingUp className="w-2.5 h-2.5" />
                            #{idx + 2}
                          </div>
                          {/* Duration */}
                          {video.duration && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                              style={{ background: "rgba(0,0,0,0.8)" }}>
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex gap-3">
                          {channelAvatar ? (
                            <img src={channelAvatar} alt={channelName}
                              className="flex-shrink-0 w-9 h-9 rounded-full object-cover mt-0.5"
                              onClick={e => handleChannelClick(e, video)} />
                          ) : (
                            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white mt-0.5 flex-shrink-0"
                              style={{ background: "linear-gradient(135deg,#ec5b13,#8b5cf6)" }}
                              onClick={e => handleChannelClick(e, video)}>
                              {channelName[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-sm text-white mb-1 line-clamp-2 leading-tight">{video.title}</h5>
                            <div className="flex items-center gap-1 mb-1">
                              <p className="text-xs text-slate-500 hover:text-[#ec5b13] transition-colors truncate cursor-pointer"
                                onClick={e => handleChannelClick(e, video)}>
                                {channelName}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              {formatViews(video.views || 0)} views
                              {video.createdAt ? ` • ${formatTimeAgo(video.createdAt)}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrendingVideos;
