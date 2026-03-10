import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { videoService } from '../services/videoService';
import RelatedVideoCard from './RelatedVideoCard';

const RelatedVideos = ({ videoId }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const response = await videoService.getRelatedVideos(videoId);
        if (response && response.data) {
          setVideos(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error('Error fetching related videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [videoId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Videos</h3>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-3 p-2 animate-pulse">
            <div className="w-40 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Videos</h3>
      {videos.length > 0 ? (
        videos.map((video) => (
          <RelatedVideoCard key={video._id} video={video} />
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <p>No related videos found</p>
        </div>
      )}
    </div>
  );
};

export default RelatedVideos;
