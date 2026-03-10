import { useNavigate } from 'react-router-dom';
import { formatTimeAgo, formatDuration, formatViews } from '../utils/formatters';

const RelatedVideoCard = ({ video }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/video/${video._id}`);
  };

  return (
    <div
      className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <img
          src={video.thumbnail || '/placeholder.svg?height=94&width=168&text=Video'}
          alt={video.title}
          className="w-40 h-24 object-cover rounded-lg"
        />
        {video.duration != null && (
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600">
          {video.title}
        </h4>
        <p className="text-xs text-gray-600 mb-1">
          {video.owner?.fullName || video.owner?.userName || 'Unknown'}
        </p>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <span>{formatViews(video.views || 0)} views</span>
          {video.createdAt && (
            <>
              <span>•</span>
              <span>{formatTimeAgo(video.createdAt)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatedVideoCard;
