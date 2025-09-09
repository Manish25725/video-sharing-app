import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Clock, Bookmark, Download, Share, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import watchLaterService from '../services/watchLaterService';
import { downloadService } from '../services/downloadService';
import Toast from './Toast';

const VideoCard = ({ video, onVideoSelect }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [isWatchLaterLoading, setIsWatchLaterLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
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
          // response.data is now just an array of video IDs
          const isInList = response.data.some(watchLaterVideoId => {
            return String(watchLaterVideoId) === String(videoId);
          });
          
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
  }, [isLoggedIn, video.id, video._id]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoClick = () => {
    const videoId = video.id || video._id;
    console.log('Video clicked:', { video, videoId });
    console.log('Video date info:', { 
      uploadTime: video.uploadTime, 
      uploadDate: video.uploadDate, 
      createdAt: video.createdAt 
    });
    
    if (videoId) {
      // Use both navigation methods for better compatibility
      if (onVideoSelect) {
        console.log('Using onVideoSelect with videoId:', videoId);
        onVideoSelect(videoId);
      } else {
        console.log('Using navigate with videoId:', videoId);
        navigate(`/video/${videoId}`);
      }
    } else {
      console.error('Video ID not found:', video);
      alert('Video ID not found. Cannot open video.');
    }
  };

  const handleMoreClick = (e) => {
    e.stopPropagation(); // Prevent video click
    setShowDropdown(!showDropdown);
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  // Helper function to refresh watch later status
  const refreshWatchLaterStatus = async () => {
    if (!isLoggedIn) return;
    
    try {
      const videoId = video.id || video._id;
      if (!videoId) return;
      
      const response = await watchLaterService.getWatchLaterIds();
      if (response && response.data) {
        const isInList = response.data.some(watchLaterVideoId => {
          return String(watchLaterVideoId) === String(videoId);
        });
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
      setShowDropdown(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isWatchLaterLoading) {
      return;
    }

    setIsWatchLaterLoading(true);

    try {
      const videoId = video.id || video._id;
      console.log('Attempting to toggle watch later for video:', videoId);
      console.log('Current isInWatchLater state:', isInWatchLater);
      
      if (isInWatchLater) {
        await watchLaterService.removeFromWatchLater(videoId);
        setIsInWatchLater(false);
        showToast('Video removed from Watch Later!', 'success');
      } else {
        await watchLaterService.addToWatchLater(videoId);
        setIsInWatchLater(true);
        showToast('Video added to Watch Later!', 'success');
      }
      
      // Refresh status after successful operation to ensure accuracy
      setTimeout(() => refreshWatchLaterStatus(), 500);
      
    } catch (error) {
      console.error('Error toggling watch later:', error);
      console.error('Full error object:', error);
      
      // Handle specific error cases
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update Watch Later list';
      
      // If video is already in watch later, update the state to reflect this
      if (errorMessage.includes('already in watch later')) {
        console.log('Video already in watch later, updating state');
        setIsInWatchLater(true);
        showToast('Video is already in Watch Later', 'info');
        // Force refresh the actual status
        refreshWatchLaterStatus();
      } 
      // If trying to remove a video that's not in the list
      else if (errorMessage.includes('not found in watch later')) {
        console.log('Video not in watch later, updating state');
        setIsInWatchLater(false);
        showToast('Video was not in Watch Later', 'info');
        // Force refresh the actual status
        refreshWatchLaterStatus();
      }
      else {
        showToast(errorMessage, 'error');
        // Still refresh in case of other errors to ensure correct state
        refreshWatchLaterStatus();
      }
    } finally {
      setIsWatchLaterLoading(false);
    }
    setShowDropdown(false);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const videoId = video.id || video._id;
      showToast('Download feature coming soon!', 'info');
      // Uncomment when download is ready:
      // await downloadService.downloadVideoWithProgress(video.videoFile, video.title);
    } catch (error) {
      console.error('Error downloading video:', error);
      showToast('Failed to download video', 'error');
    }
    setShowDropdown(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      const videoId = video.id || video._id;
      const shareUrl = `${window.location.origin}/video/${videoId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: `Check out this video: ${video.title}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      showToast('Failed to share video', 'error');
    }
    setShowDropdown(false);
  };

  const handleReport = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to report this video?')) {
      showToast('Report submitted. Thank you for helping keep our platform safe.', 'success');
    }
    setShowDropdown(false);
  };

  return (
    <>
      <div 
        className="cursor-pointer group" 
        onClick={handleVideoClick}
      >
        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3">
          {!imageError && video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title || 'Video thumbnail'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <span className="text-gray-600 text-sm">No thumbnail</span>
            </div>
          )}
          
          <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded flex items-center">
            <Clock size={10} className="mr-1" />
            {formatDuration(video.duration)}
          </span>
        </div>
        
        <div className="flex space-x-3">
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {(video.channel || video.channelName || 'Unknown')[0].toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm leading-5 mb-1 line-clamp-2">
              {video.title || 'Untitled Video'}
            </h3>
            <p className="text-gray-600 text-xs mb-1">
              {video.channelName || video.channel || 'Unknown Channel'}
            </p>
            <div className="flex items-center text-gray-600 text-xs space-x-1">
              <span>{formatViews(video.views)}</span>
              <span>•</span>
              <span>{formatTimeAgo(video.uploadTime || video.uploadDate)}</span>
            </div>
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleMoreClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
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
    </>
  );
};

export default VideoCard;
