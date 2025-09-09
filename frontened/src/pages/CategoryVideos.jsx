import VideoCard from "../components/VideoCard.jsx";
import { useState, useEffect } from "react";
import { videoService, transformVideosArray } from "../services/videoService.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocation } from "react-router-dom";

const CategoryVideos = ({ onVideoSelect }) => {
  const { user, isAuthenticated } = useAuth();

  
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get category from current path
  const category = location.pathname.slice(1); // Remove the leading '/'

  // Map URL category to display name
  const getCategoryDisplayName = (urlCategory) => {
    const categoryMap = {
      'music': 'Music',
      'movies': 'Movies', 
      'gaming': 'Gaming',
      'news': 'News',
      'sports': 'Sports',
      'learning': 'Learning',
      'fashion': 'Fashion'
    };
    return categoryMap[urlCategory] || urlCategory;
  };

  const categoryDisplayName = getCategoryDisplayName(category);

  // Fetch videos from backend
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch videos by category
        const response = await videoService.getAllVideos(
          currentPage,
          20, // limit
          "", // query - empty since we're filtering by type
          'createdAt',
          'desc',
          '', // userId
          categoryDisplayName // videoType
        );

        if (response.success) {
          const transformedVideos = transformVideosArray(response.data);
          console.log(`${categoryDisplayName} videos:`, transformedVideos);
          setVideos(transformedVideos);
          setTotalPages(Math.ceil(transformedVideos.length / 20) || 1);
        } else {
          setError(`Failed to load ${categoryDisplayName.toLowerCase()} videos`);
          setVideos([]);
        }
      } catch (err) {
        console.error(`Error fetching ${categoryDisplayName} videos:`, err);
        setError(`Failed to load ${categoryDisplayName.toLowerCase()} videos`);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchVideos();
    }
  }, [category, currentPage, categoryDisplayName]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading {categoryDisplayName.toLowerCase()} videos...</div>
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

      {/* Category Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryDisplayName}</h1>
        <p className="text-gray-600">
          {videos.length > 0 
            ? `${videos.length} ${categoryDisplayName.toLowerCase()} video${videos.length !== 1 ? 's' : ''} found`
            : `No ${categoryDisplayName.toLowerCase()} videos available`
          }
        </p>
      </div>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onVideoSelect={onVideoSelect}
            />
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {categoryDisplayName.toLowerCase()} videos yet</h3>
          <p className="text-gray-600">Check back later for new {categoryDisplayName.toLowerCase()} content!</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryVideos;
