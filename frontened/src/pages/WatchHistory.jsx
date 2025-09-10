import React, { useState, useEffect } from 'react';
import { History, Trash2, Play, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import watchHistoryService from '../services/watchHistoryService';
import VideoCard from '../components/VideoCard';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { formatDuration } from '../utils/formatters';

const WatchHistory = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (isLoggedIn && user) {
      console.log('=== AUTH STATUS ===');
      console.log('User is logged in:', isLoggedIn);
      console.log('User object:', user);
      console.log('Access token in localStorage:', localStorage.getItem('accessToken'));
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

        // Sort by watchedAt in descending order (most recent first)
        historyVideos.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
        
        console.log('Transformed and sorted watch history:', historyVideos);
        setWatchHistory(historyVideos);
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

  const clearWatchHistory = async () => {
    // This would require a backend endpoint to clear history
    // For now, we'll just clear locally
    try {
      setWatchHistory([]);
      showToast('Watch history cleared', 'success');
    } catch (error) {
      console.error('Error clearing watch history:', error);
      showToast('Failed to clear watch history', 'error');
    }
  };

  const formatWatchDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    // Show actual time if it's today
    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) {
          return 'Just now';
        }
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    // Show "Yesterday at HH:MM" for yesterday
    if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`;
    }
    
    // Show date and time for older videos
    if (diffDays < 7) {
      return `${diffDays} days ago at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })}`;
    }
    
    // Show full date for very old videos
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }) + ` at ${date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleVideoClick = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading watch history...</div>
        </div>
      </div>
    );
  }

  // Show login message if user is not authenticated
  if (!isLoggedIn || !user) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl text-gray-700 mb-2">Please log in to view your watch history</h3>
            <p className="text-gray-500">
              Your watch history will appear here once you're logged in
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Watch History</h1>
          <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full ml-2">
            {watchHistory.length} video{watchHistory.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Clear History Button */}
        {watchHistory.length > 0 && (
          <button
            onClick={clearWatchHistory}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Watch History Content */}
      {watchHistory.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl text-gray-700 mb-2">No watch history</h3>
          <p className="text-gray-500">
            Videos you watch will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List Layout for Watch History */}
          {watchHistory.map((video) => (
            <div 
              key={`${video.id}-${video.watchedAt}`} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => handleVideoClick(video.id)}
            >
              <div className="flex gap-4">
                {/* Video Thumbnail */}
                <div className="flex-shrink-0 w-48 h-28 relative rounded-lg overflow-hidden bg-gray-100 group">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/192/112';
                    }}
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Video Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span>{video.owner.fullName}</span>
                        <span>•</span>
                        <span>{video.views} views</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {video.description}
                      </p>
                    </div>

                    {/* Watch Time and Actions */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {formatWatchDate(video.watchedAt)}
                        </span>
                      </div>
                      
                      {/* Remove from History Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // You can implement remove functionality here
                          showToast('Remove from history feature coming soon', 'info');
                        }}
                        className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors duration-200 text-sm"
                        title="Remove from Watch History"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default WatchHistory;