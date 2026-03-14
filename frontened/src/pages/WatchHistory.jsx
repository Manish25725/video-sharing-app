import React, { useState, useEffect, useMemo } from 'react';
import { History, Trash2, Play, Search, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import watchHistoryService from '../services/watchHistoryService';
import { useAuth } from '../contexts/AuthContext';
import { formatDuration, formatViews } from '../utils/formatters';
import PageLoader from '../components/PageLoader';

const WatchHistory = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchWatchHistory();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  const fetchWatchHistory = async () => {
    try {
      setLoading(true);
      const response = await watchHistoryService.getWatchHistory();
      if (response && response.data && response.data.length > 0) {
        const historyVideos = response.data.map(item => ({
          id: item.videoDetail._id,
          title: item.videoDetail.title,
          description: item.videoDetail.description,
          thumbnail: item.videoDetail.thumbnail,
          duration: item.videoDetail.duration,
          views: item.videoDetail.views,
          createdAt: item.videoDetail.createdAt,
          owner: {
            id: item.videoDetail.owner._id,
            userName: item.videoDetail.owner.userName,
            fullName: item.videoDetail.owner.fullName,
            avatar: item.videoDetail.owner.avatar,
          },
          watchedAt: item.watchedAt,
        }));
        historyVideos.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
        setWatchHistory(historyVideos);
      } else {
        setWatchHistory([]);
      }
    } catch (error) {
      showToast('Failed to load watch history', 'error');
      setWatchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  const handleClearHistory = () => {
    setWatchHistory([]);
    showToast('Watch history cleared', 'success');
  };

  const getDateGroup = (timestamp) => {
    const now = new Date();
    const diffDays = Math.floor((now - new Date(timestamp)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'This Week';
    return 'Older';
  };

  const getDateLabel = (group) => {
    const now = new Date();
    if (group === 'Today') return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (group === 'Yesterday') {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return y.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
    return group;
  };

  const formatWatchTime = (timestamp) => {
    const diffH = Math.floor((Date.now() - new Date(timestamp)) / (1000 * 60 * 60));
    const diffM = Math.floor((Date.now() - new Date(timestamp)) / (1000 * 60));
    if (diffM < 1) return 'Just now';
    if (diffH < 1) return `Watched ${diffM}m ago`;
    if (diffH < 24) return `Watched ${diffH} hour${diffH !== 1 ? 's' : ''} ago`;
    return 'Watched yesterday';
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return watchHistory;
    const q = searchQuery.toLowerCase();
    return watchHistory.filter(v =>
      v.title.toLowerCase().includes(q) || v.owner.fullName.toLowerCase().includes(q)
    );
  }, [watchHistory, searchQuery]);

  const groupedHistory = useMemo(() => {
    const order = ['Today', 'Yesterday', 'This Week', 'Older'];
    const groups = {};
    filteredHistory.forEach(video => {
      const g = getDateGroup(video.watchedAt);
      if (!groups[g]) groups[g] = [];
      groups[g].push(video);
    });
    return order.filter(g => groups[g]).map(g => ({ label: g, videos: groups[g] }));
  }, [filteredHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Loading watch history..." />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div style={{ background: '#141414' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(236,91,19,0.1)' }}>
            <History className="w-10 h-10" style={{ color: '#ec5b13' }} />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Sign in to view History</h3>
          <p className="text-slate-400 text-sm">Your watch history will appear here once you're logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#141414' }} className="min-h-screen relative overflow-x-hidden">
      {/* Ambient background blob */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none -mr-48 -mt-48"
        style={{ background: 'rgba(236,91,19,0.05)', filter: 'blur(100px)' }}
      />

      {/* Header */}
      {/* Content */}
      <div className="px-8 pb-12">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(236,91,19,0.1)' }}>
              <History className="w-10 h-10" style={{ color: '#ec5b13' }} />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              {searchQuery ? 'No results found' : 'No watch history'}
            </h3>
            <p className="text-slate-400 text-sm">
              {searchQuery ? 'Try a different search term' : 'Videos you watch will appear here'}
            </p>
          </div>
        ) : (
          groupedHistory.map(({ label, videos }) => (
            <div key={label} className="mt-8">
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-slate-100 whitespace-nowrap">{label}</h3>
                <div
                  className="h-px flex-1 rounded-full"
                  style={{ background: 'linear-gradient(to right, rgba(236,91,19,0.25), transparent)' }}
                />
                <span className="text-sm text-slate-500 font-medium whitespace-nowrap">{getDateLabel(label)}</span>
              </div>

              {/* Video grid */}
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity"
                style={{ opacity: label === 'Today' ? 1 : 0.82 }}
              >
                {videos.map(video => (
                  <div
                    key={`${video.id}-${video.watchedAt}`}
                    className="group cursor-pointer"
                    onClick={() => handleVideoClick(video.id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video mb-3 shadow-lg">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      {/* Duration badge */}
                      <div
                        className="absolute bottom-3 right-3 text-white text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(6px)' }}
                      >
                        {formatDuration(video.duration)}
                      </div>
                      {/* Hover overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(236,91,19,0.18)' }}
                      >
                        <Play className="w-14 h-14 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex gap-3">
                      {/* Channel avatar */}
                      <div
                        className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border"
                        style={{ borderColor: 'rgba(236,91,19,0.2)' }}
                      >
                        {video.owner.avatar ? (
                          <img src={video.owner.avatar} alt={video.owner.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: '#ec5b13' }}
                          >
                            {video.owner.fullName?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-bold text-sm line-clamp-2 leading-tight text-slate-100 group-hover:text-primary transition-colors"
                          style={{ '--tw-text-opacity': 1 }}
                        >
                          {video.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {video.owner.fullName} • {formatViews(video.views)}
                        </p>
                        {label === 'Today' && (
                          <p className="text-xs mt-1 font-bold" style={{ color: '#ec5b13' }}>
                            {formatWatchTime(video.watchedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Load more */}
        {filteredHistory.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 text-slate-400 hover:text-primary transition-all text-sm"
              style={{ border: '1px solid rgba(236,91,19,0.2)' }}
            >
              View Older History
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl"
          style={{ background: toast.type === 'error' ? '#ef4444' : '#ec5b13' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default WatchHistory;