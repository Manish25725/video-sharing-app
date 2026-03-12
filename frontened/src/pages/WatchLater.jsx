import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Play, Search, X, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import watchLaterService from '../services/watchLaterService';
import { transformVideosArray } from '../services/videoService';
import Toast from '../components/Toast';
import { formatDuration, formatViews, formatTimeAgo } from '../utils/formatters';

const WatchLater = () => {
  const navigate = useNavigate();
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    fetchWatchLaterVideos();
  }, []);

  const fetchWatchLaterVideos = async () => {
    try {
      setLoading(true);
      const response = await watchLaterService.getWatchLaterVideos();
      if (response && response.data && response.data.length > 0) {
        const transformedVideos = transformVideosArray(response.data);
        setWatchLaterVideos(transformedVideos);
      } else {
        setWatchLaterVideos([]);
      }
    } catch (error) {
      console.error('Error fetching watch later videos:', error);
      showToast('Failed to load watch later videos', 'error');
      setWatchLaterVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchLater = async (videoId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await watchLaterService.removeFromWatchLater(videoId);
      setWatchLaterVideos(prev => prev.filter(video => video.id !== videoId));
      showToast('Video removed from Watch Later', 'success');
    } catch (error) {
      console.error('Error removing from watch later:', error);
      showToast('Failed to remove video', 'error');
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(watchLaterVideos.map(v => watchLaterService.removeFromWatchLater(v.id)));
      setWatchLaterVideos([]);
      showToast('Watch Later cleared', 'success');
    } catch (error) {
      showToast('Failed to clear Watch Later', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const filteredVideos = watchLaterVideos.filter(video => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (video.title || '').toLowerCase().includes(q) ||
      (video.owner?.fullName || '').toLowerCase().includes(q)
    );
  });

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = filteredVideos.length > visibleCount;

  const tabs = [
    { id: 'all', label: 'All Videos' },
    { id: 'live', label: 'Live Streams' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: '#ec5b13', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-400 text-sm">Loading Watch Later...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#f1f5f9' }}>
      {/* Scrollable Content */}
      <div className="px-6 md:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-100">Watch Later</h2>
            <p className="text-slate-400 mt-1">Your saved videos, ready to watch whenever you are.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {watchLaterVideos.length} video{watchLaterVideos.length !== 1 ? 's' : ''}
            </span>
            {watchLaterVideos.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'rgba(236,91,19,0.1)', border: '1px solid rgba(236,91,19,0.2)', color: '#ec5b13' }}
                onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#ec5b13', color: '#fff' })}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(236,91,19,0.1)', color: '#ec5b13' })}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-4 text-sm transition-colors"
              style={
                activeTab === tab.id
                  ? { color: '#ec5b13', fontWeight: 700, borderBottom: '2px solid #ec5b13' }
                  : { color: '#64748b', fontWeight: 500 }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(236,91,19,0.1)', border: '1px solid rgba(236,91,19,0.2)' }}
            >
              <Clock className="w-10 h-10" style={{ color: '#ec5b13' }} />
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              {search ? 'No results found' : 'Watch Later is empty'}
            </h3>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              {search
                ? `No videos match "${search}"`
                : "Save videos while browsing and they'll show up here."}
            </p>
          </div>
        ) : (
          <>
            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleVideos.map(video => (
                <div
                  key={video.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-video rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(20,20,20,0.4)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-slate-600" />
                      </div>
                    )}
                    {/* Hover play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Play className="w-14 h-14 text-white drop-shadow-lg fill-white" />
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                      {formatDuration(video.duration)}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemoveFromWatchLater(video.id, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                      title="Remove from Watch Later"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Info row */}
                  <div className="mt-3 flex gap-3">
                    {/* Channel avatar */}
                    <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-slate-800">
                      {video.owner?.avatar ? (
                        <img
                          src={video.owner.avatar}
                          alt={video.owner?.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: '#ec5b13' }}
                        >
                          {video.owner?.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-tight group-hover:text-[#ec5b13] transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {video.owner?.fullName}
                        {video.views ? ` • ${formatViews(video.views)} views` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">
                        {video.createdAt ? `Saved ${formatTimeAgo(video.createdAt)}` : 'Saved'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-12">
                <button
                  onClick={() => setVisibleCount(c => c + 8)}
                  className="px-10 py-3 rounded-full text-sm font-bold text-slate-300 hover:text-[#ec5b13] transition-all"
                  style={{ background: 'rgba(12,12,12,1)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(236,91,19,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default WatchLater;
