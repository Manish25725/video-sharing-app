import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Clock, Bookmark, Download, Share, Flag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import watchLaterService from '../services/watchLaterService';
import { downloadService } from '../services/downloadService';
import Toast from './Toast';
import AddToPlaylistModal from './AddToPlaylistModal';
import ReportModal from './ReportModal';
import './VideoCard.css';
import './VideoCard.css';

const VideoCard = ({ video, onVideoSelect }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [isWatchLaterLoading, setIsWatchLaterLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
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

  const getOwnerId = () => {
    if (typeof video.owner === 'string') return video.owner;
    if (typeof video.ownerDetails === 'string') return video.ownerDetails;

    return (
      video.owner?._id ||
      video.owner?.id ||
      video.ownerDetails?._id ||
      video.ownerDetails?.id ||
      video.ownerId ||
      video.channelId ||
      video.userId ||
      video.user?._id ||
      video.user?.id ||
      null
    );
  };

  const handleVideoClick = () => {
    const videoId = video.id || video._id;
    if (onVideoSelect) {
      onVideoSelect(videoId);
    } else if (videoId) {
      navigate(`/video/${videoId}`);
    }
  };

  const handleChannelClick = (e) => {
    e.stopPropagation();
    const ownerId = getOwnerId();
    if (ownerId) {
      navigate(`/profile/${ownerId}`);
    }
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


      if (isInWatchLater) {
        // Remove from watch later
        const response = await watchLaterService.removeFromWatchLater(videoId);
        showToast('Video removed from Watch Later!', 'success');
        setIsInWatchLater(false);
      } else {
        // Add to watch later
        const response = await watchLaterService.addToWatchLater(videoId);
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
        setIsInWatchLater(true);
        showToast('Video is already in Watch Later', 'info');
      } 
      // If video is not found in watch later (when trying to remove), update state
      else if (errorMessage.includes('not found in watch later')) {
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
    setShowReportModal(true);
    setShowDropdown(false);
  };

  // Fallback image
  const thumbnailSrc = imageError || !video.thumbnail 
    ? `https://picsum.photos/320/180?random=${video.id || video._id}`
    : video.thumbnail;

  const channelName =
    video.owner?.fullName ||
    video.owner?.userName ||
    video.ownerDetails?.fullName ||
    video.ownerDetails?.userName ||
    video.channelName ||
    'Unknown Channel';
  const channelAvatar = video.owner?.avatar || video.ownerDetails?.avatar || video.channelAvatar;
  const channelOwnerId = getOwnerId();

  return (
    <div className="group cursor-pointer relative video-card-container" style={{ transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)', overflow: 'visible' }}>
      {/* Video Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-[#1c120d]" onClick={handleVideoClick}>
        <img
          src={thumbnailSrc}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 text-white flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white backdrop-blur-sm">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex gap-3 video-card-info" style={{ overflow: 'visible', position: 'relative' }}>
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[#1c120d] overflow-hidden">
          {channelAvatar ? (
            <button
              type="button"
              className="w-full h-full cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default"
              onClick={handleChannelClick}
              disabled={!channelOwnerId}
            >
              <img
                src={channelAvatar}
                alt={channelName}
                className="w-full h-full object-cover rounded-full"
              />
            </button>
          ) : (
            <button
              type="button"
              className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold bg-[#1c120d] cursor-pointer"
              onClick={handleChannelClick}
              disabled={!channelOwnerId}
            >
              {(channelName || "?")[0].toUpperCase()}
            </button>
          )}
        </div>

        <div className="flex items-start justify-between flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4
              className="font-bold text-sm line-clamp-2 text-slate-100 group-hover:text-[#ec5b13] transition-colors cursor-pointer"
              onClick={handleVideoClick}
              title={video.title}
            >
              {video.title}
            </h4>

            {/* Channel Info */}
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              <button
                type="button"
                className="hover:text-slate-300 transition-colors disabled:cursor-default disabled:hover:text-slate-500"
                onClick={handleChannelClick}
                disabled={!channelOwnerId}
              >
                {channelName}
              </button>
            </p>

            {/* Video Stats */}
            <p className="text-[11px] text-slate-600">
              {formatViews(video.views || 0)} views
              <span> • </span>
              {formatTimeAgo(video.createdAt || video.uploadDate)}
            </p>
          </div>

          {/* Three-dot menu positioned in bottom right of info section */}
          <div className="relative ml-2 dropdown-menu-container" ref={dropdownRef}>
            <button
              onClick={handleDropdownToggle}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity"
            >
              <MoreVertical size={16} className="text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-8 w-56 bg-[#18110D] rounded-xl shadow-2xl border border-white/5 z-[9999] py-2 test-dropdown-menu max-h-none overflow-visible"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  minWidth: '220px',
                  maxHeight: 'none'
                }}
              >
                <button
                  onClick={handleSaveToWatchLater}
                  disabled={isWatchLaterLoading}
                  className={`w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors ${
                    isWatchLaterLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Bookmark className="w-5 h-5 mr-3 text-slate-400" />
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
                  className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-3 text-slate-400" />
                  Add to Playlist
                </button>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                >
                  <Download className="w-5 h-5 mr-3 text-slate-400" />
                  Download
                </button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                >
                  <Share className="w-5 h-5 mr-3 text-slate-400" />
                  Share
                </button>

                <hr className="my-1.5 border-white/5" />

                <button
                  onClick={handleReport}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Flag className="w-5 h-5 mr-3 text-red-500/70" />
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

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="video"
        targetId={video.id || video._id}
        onSuccess={() => showToast('Report submitted. Thank you!', 'success')}
      />
    </div>
  );
};

export default VideoCard;
