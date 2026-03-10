import VideoCard from "../components/VideoCard.jsx";
import LiveStreamCard from "../components/LiveStreamCard.jsx";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { videoService, transformVideosArray } from "../services/videoService.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import streamService from "../services/streamService.js";
import { Radio, Calendar, ChevronRight } from "lucide-react";


const Home = ({ onVideoSelect }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [liveStreams, setLiveStreams] = useState([]);
  const [scheduledStreams, setScheduledStreams] = useState([]);

  const categories = [
    "All",
    "Music",
    "Movies", 
    "Gaming",
    "News",
    "Sports",
    "Learning",
    "Fashion"
  ];

  // Fetch live + scheduled streams once on mount
  useEffect(() => {
    streamService.getLiveStreams().then(r => {
      if (r.success) setLiveStreams(r.data.slice(0, 4));
    }).catch(() => {});
    streamService.getScheduledStreams().then(r => {
      if (r.success) setScheduledStreams(r.data.slice(0, 3));
    }).catch(() => {});
  }, []);

  // Fetch videos from backend
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all videos or by category
        let videoTypeFilter = activeCategory;
        
        // Handle "All" category - show all videos regardless of type
        if (activeCategory === "All") {
          videoTypeFilter = ""; // No type filter for all videos
        }

        const response = await videoService.getAllVideos(
          currentPage,
          20, // limit
          "", // query - empty since we're filtering by type
          'createdAt',
          'desc',
          '', // userId
          videoTypeFilter // videoType
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
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [activeCategory, currentPage]);

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

      {/* Live Now Strip */}
      {liveStreams.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Live Now</h2>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <Link to="/live" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveStreams.map(stream => (
              <LiveStreamCard key={stream._id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Streams Strip */}
      {scheduledStreams.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Streams</h2>
            </div>
            <Link to="/scheduled-streams" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {scheduledStreams.map(s => (
              <Link key={s._id} to="/scheduled-streams"
                className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <p className="font-medium text-gray-900 truncate">{s.title}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                <p className="text-xs text-indigo-600 mt-2 font-medium">
                  {new Date(s.scheduledAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
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
