import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Shuffle, Heart, MoreHorizontal, Clock, ListVideo } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { videoService } from '../services/videoService';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import PageLoader from '../components/PageLoader';

const PlaylistDetail = ({ onVideoSelect }) => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (playlistId && isLoggedIn) {
      fetchPlaylistDetails();
    }
  }, [playlistId, isLoggedIn]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      const response = await playlistService.getPlaylistById(playlistId);
      
      if (response && response.data) {
        setPlaylist(response.data);
        
        // Fetch videos that are in this playlist
        if (response.data.videos && response.data.videos.length > 0) {
          await fetchPlaylistVideos(response.data.videos);
        } else {
          setVideos([]);
        }
      } else {
        showToast('Playlist not found', 'error');
        navigate('/playlists');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      showToast('Failed to load playlist', 'error');
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistVideos = async (videoIds) => {
    try {
      setVideosLoading(true);
      // Fetch details for each video in the playlist
      const videoPromises = videoIds.map(async (videoId) => {
        try {
          const videoResponse = await videoService.getVideoById(videoId);
          return videoResponse.data;
        } catch (error) {
          console.error(`Error fetching video ${videoId}:`, error);
          return null;
        }
      });

      const videoResults = await Promise.all(videoPromises);
      // Filter out any null results (videos that failed to load)
      const validVideos = videoResults.filter(video => video !== null);
      setVideos(validVideos);
    } catch (error) {
      console.error('Error fetching playlist videos:', error);
      showToast('Failed to load playlist videos', 'error');
    } finally {
      setVideosLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (videos.length > 0) {
      // Navigate to first video with playlist context
      navigate(`/video/${videos[0]._id}?list=${playlistId}&index=0`);
    }
  };

  const handleVideoClick = (video, index) => {
    setCurrentVideoIndex(index);
    navigate(`/video/${video._id}?list=${playlistId}&index=${index}`);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const totalSeconds = Math.floor(Number(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const uploadDate = new Date(date);
    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Sign in to view playlists</h2>
          <button
            onClick={() => navigate('/auth')}
            className="text-white px-6 py-2 rounded-xl font-bold"
            style={{ background: '#ec5b13' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 w-full bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Loading playlist..." />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Playlist not found</h2>
          <button
            onClick={() => navigate('/playlists')}
            className="text-white px-6 py-2 rounded-xl font-bold"
            style={{ background: '#ec5b13' }}
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  const coverImage = videos.length > 0 ? videos[0].thumbnail : null;
  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const formatViews = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#f1f5f9' }}>
      {/* Cinematic Playlist Header */}
      <section
        className="relative px-6 md:px-10 pt-10 pb-8"
        style={{
          background: coverImage
            ? `linear-gradient(to bottom, rgba(236,91,19,0.18) 0%, rgba(8,8,8,0) 100%)`
            : `linear-gradient(to bottom, rgba(236,91,19,0.12) 0%, rgba(8,8,8,0) 100%)`,
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/playlists')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Playlists
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-end">
          {/* Cover art */}
          <div className="relative group shrink-0">
            <div
              className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 60px rgba(236,91,19,0.15)' }}
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={playlist.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'rgba(18,18,18,0.8)' }}
                >
                  <ListVideo className="w-16 h-16" style={{ color: '#ec5b13', opacity: 0.6 }} />
                </div>
              )}
              {/* Hover play overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.45)' }}
                onClick={handlePlayAll}
              >
                <Play className="w-16 h-16 text-white fill-white drop-shadow-xl" />
              </div>
            </div>
          </div>

          {/* Playlist info */}
          <div className="flex-1">
            <span
              className="text-xs font-bold uppercase tracking-[0.2em] mb-3 block"
              style={{ color: '#ec5b13' }}
            >
              {playlist.isPublic === false ? 'Private Playlist' : 'Public Playlist'}
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-slate-100">
              {playlist.name}
            </h2>
            {playlist.description && (
              <p className="text-slate-400 text-sm mb-4 max-w-xl line-clamp-2">{playlist.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-400">
              {user && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#ec5b13' }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      user.fullName?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="text-slate-100">{user.fullName}</span>
                </div>
              )}
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
              {totalViews > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{formatViews(totalViews)} views</span>
                </>
              )}
              {playlist.updatedAt && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>Updated {formatTimeAgo(playlist.updatedAt)}</span>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={handlePlayAll}
                disabled={videos.length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#ec5b13', boxShadow: '0 8px 24px rgba(236,91,19,0.25)' }}
              >
                <Play className="w-5 h-5 fill-white" />
                Play All
              </button>
              <button
                onClick={() => {
                  if (videos.length > 0) {
                    const idx = Math.floor(Math.random() * videos.length);
                    navigate(`/video/${videos[idx]._id}?list=${playlistId}&index=${idx}`);
                  }
                }}
                disabled={videos.length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <Shuffle className="w-5 h-5" />
                Shuffle
              </button>
              <button
                className="p-3.5 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <Heart className="w-5 h-5" />
              </button>
              <button
                className="p-3.5 rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 2.5rem' }} />

      {/* Video List */}
      <section className="px-6 md:px-10 py-6">
        {videosLoading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: '#ec5b13', borderTopColor: 'transparent' }}
            />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(236,91,19,0.1)', border: '1px solid rgba(236,91,19,0.2)' }}
            >
              <ListVideo className="w-10 h-10" style={{ color: '#ec5b13' }} />
            </div>
            <h3 className="text-xl font-bold text-slate-100">No videos in this playlist</h3>
            <p className="text-slate-500 text-sm">Add videos while browsing and they'll appear here.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm"
              style={{ background: '#ec5b13' }}
            >
              Browse Videos
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-separate" style={{ borderSpacing: '0 4px' }}>
              <thead>
                <tr
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: '#64748b' }}
                >
                  <th className="w-12 px-4 py-3">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3 hidden md:table-cell">Creator</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Date Added</th>
                  <th className="w-24 px-4 py-3 text-right">
                    <Clock className="w-4 h-4 inline-block" />
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {videos.map((video, index) => (
                  <tr
                    key={video._id}
                    className="group cursor-pointer transition-all"
                    style={{ borderRadius: '0.75rem' }}
                    onClick={() => handleVideoClick(video, index)}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background =
                        index === currentVideoIndex ? 'rgba(236,91,19,0.08)' : 'transparent';
                    }}
                  >
                    {/* # */}
                    <td
                      className="px-4 py-3 rounded-l-xl font-medium"
                      style={{ color: index === currentVideoIndex ? '#ec5b13' : '#64748b' }}
                    >
                      {index === currentVideoIndex ? (
                        <Play className="w-4 h-4 fill-current" style={{ color: '#ec5b13' }} />
                      ) : (
                        <span className="group-hover:hidden">{index + 1}</span>
                      )}
                      {index !== currentVideoIndex && (
                        <Play className="w-4 h-4 hidden group-hover:block text-slate-400" />
                      )}
                    </td>

                    {/* Title + thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: 'rgba(18,18,18,0.8)' }}
                            >
                              <Play className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          {/* Hover play overlay */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ background: 'rgba(0,0,0,0.55)' }}
                          >
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                          {/* Duration badge */}
                          {video.duration && (
                            <div className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 rounded text-[9px] font-bold text-white">
                              {formatDuration(video.duration)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-bold text-slate-100 line-clamp-1 leading-tight transition-colors"
                            style={index === currentVideoIndex ? { color: '#ec5b13' } : {}}
                          >
                            {video.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {(video.views || 0).toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Creator */}
                    <td className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">
                      {video.owner?.fullName || '—'}
                    </td>

                    {/* Date added */}
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                      {video.createdAt
                        ? new Date(video.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 rounded-r-xl text-right text-slate-500 tabular-nums">
                      {formatDuration(video.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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

export default PlaylistDetail;
