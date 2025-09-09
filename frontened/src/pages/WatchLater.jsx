import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Play } from 'lucide-react';
import watchLaterService from '../services/watchLaterService';
import { transformVideosArray } from '../services/videoService';
import VideoCard from '../components/VideoCard';
import Toast from '../components/Toast';

const WatchLater = () => {
  const [watchLaterVideos, setWatchLaterVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchWatchLaterVideos();
  }, []);

  const fetchWatchLaterVideos = async () => {
    try {
      setLoading(true);
      console.log('Fetching watch later videos...');
      const response = await watchLaterService.getWatchLaterVideos();
      console.log('Watch later API response:', response);
      console.log('Watch later videos data:', response.data);
      console.log('Number of videos received:', response.data?.length);
      
      if (response && response.data && response.data.length > 0) {
        // Transform the backend videos to match frontend format
        console.log('Raw videos from backend:', response.data);
        const transformedVideos = transformVideosArray(response.data);
        console.log('Transformed watch later videos:', transformedVideos);
        console.log('Number of transformed videos:', transformedVideos.length);
        setWatchLaterVideos(transformedVideos);
      } else {
        console.log('No videos found in response');
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

  const handleRemoveFromWatchLater = async (videoId) => {
    try {
      await watchLaterService.removeFromWatchLater(videoId);
      // Remove from local state - video.id is used after transformation
      setWatchLaterVideos(prev => prev.filter(video => video.id !== videoId));
      showToast('Video removed from Watch Later', 'success');
    } catch (error) {
      console.error('Error removing from watch later:', error);
      showToast('Failed to remove video from Watch Later', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading watch later videos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Watch Later</h1>
        <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full ml-2">
          {watchLaterVideos.length} video{watchLaterVideos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Videos Grid */}
      {watchLaterVideos.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl text-gray-700 mb-2">No videos in Watch Later</h3>
          <p className="text-gray-500">
            Videos you save for later will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchLaterVideos.map((video) => (
            <div key={video.id} className="relative group">
              <VideoCard video={video} />
              
              {/* Remove from Watch Later Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveFromWatchLater(video.id);
                }}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-lg"
                title="Remove from Watch Later"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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

export default WatchLater;
