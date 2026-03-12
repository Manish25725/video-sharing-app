import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, Play, Shuffle, ThumbsUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { likeService } from '../services/likeService';
import { formatDuration, formatViews, formatTimeAgo } from '../utils/formatters';

/* ── Inline video card ─────────────────────────────────────────────── */
const VideoCardInline = ({ video, onVideoSelect }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onVideoSelect && onVideoSelect(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3"
        style={{ background: 'rgba(45,30,22,0.8)' }}>
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'rgba(45,30,22,0.6)' }}>
            <Play className="w-10 h-10" style={{ color: 'rgba(236,91,19,0.3)' }} />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.4)', opacity: hovered ? 1 : 0 }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300"
            style={{ background: '#ec5b13', transform: hovered ? 'scale(1)' : 'scale(0.9)' }}>
            <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {/* Duration */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 text-white text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            {video.duration}
          </span>
        )}
      </div>
      {/* Info row */}
      <div className="flex gap-3">
        {video.channelAvatar ? (
          <img src={video.channelAvatar} alt={video.channelName}
            className="w-10 h-10 rounded-full shrink-0 object-cover"
            style={{ background: 'rgba(45,30,22,0.8)' }} />
        ) : (
          <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(236,91,19,0.2)', color: '#ec5b13' }}>
            {video.channelName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold leading-snug line-clamp-2 transition-colors duration-200"
            style={{ color: hovered ? '#ec5b13' : '#f1f5f9' }}>
            {video.title}
          </h3>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>{video.channelName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(236,91,19,0.5)' }}>
            {video.views ? formatViews(video.views) + ' views' : ''}
            {video.views && video.uploadTime ? ' • ' : ''}
            {video.uploadTime ? formatTimeAgo(video.uploadTime) : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

const LikedVideos = ({ onVideoSelect }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchLikedVideos = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await likeService.getLikedVideos();

        if (response && response.success && response.data) {
          const transformedVideos = response.data.map(like => {
            if (like.videoDetails) {
              return {
                id: like.videoDetails._id,
                title: like.videoDetails.title,
                thumbnail: like.videoDetails.thumbnail,
                duration: formatDuration(like.videoDetails.duration),
                views: like.videoDetails.views,
                channelName: like.videoDetails.userDetails?.fullName || like.videoDetails.userDetails?.userName || 'Unknown',
                channelAvatar: like.videoDetails.userDetails?.avatar,
                uploadTime: like.videoDetails.createdAt,
                uploadDate: like.videoDetails.createdAt,
                videoFile: like.videoDetails.videoFile,
                description: like.videoDetails.description,
                owner: like.videoDetails.userDetails
              };
            }
            return null;
          }).filter(Boolean);

          setLikedVideos(transformedVideos);
          setLastUpdated(new Date());
        } else {
          setLikedVideos([]);
        }
      } catch (err) {
        setError('Failed to load liked videos');
        setLikedVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedVideos();
  }, [isAuthenticated, user]);

  const filtered = likedVideos.filter(v =>
    !search || v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.channelName?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Unauthenticated ───────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8"
        style={{ background: '#221610' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(236,91,19,0.15)', boxShadow: '0 0 40px rgba(236,91,19,0.2)' }}>
            <ThumbsUp className="w-10 h-10" style={{ color: '#ec5b13' }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Sign in to see liked videos</h2>
          <p className="mb-6" style={{ color: '#94a3b8' }}>Videos you like will appear here.</p>
          <button onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.35)' }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ background: '#221610' }}>
        {/* Sticky header skeleton */}
        <div className="h-16 rounded-2xl mb-8 animate-pulse"
          style={{ background: 'rgba(45,30,22,0.6)' }} />
        <div className="h-10 w-56 rounded-xl mb-2 animate-pulse"
          style={{ background: 'rgba(45,30,22,0.6)' }} />
        <div className="h-5 w-40 rounded mb-8 animate-pulse"
          style={{ background: 'rgba(45,30,22,0.4)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video rounded-xl mb-3"
                style={{ background: 'rgba(45,30,22,0.6)' }} />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full shrink-0"
                  style={{ background: 'rgba(45,30,22,0.6)' }} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 rounded" style={{ background: 'rgba(45,30,22,0.6)' }} />
                  <div className="h-3 w-2/3 rounded" style={{ background: 'rgba(45,30,22,0.4)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: '#221610' }}>
      {/* Sticky frosted header */}
      <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between gap-6"
        style={{
          background: 'rgba(34,22,16,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(236,91,19,0.1)'
        }}>
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search your liked videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-full pl-11 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'rgba(236,91,19,0.06)',
              border: '1px solid rgba(236,91,19,0.12)',
              color: '#f1f5f9',
            }}
            onFocus={e => {
              e.target.style.border = '1px solid rgba(236,91,19,0.5)';
              e.target.style.boxShadow = '0 0 0 3px rgba(236,91,19,0.08)';
            }}
            onBlur={e => {
              e.target.style.border = '1px solid rgba(236,91,19,0.12)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border"
            style={{
              background: 'rgba(236,91,19,0.15)',
              color: '#ec5b13',
              borderColor: 'rgba(236,91,19,0.3)'
            }}>
            {user?.fullName?.[0]?.toUpperCase() || user?.userName?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm font-medium"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5'
            }}>
            {error}
          </div>
        )}

        {/* Page title + actions */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white mb-2">Liked Videos</h2>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(236,91,19,0.7)' }}>
              <span>{likedVideos.length} Video{likedVideos.length !== 1 ? 's' : ''}</span>
              {lastUpdated && (
                <>
                  <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#64748b' }} />
                  <span>Updated {formatTimeAgo(lastUpdated)}</span>
                </>
              )}
            </div>
          </div>
          {likedVideos.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => filtered[0] && onVideoSelect && onVideoSelect(filtered[0])}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.3)' }}>
                <Play className="w-5 h-5" fill="white" />
                Play All
              </button>
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors"
                style={{ background: 'rgba(236,91,19,0.1)', color: '#ec5b13', border: '1px solid rgba(236,91,19,0.15)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}>
                <Shuffle className="w-5 h-5" />
                Shuffle
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[380px]">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
              style={{ background: 'rgba(236,91,19,0.1)', boxShadow: '0 0 60px rgba(236,91,19,0.15)' }}>
              <ThumbsUp className="w-12 h-12" style={{ color: '#ec5b13' }} />
              <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-lg font-black"
                style={{ background: '#ec5b13' }}>+</span>
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              {search ? 'No results found' : 'No liked videos yet'}
            </h3>
            <p className="text-sm text-center max-w-xs" style={{ color: '#94a3b8' }}>
              {search
                ? `No liked videos match "${search}"`
                : 'Videos you like will show up here. Start exploring and hit that like button!'}
            </p>
          </div>
        ) : (
          /* Video grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(video => (
              <VideoCardInline
                key={video.id}
                video={video}
                onVideoSelect={onVideoSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedVideos;
