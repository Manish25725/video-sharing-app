import React, { useState, useEffect, useMemo } from 'react';
import { History, Trash2, Play, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import watchHistoryService from '../services/watchHistoryService';
import { useAuth } from '../contexts/AuthContext';
import { formatDuration, formatViews } from '../utils/formatters';

const WatchHistory = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [miniPlayer, setMiniPlayer] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (isLoggedIn && user) {
      console.log('=== AUTH STATUS ===');
      console.log('User is logged in:', isLoggedIn);
      console.log('User object:', user);
      fetchWatchHistory();
    } else {
      console.log('=== NOT AUTHENTICATED ===');
      console.log('isLoggedIn:', isLoggedIn);
      console.log('user:', user);
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  const fetchWatchHistory = async () => {
    try {
      setLoading(true);
      console.log('=== WATCH HISTORY DEBUG ===');
      console.log('User logged in:', isLoggedIn);
      console.log('User object:', user);
      console.log('Fetching watch history...');
      
      const response = await watchHistoryService.getWatchHistory();
      console.log('Watch history API response:', response);
      
      // The service already extracts response.data.data, so we use response.data
      if (response && response.data && response.data.length > 0) {
        console.log('Processing watch history data:', response.data);
        
        // The backend returns populated watchHistory with videoDetail
        const historyVideos = response.data.map(item => {
          console.log('Processing watch history item:', item);
          return {
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
              avatar: item.videoDetail.owner.avatar
            },
            watchedAt: item.watchedAt // Using correct field name from user model
          };
        });

        historyVideos.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
        
        console.log('Transformed and sorted watch history:', historyVideos);
        setWatchHistory(historyVideos);
        setMiniPlayer(historyVideos[0] || null);
      } else {
        console.log('No watch history found');
        setWatchHistory([]);
      }
    } catch (error) {
      console.error('Error fetching watch history:', error);
      showToast('Failed to load watch history', 'error');
      setWatchHistory([]);
    } finally {
      setLoading(false);
    }
  };

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
    setMiniPlayer(null);
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
      <div style={{ background: '#221610' }} className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(236,91,19,0.2)', borderTopColor: '#ec5b13' }}
          />
          <p className="text-slate-400 text-sm">Loading watch history...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div style={{ background: '#221610' }} className="min-h-screen flex items-center justify-center">
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
    <div style={{ background: '#221610' }} className="min-h-screen relative">
      {/* Ambient background blob */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none -mr-48 -mt-48"
        style={{ background: 'rgba(236,91,19,0.05)', filter: 'blur(100px)' }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 border-b backdrop-blur-md"
        style={{ borderColor: 'rgba(236,91,19,0.1)', background: 'rgba(34,22,16,0.85)' }}
      >
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-100">
          <History className="w-6 h-6" style={{ color: '#ec5b13' }} />
          Watch History
        </h2>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your watch history..."
              className="w-72 rounded-xl py-2.5 pl-11 pr-4 border outline-none text-slate-100 placeholder-slate-500 text-sm transition-all"
              style={{ background: 'rgba(236,91,19,0.05)', borderColor: 'rgba(236,91,19,0.15)' }}
            />
          </div>
          {/* Clear History */}
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg text-sm"
            style={{ background: '#ec5b13', boxShadow: '0 4px 15px rgba(236,91,19,0.3)' }}
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-8 pb-28">
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
                        style={{ background: 'rgba(34,22,16,0.85)', backdropFilter: 'blur(6px)' }}
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

      {/* Floating Mini Player */}
      {miniPlayer && (
        <div
          className="fixed bottom-8 right-8 z-20 w-80 p-4 rounded-3xl shadow-2xl border cursor-pointer"
          style={{
            background: 'rgba(44,28,21,0.75)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(236,91,19,0.2)',
          }}
        >
          <div className="flex gap-4">
            <div
              className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0"
              style={{ background: 'rgba(26,16,8,0.9)' }}
            >
              <img
                src={miniPlayer.thumbnail}
                alt={miniPlayer.title}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-100">{miniPlayer.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{miniPlayer.owner.fullName}</p>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full w-2/3" style={{ background: '#ec5b13' }} />
              </div>
            </div>
            <div className="flex flex-col justify-between items-end">
              <button
                onClick={e => { e.stopPropagation(); setMiniPlayer(null); }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleVideoClick(miniPlayer.id)}
                style={{ color: '#ec5b13' }}
                className="hover:opacity-80 transition-opacity"
              >
                <Play className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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