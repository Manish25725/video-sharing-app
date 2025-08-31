import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VideoCard from './VideoCard';
import { videoService } from '../services/videoService';

const Search = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Enter a search term to find videos</p>
        </div>
      )}

      {/* No Results */}
      {query.trim() && !loading && !error && searchResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No videos found for "{query}"</p>
          <p className="text-gray-400">Try different keywords or check your spelling</p>
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
