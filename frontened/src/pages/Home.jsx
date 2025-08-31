import VideoCard from "../components/VideoCard.jsx";
import { useState, useEffect } from "react";
import { videoService, transformVideosArray } from "../services/videoService.js";
import { subscriptionService } from "../services/subscriptionService.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const Home = ({ onVideoSelect }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showOnlySubscribed, setShowOnlySubscribed] = useState(false);

  const categories = [
    "All",
    "Music",
    "Gaming",
    "News",
    "Sports",
    "Entertainment",
    "Technology",
    "Cooking",
    "Travel",
    "Fashion",
  ];

  // Fetch subscribed channels
  useEffect(() => {
    const fetchSubscribedChannels = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await subscriptionService.getSubscribedChannels(user._id);
          if (response.success) {
            setSubscribedChannels(response.data);
          }
        } catch (err) {
          console.error('Error fetching subscriptions:', err);
        }
      }
    };

    fetchSubscribedChannels();
  }, [isAuthenticated, user]);

  // Fetch videos from backend
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let allVideos = [];
        
        // If showing only subscribed content and user is logged in
        if (showOnlySubscribed && isAuthenticated && subscribedChannels.length > 0) {
          // Fetch videos from each subscribed channel
          for (const channel of subscribedChannels) {
            const userId = channel._id;
            const response = await videoService.getAllVideos(
              1, // page
              5, // limit per channel
              activeCategory === "All" ? "" : activeCategory.toLowerCase(),
              'createdAt',
              'desc',
              userId
            );
            
            if (response.success && response.data.length > 0) {
              const transformedVideos = transformVideosArray(response.data);
              allVideos = [...allVideos, ...transformedVideos];
            }
          }
          
          // Sort videos by creation date
          allVideos.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
          setVideos(allVideos);
          setTotalPages(1); // No pagination when showing subscribed content
          
        } else {
          // Fetch all videos or by category
          const response = await videoService.getAllVideos(
            currentPage,
            20, // limit
            activeCategory === "All" ? "" : activeCategory.toLowerCase(),
            'createdAt',
            'desc'
          );

          if (response.success) {
            const transformedVideos = transformVideosArray(response.data);
            console.log('Transformed videos:', transformedVideos);
            setVideos(transformedVideos);
            setTotalPages(Math.ceil(transformedVideos.length / 20) || 1);
          } else {
            setError('Failed to load videos');
            setVideos([]);
          }
        }
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [activeCategory, currentPage, showOnlySubscribed, subscribedChannels, isAuthenticated]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading videos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Subscriptions Toggle */}
      {isAuthenticated && (
        <div className="mb-4 flex items-center">
          <button
            onClick={() => setShowOnlySubscribed(!showOnlySubscribed)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              showOnlySubscribed
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {showOnlySubscribed ? "Showing: Subscriptions" : "Showing: All Videos"}
          </button>
        </div>
      )}
      
      {/* Category Pills */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-3 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid - Only 3 videos per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onVideoSelect={onVideoSelect} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home
