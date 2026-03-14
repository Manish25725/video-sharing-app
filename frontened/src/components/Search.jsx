import PageLoader from './PageLoader.jsx';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';
import { videoService } from '../services/videoService';
import { Home, SearchX } from 'lucide-react';

const Search = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract search query from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the search API
      const response = await videoService.searchVideos(searchQuery);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search videos. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Search Results
        </h1>
        {query && (
          <p className="text-gray-600">
            Showing results for: <span className="font-medium">"{query}"</span>
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <PageLoader message="Searching..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* No Query */}
      {!query.trim() && !loading && (
        <div className="flex flex-col items-center py-20 space-y-4">
          <SearchX className="w-16 h-16 text-gray-300" />
          <p className="text-gray-500 text-lg">Enter a search term to find videos</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        </div>
      )}

      {/* No Results */}
      {query.trim() && !loading && !error && searchResults.length === 0 && (
        <div className="flex flex-col items-center py-20 space-y-3">
          <SearchX className="w-16 h-16 text-gray-300" />
          <p className="text-gray-800 text-xl font-semibold">No results found</p>
          <p className="text-gray-500">No videos found for <span className="font-medium text-gray-700">"{query}"</span></p>
          <p className="text-gray-400 text-sm">Try different keywords or check your spelling</p>
          <button
            onClick={() => navigate('/')}
            className="mt-3 inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {searchResults.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}

      {/* Results Count */}
      {searchResults.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-gray-500">
            Found {searchResults.length} video{searchResults.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
