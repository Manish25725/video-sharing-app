import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { likeService } from '../services/likeService';
import VideoCard from '../components/VideoCard';
import { transformVideosArray } from '../services/videoService';
import { formatDuration } from '../utils/formatters';

const LikedVideos = ({ onVideoSelect }) => {
  const { user, isAuthenticated } = useAuth();
  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLikedVideos = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await likeService.getLikedVideos();
        console.log('Liked videos response:', response);

        if (response && response.success && response.data) {
          // Transform the liked videos data
          const transformedVideos = response.data.map(like => {
            if (like.videoDetails) {
              return {
                id: like.videoDetails._id,
                title: like.videoDetails.title,
                thumbnail: like.videoDetails.thumbnail,
                duration: formatDuration(like.videoDetails.duration),
                views: like.videoDetails.views,
                channelName: like.videoDetails.userDetails?.fullName || like.videoDetails.userDetails?.userName || 'Unknown',
                channelAvatar: like.videoDetails.userDetails?.avatar,
                uploadTime: like.videoDetails.createdAt,
                uploadDate: like.videoDetails.createdAt,
                videoFile: like.videoDetails.videoFile,
                description: like.videoDetails.description,
                owner: like.videoDetails.userDetails
              };
            }
            return null;
          }).filter(Boolean);

          console.log('Transformed liked videos:', transformedVideos);
          setLikedVideos(transformedVideos);
        } else {
          setLikedVideos([]);
        }
      } catch (err) {
        console.error('Error fetching liked videos:', err);
        setError('Failed to load liked videos');
        setLikedVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedVideos();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
            <p className="text-gray-600">You need to be logged in to view your liked videos.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading liked videos...</div>
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Liked Videos</h1>
        <p className="text-gray-600 mt-2">
          {likedVideos.length === 0 
            ? "You haven't liked any videos yet." 
            : `${likedVideos.length} video${likedVideos.length !== 1 ? 's' : ''} you've liked`
          }
        </p>
      </div>

      {likedVideos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl text-gray-300 mb-4">♡</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No liked videos yet</h3>
            <p className="text-gray-500">Start exploring and like videos you enjoy!</p>
          </div>
        </div>
      ) : (
        /* Video Grid - Same as Home page: Only 3 videos per row */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onVideoSelect={onVideoSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedVideos;
