import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Clock, Bookmark, Download, Share, Flag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import watchLaterService from '../services/watchLaterService';
import { downloadService } from '../services/downloadService';
import Toast from './Toast';
import AddToPlaylistModal from './AddToPlaylistModal';

const VideoCard = ({ video, onVideoSelect }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [isWatchLaterLoading, setIsWatchLaterLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if video is in watch later list
  useEffect(() => {
    const checkWatchLaterStatus = async () => {
      if (!isLoggedIn) {
        setIsInWatchLater(false);
        return;
      }

      try {
        const videoId = video.id || video._id;
        if (!videoId) {
          setIsInWatchLater(false);
          return;
        }
        
        // Use the simpler endpoint that just returns IDs
        const response = await watchLaterService.getWatchLaterIds();
        if (response && response.data) {
          const watchLaterIds = response.data;
          const isInList = watchLaterIds.includes(videoId);
          console.log(`Video ${videoId} in watch later:`, isInList);
          setIsInWatchLater(isInList);
        } else {
          setIsInWatchLater(false);
        }
      } catch (error) {
        console.error('Error checking watch later status:', error);
        setIsInWatchLater(false);
      }
    };

    checkWatchLaterStatus();
  }, [video, isLoggedIn]);

  const handleImageError = () => {
    setImageError(true);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleVideoClick = () => {
    if (onVideoSelect) {
      onVideoSelect(video.id || video._id);
    } else {
      navigate(`/video/${video.id || video._id}`);
    }
  };

  const handleChannelClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${video.owner?.userName || video.ownerDetails?.userName}`);
  };

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Helper function to refresh watch later status
  const refreshWatchLaterStatus = async () => {
    if (!isLoggedIn) return;

    try {
      const videoId = video.id || video._id;
      if (!videoId) return;

      const response = await watchLaterService.getWatchLaterIds();
      if (response && response.data) {
        const watchLaterIds = response.data;
        const isInList = watchLaterIds.includes(videoId);
        setIsInWatchLater(isInList);
      }
    } catch (error) {
      console.error('Error refreshing watch later status:', error);
    }
  };

  const handleSaveToWatchLater = async (e) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      showToast('Please log in to save videos', 'error');
      return;
    }

    setIsWatchLaterLoading(true);
    
    try {
      const videoId = video.id || video._id;
      if (!videoId) {
        showToast('Invalid video ID', 'error');
        return;
      }

      console.log('Attempting to toggle watch later for video:', videoId);

      if (isInWatchLater) {
        // Remove from watch later
        const response = await watchLaterService.removeFromWatchLater(videoId);
        console.log('Remove response:', response);
        showToast('Video removed from Watch Later!', 'success');
        setIsInWatchLater(false);
      } else {
        // Add to watch later
        const response = await watchLaterService.addToWatchLater(videoId);
        console.log('Add response:', response);
        showToast('Video added to Watch Later!', 'success');
        setIsInWatchLater(true);
      }

      // Refresh status to ensure consistency
      setTimeout(() => {
        refreshWatchLaterStatus();
      }, 1000);

    } catch (error) {
      console.error('Error toggling watch later:', error);
      
      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update Watch Later list';
      
      // If video is already in watch later, update the state to reflect this
      if (errorMessage.includes('already in watch later')) {
        console.log('Video already in watch later, updating state');
        setIsInWatchLater(true);
        showToast('Video is already in Watch Later', 'info');
      } 
      // If video is not found in watch later (when trying to remove), update state
      else if (errorMessage.includes('not found in watch later')) {
        console.log('Video not in watch later, updating state');
        setIsInWatchLater(false);
        showToast('Video was not in Watch Later', 'info');
      }
      else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsWatchLaterLoading(false);
      setShowDropdown(false);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const videoId = video.id || video._id;
      await downloadService.downloadVideo(videoId);
      showToast('Download started!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download failed', 'error');
    }
    setShowDropdown(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      const videoUrl = `${window.location.origin}/video/${video.id || video._id}`;
      await navigator.clipboard.writeText(videoUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      console.error('Share error:', error);
      showToast('Failed to copy link', 'error');
    }
    setShowDropdown(false);
  };

  const handleReport = (e) => {
    e.stopPropagation();
    // Implement report functionality
    showToast('Report submitted', 'info');
    setShowDropdown(false);
  };

  // Fallback image
  const thumbnailSrc = imageError || !video.thumbnail 
    ? `https://picsum.photos/320/180?random=${video.id || video._id}`
    : video.thumbnail;

  const channelName = video.owner?.fullName || video.ownerDetails?.fullName || 'Unknown Channel';
  const channelAvatar = video.owner?.avatar || video.ownerDetails?.avatar;

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-gray-200" onClick={handleVideoClick}>
        <img
          src={thumbnailSrc}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 
              className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 cursor-pointer hover:text-gray-700 transition-colors"
              onClick={handleVideoClick}
              title={video.title}
            >
              {video.title}
            </h3>

            {/* Channel Info */}
            <div className="flex items-center mb-2">
              {channelAvatar && (
                <img
                  src={channelAvatar}
                  alt={channelName}
                  className="w-6 h-6 rounded-full mr-2 cursor-pointer hover:opacity-80"
                  onClick={handleChannelClick}
                />
              )}
              <p 
                className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                onClick={handleChannelClick}
              >
                {channelName}
              </p>
            </div>

            {/* Video Stats */}
            <div className="flex items-center text-xs text-gray-500 space-x-2">
              <span>{formatViews(video.views || 0)} views</span>
              <span>•</span>
              <span>{formatTimeAgo(video.createdAt || video.uploadDate)}</span>
            </div>
          </div>

          {/* Three-dot menu positioned in bottom right of info section */}
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={handleDropdownToggle}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
            >
              <MoreVertical size={16} className="text-gray-600" />
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
                <button
                  onClick={handleSaveToWatchLater}
                  disabled={isWatchLaterLoading}
                  className={`w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${
                    isWatchLaterLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Bookmark className="w-4 h-4 mr-3" />
                  {isWatchLaterLoading 
                    ? 'Processing...' 
                    : isInWatchLater 
                      ? 'Remove from Watch Later' 
                      : 'Save to Watch Later'
                  }
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylistModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Add to Playlist
                </button>
                
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Download
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Share className="w-4 h-4 mr-3" />
                  Share
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={handleReport}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Flag className="w-4 h-4 mr-3" />
                  Report
                </button>
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

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={video.id || video._id}
        videoTitle={video.title}
      />
    </div>
  );
};

export default VideoCard;
