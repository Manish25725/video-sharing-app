import { useState, useEffect } from 'react';
import { Download, Trash2, Play, FolderOpen, Wifi, WifiOff, FileVideo, Monitor, Eye } from 'lucide-react';
import { useDownload } from '../hooks/useDownload';
import { downloadService, formatFileSize, formatDownloadDate } from '../services/downloadService';
import VideoCard from '../components/VideoCard';

const Downloads = ({ onVideoSelect }) => {
  const { 
    downloadedVideos, 
    isOnline, 
    removeDownload, 
    loadDownloadedVideos 
  } = useDownload();
  
  const [localFiles, setLocalFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load downloaded videos on component mount
  useEffect(() => {
    loadDownloadedVideos();
  }, []);

  // Debug downloaded videos
  useEffect(() => {
    console.log('Downloaded videos in Downloads page:', downloadedVideos);
    downloadedVideos.forEach((download, index) => {
      console.log(`Download ${index}:`, {
        id: download.id,
        title: download.title,
        thumbnail: download.thumbnail,
        thumbnailExists: !!download.thumbnail
      });
    });
  }, [downloadedVideos]);

  const handleBrowseLocalFolder = async () => {
    setLoading(true);
    try {
      const result = await downloadService.browseVideotubedownloadsFolder();
      if (result.success) {
        setLocalFiles(result.files);
        
        // Provide feedback about the folder selected
        if (!result.isVideotubeFolder) {
          alert(`Selected folder: ${result.directoryName}\n\n💡 For best experience, create a "videotubedownloads" folder in your Downloads directory.`);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error browsing folder:', error);
      alert('Failed to browse local folder');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayLocalVideo = async (file) => {
    try {
      const videoUrl = await downloadService.getLocalVideoUrl(file.file);
      // Create a temporary video object for the player
      const localVideo = {
        id: `local-${Date.now()}`,
        title: file.name.replace('.mp4', ''),
        videoFile: videoUrl,
        thumbnail: null,
        isLocal: true
      };
      
      if (onVideoSelect) {
        onVideoSelect(localVideo.id, localVideo);
      }
    } catch (error) {
      console.error('Error playing local video:', error);
      alert('Failed to play local video');
    }
  };

  const handleVideoClick = async (download) => {
    if (isOnline) {
      // Play online directly
      if (onVideoSelect) {
        onVideoSelect(download.id, download);
      }
    } else {
      // Automatically browse for videotubedownloads folder when offline
      try {
        setLoading(true);
        const result = await downloadService.browseVideotubedownloadsFolder();
        if (result.success && result.files.length > 0) {
          // Try to find matching file by title or filename
          const matchingFile = result.files.find(file => {
            const fileName = file.name.toLowerCase().replace('.mp4', '');
            const downloadTitle = download.title.toLowerCase();
            const originalFilename = download.originalFilename?.toLowerCase().replace('.mp4', '') || '';
            
            return fileName.includes(downloadTitle) || 
                   downloadTitle.includes(fileName) ||
                   fileName === originalFilename;
          });
          
          if (matchingFile) {
            await handlePlayLocalVideo(matchingFile);
          } else {
            // Show all files if no match found
            setLocalFiles(result.files);
            alert(`Could not find "${download.title}" in the selected folder. Please select the correct file from the list.`);
          }
        } else {
          alert(result.message || 'No video files found. Please ensure you select the correct videotubedownloads folder.');
        }
      } catch (error) {
        console.error('Error browsing for local file:', error);
        alert('Failed to browse local files');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveDownload = (videoId, videoTitle) => {
    if (window.confirm(`Are you sure you want to remove "${videoTitle}" from downloads?`)) {
      removeDownload(videoId);
    }
  };

  return (
    <div className="p-6">
      {/* Header with online status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Downloads</h1>
          <p className="text-gray-600 mt-2">Manage your downloaded videos for offline viewing</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <Wifi className="w-4 h-4 mr-1" />
              Online
            </div>
          ) : (
            <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              <WifiOff className="w-4 h-4 mr-1" />
              Offline
            </div>
          )}
        </div>
      </div>

      {/* Offline functionality */}
      {!isOnline && (
        <div className="mb-6 bg-orange-100 border border-orange-300 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <WifiOff className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-800">You're offline</h3>
          </div>
          <p className="text-orange-700 mb-4">Select your downloaded video file to watch offline.</p>
          
          <div className="bg-blue-600 text-white rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <FolderOpen className="w-5 h-5 mr-2" />
              <h4 className="font-semibold">Find Your Downloaded Video</h4>
            </div>
            <p className="text-blue-100">Expected location: Downloads/videotubedownloads/</p>
          </div>
          
          <div className="text-center">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Select Your Downloaded Video File</h4>
            <p className="text-gray-600 mb-4">Browse to your Downloads/videotubedownloads folder</p>
            <button
              onClick={handleBrowseLocalFolder}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <FolderOpen className="w-5 h-5 mr-2" />
              {loading ? 'Browsing...' : 'Browse for Video File'}
            </button>
          </div>
        </div>
      )}

      {/* Downloaded Videos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Downloaded Videos</h2>
        {downloadedVideos.length === 0 ? (
          <div className="text-center py-12">
            <Download className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No downloaded videos</h3>
            <p className="text-gray-500">Videos you download will appear here for offline viewing</p>
          </div>
        ) : (
          <div className="space-y-4">
            {downloadedVideos.map((download) => (
              <div key={download.id} className="flex items-start bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Video Thumbnail */}
                <div className="relative cursor-pointer flex-shrink-0" onClick={() => handleVideoClick(download)}>
                  {download.thumbnail ? (
                    <img
                      src={download.thumbnail}
                      alt={download.title}
                      className="w-48 h-28 object-cover rounded-lg hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        console.log('Thumbnail failed to load:', download.thumbnail);
                        // Hide the broken image and show fallback
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback placeholder */}
                  <div 
                    className={`w-48 h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex flex-col items-center justify-center hover:from-blue-200 hover:to-blue-300 transition-colors ${download.thumbnail ? 'hidden' : 'flex'}`}
                    style={{ display: download.thumbnail ? 'none' : 'flex' }}
                  >
                    <FileVideo className="w-8 h-8 text-blue-500 mb-1" />
                    <span className="text-xs text-blue-600 font-medium">Video</span>
                  </div>
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  {/* Duration if available */}
                  {download.duration && (
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {download.duration}
                    </div>
                  )}
                  {/* Status badge */}
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Downloaded
                  </div>
                </div>
                
                {/* Video Info */}
                <div className="flex-1 ml-4 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {download.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Downloaded
                    </span>
                    <span>{formatDownloadDate(download.downloadedAt)}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVideoClick(download)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      {isOnline ? 'Play' : 'Find Local'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDownload(download.id, download.title);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Files - Only show when browsed */}
      {localFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Local Video Files</h2>
            <button
              onClick={handleBrowseLocalFolder}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {loading ? 'Browsing...' : 'Browse Again'}
            </button>
          </div>

          <div className="space-y-4">
            {localFiles.map((file, index) => (
              <div key={index} className="flex items-start bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Video Thumbnail */}
                <div className="relative cursor-pointer flex-shrink-0" onClick={() => handlePlayLocalVideo(file)}>
                  <div className="w-48 h-28 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <FileVideo className="w-12 h-12 text-green-500" />
                  </div>
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  {/* Local file badge */}
                  <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Local File
                  </div>
                </div>
                
                {/* File Info */}
                <div className="flex-1 ml-4 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {file.name.replace('.mp4', '')}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span>Size: {formatFileSize(file.size)}</span>
                    <span>Modified: {new Date(file.lastModified).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handlePlayLocalVideo(file)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Play Local
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom styles for line clamping */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Downloads;
