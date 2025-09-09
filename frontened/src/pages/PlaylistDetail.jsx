import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Shuffle, MoreVertical, Trash2, Share, Download, Plus, Lock, Globe } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { videoService } from '../services/videoService';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const PlaylistDetail = ({ onVideoSelect }) => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
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

  const handleRemoveFromPlaylist = async (videoId) => {
    if (!window.confirm('Remove this video from the playlist?')) return;

    try {
      await playlistService.removeVideoFromPlaylist(playlistId, videoId);
      setVideos(prev => prev.filter(video => video._id !== videoId));
      setPlaylist(prev => ({
        ...prev,
        videos: prev.videos.filter(id => id !== videoId)
      }));
      showToast('Video removed from playlist', 'success');
    } catch (error) {
      console.error('Error removing video from playlist:', error);
      showToast('Failed to remove video from playlist', 'error');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm('Are you sure you want to delete this entire playlist? This action cannot be undone.')) {
      return;
    }

    try {
      await playlistService.deletePlaylist(playlistId);
      showToast('Playlist deleted successfully', 'success');
      navigate('/playlists');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Failed to delete playlist', 'error');
    }
  };

  const handleSharePlaylist = async () => {
    try {
      const url = `${window.location.origin}/playlist/${playlistId}`;
      if (navigator.share) {
        await navigator.share({
          title: playlist.name,
          text: playlist.description,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Playlist link copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error sharing playlist:', error);
      showToast('Failed to share playlist', 'error');
    }
  };

  const handlePlayAll = () => {
    if (videos.length > 0) {
      // Navigate to first video with playlist context
      navigate(`/video/${videos[0]._id}?list=${playlistId}&index=0`);
    }
  };

  const handleShufflePlay = () => {
    if (videos.length > 0) {
      const randomIndex = Math.floor(Math.random() * videos.length);
      navigate(`/video/${videos[randomIndex]._id}?list=${playlistId}&index=${randomIndex}`);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view playlists</h2>
          <button
            onClick={() => navigate('/auth')}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Playlist not found</h2>
          <button
            onClick={() => navigate('/playlists')}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content Container */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Playlist Info */}
        <div className="lg:w-1/3 xl:w-1/4 bg-gradient-to-b from-blue-600 to-purple-700 text-white">
          <div className="p-6">
            {/* Back Button */}
            <button
              onClick={() => navigate('/playlists')}
              className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to playlists
            </button>

            {/* Playlist Thumbnail */}
            <div className="relative mb-6">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {videos.length > 0 ? (
                  <div className="relative w-full h-full">
                    {/* Main thumbnail area */}
                    {videos[0].thumbnail ? (
                      <img 
                        src={videos[0].thumbnail} 
                        alt="Playlist thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        {/* Stacked effect for playlist */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-gray-700 rounded transform rotate-1 translate-x-1 translate-y-1"></div>
                          <div className="absolute inset-0 bg-gray-600 rounded transform -rotate-1"></div>
                          <div className="relative bg-gray-500 rounded p-8 flex items-center justify-center">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay gradient for better text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    
                    {/* Video count overlay */}
                    <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-3 py-1 rounded-full flex items-center backdrop-blur-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      {videos.length} video{videos.length !== 1 ? 's' : ''}
                    </div>

                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                         onClick={handlePlayAll}>
                      <div className="bg-red-600 rounded-full p-4 shadow-xl transform scale-90 hover:scale-100 transition-transform">
                        <Play className="w-8 h-8 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-60" />
                      <p className="text-sm">No videos yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Playlist Info */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2 line-clamp-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-white/80 text-sm mb-4 line-clamp-3">{playlist.description}</p>
              )}
              
              <div className="flex items-center text-sm text-white/70 mb-4">
                {playlist.isPrivate ? (
                  <><Lock className="w-4 h-4 mr-1" /> Private</>
                ) : (
                  <><Globe className="w-4 h-4 mr-1" /> Public</>
                )}
                <span className="mx-2">•</span>
                <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handlePlayAll}
                disabled={videos.length === 0}
                className="w-full bg-white text-gray-900 py-3 px-4 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Play all
              </button>
              
              <button
                onClick={handleShufflePlay}
                disabled={videos.length === 0}
                className="w-full bg-white/10 text-white py-3 px-4 rounded-full font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-white/20"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle
              </button>
            </div>

            {/* Options */}
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center text-white/80 hover:text-white transition-colors"
              >
                <MoreVertical className="w-5 h-5 mr-2" />
                More options
              </button>
              
              {showOptions && (
                <div className="absolute top-8 left-0 bg-white rounded-lg shadow-lg py-2 min-w-48 z-10">
                  <button
                    onClick={handleSharePlaylist}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Share className="w-4 h-4 mr-3" />
                    Share playlist
                  </button>
                  
                  {user && playlist.owner === user._id && (
                    <button
                      onClick={handleDeletePlaylist}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      Delete playlist
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Video List */}
        <div className="flex-1 lg:w-2/3 xl:w-3/4">
          <div className="p-6">
            {videosLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading videos...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos in this playlist</h3>
                <p className="text-gray-600 mb-6">Add videos to this playlist to see them here</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
                >
                  Browse Videos
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {videos.map((video, index) => (
                  <div
                    key={video._id}
                    className={`flex items-start p-3 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors relative ${
                      index === currentVideoIndex ? 'bg-gray-50 border-l-4 border-red-600' : ''
                    }`}
                    onClick={() => handleVideoClick(video, index)}
                  >
                    {/* Current video indicator */}
                    {index === currentVideoIndex && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                    )}

                    {/* Video Index */}
                    <div className="w-8 flex items-center justify-center mr-3 text-gray-500">
                      {index === currentVideoIndex ? (
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <Play className="w-2.5 h-2.5 text-white fill-current" />
                        </div>
                      ) : (
                        <>
                          <span className="group-hover:hidden text-sm">{index + 1}</span>
                          <Play className="w-4 h-4 hidden group-hover:block text-gray-600" />
                        </>
                      )}
                    </div>

                    {/* Video Thumbnail */}
                    <div className="relative flex-shrink-0">
                      <div className="w-40 h-24 bg-gray-200 rounded overflow-hidden">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Play className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                      
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-2">
                          <Play className="w-4 h-4 text-gray-900 fill-current" />
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 ml-4 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 text-sm leading-5">
                        {video.title}
                      </h3>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p className="line-clamp-1 text-gray-700 hover:text-gray-900 cursor-pointer">
                          {video.owner?.fullName || 'Unknown Channel'}
                        </p>
                        <div className="flex items-center text-gray-500">
                          <span>{(video.views || 0).toLocaleString()} views</span>
                          <span className="mx-1.5">•</span>
                          <span>{formatTimeAgo(video.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {user && playlist.owner === user._id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromPlaylist(video._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all ml-2"
                        title="Remove from playlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
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
