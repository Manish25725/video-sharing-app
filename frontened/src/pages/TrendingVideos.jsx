import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Eye, 
  User, 
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { videoService, transformVideosArray } from '../services/videoService';
import { formatTimeAgo, formatViews } from '../utils/formatters';
import VideoCard from '../components/VideoCard';

const TrendingVideos = ({ onVideoSelect }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch trending videos
  const fetchTrendingVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching trending videos...');
      const response = await videoService.getTrendingVideos();
      
      console.log('Trending videos response:', response);
      
      if (response.success && response.data) {
        const transformedVideos = transformVideosArray(response.data);
        setVideos(transformedVideos);
        console.log('Transformed trending videos:', transformedVideos);
      } else {
        setError(response.message || 'Failed to fetch trending videos');
        setVideos([]);
      }
    } catch (err) {
      console.error('Error fetching trending videos:', err);
      setError('Failed to load trending videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh trending videos
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingVideos();
    setRefreshing(false);
  };

  // Fetch videos on component mount
  useEffect(() => {
    fetchTrendingVideos();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Trending Videos</h1>
          </div>
          <p className="text-gray-600">Most popular videos right now</p>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading trending videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Trending Videos</h1>
          </div>
          <p className="text-gray-600">Most popular videos right now</p>
        </div>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Trending Videos</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Trending Videos</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <p className="text-gray-600">
          Most popular videos right now • {videos.length} trending videos
        </p>
      </div>

        {/* Videos Grid - Same layout as Home page */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div key={video.id} className="relative">
                {/* Trending Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  #{index + 1}
                </div>
                <VideoCard 
                  video={video}
                  onVideoSelect={onVideoSelect}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Trending Videos</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              There are no trending videos at the moment. Check back later for the latest popular content.
            </p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}
    </div>
  );
};

export default TrendingVideos;
