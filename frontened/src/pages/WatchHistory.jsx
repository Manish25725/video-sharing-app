import React, { useState, useEffect } from 'react';
import { History, Trash2, Play, Clock } from 'lucide-react';
import watchHistoryService from '../services/watchHistoryService';
import VideoCard from '../components/VideoCard';
import Toast from '../components/Toast';

const WatchHistory = () => {
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchWatchHistory();
  }, []);

  const fetchWatchHistory = async () => {
    try {
      setLoading(true);
      console.log('Fetching watch history...');
      const response = await watchHistoryService.getWatchHistory();
      console.log('Watch history API response:', response);
      
      if (response && response.data && response.data.length > 0) {
        // The backend returns populated watchHistory with videoDetail
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
            avatar: item.videoDetail.owner.avatar
          },
          watchedAt: item.watchedAt // Using correct field name from user model
        }));
        
        console.log('Transformed watch history:', historyVideos);
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
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
        <div className="space-y-6">
          {/* Group by date if needed - for now showing all in list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchHistory.map((video) => (
              <div key={`${video.id}-${video.watchedAt}`} className="relative group">
                <VideoCard video={video} />
                
                {/* Watch timestamp overlay */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded z-10">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatWatchDate(video.watchedAt)}
                </div>
              </div>
            ))}
          </div>
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