import React, { useState } from 'react';
import { MoreVertical, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo, formatViews, formatDuration } from '../utils/formatters';

const VideoCard = ({ video, onVideoSelect }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoClick = () => {
    const videoId = video.id || video._id;
    console.log('Video clicked:', { video, videoId });
    console.log('Video date info:', { 
      uploadTime: video.uploadTime, 
      uploadDate: video.uploadDate, 
      createdAt: video.createdAt 
    });
    
    if (videoId) {
      // Use both navigation methods for better compatibility
      if (onVideoSelect) {
        console.log('Using onVideoSelect with videoId:', videoId);
        onVideoSelect(videoId);
      } else {
        console.log('Using navigate with videoId:', videoId);
        navigate(`/video/${videoId}`);
      }
    } else {
      console.error('Video ID not found:', video);
      alert('Video ID not found. Cannot open video.');
    }
  };

  return (
    <div 
      className="cursor-pointer group" 
      onClick={handleVideoClick}
    >
      <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-3">
        {!imageError && video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title || 'Video thumbnail'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-gray-600 text-sm">No thumbnail</span>
          </div>
        )}
        
        <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded flex items-center">
          <Clock size={10} className="mr-1" />
          {formatDuration(video.duration)}
        </span>
      </div>
      
      <div className="flex space-x-3">
        <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {(video.channel || video.channelName || 'Unknown')[0].toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm leading-5 mb-1 line-clamp-2">
            {video.title || 'Untitled Video'}
          </h3>
          <p className="text-gray-600 text-xs mb-1">
            {video.channelName || video.channel || 'Unknown Channel'}
          </p>
          <div className="flex items-center text-gray-600 text-xs space-x-1">
            <span>{formatViews(video.views)}</span>
            <span>•</span>
            <span>{formatTimeAgo(video.uploadTime || video.uploadDate)}</span>
          </div>
        </div>
        
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
          <MoreVertical size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
