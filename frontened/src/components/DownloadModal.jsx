import { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, Loader2, FolderOpen, X } from 'lucide-react';

const DownloadModal = ({ isOpen, onClose, downloadInfo, onDownloadComplete }) => {
  const [downloadState, setDownloadState] = useState('idle'); // idle, downloading, success, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isFirstDownload, setIsFirstDownload] = useState(false);

  useEffect(() => {
    if (isOpen && downloadInfo) {
      startDownload();
    }
  }, [isOpen, downloadInfo]);

  const startDownload = async () => {
    setDownloadState('downloading');
    setProgress(0);
    setMessage('Preparing download...');

    try {
      // Import download service
      const { downloadService } = await import('../services/downloadService');
      
      // Check if first download
      const downloads = JSON.parse(localStorage.getItem('downloadedVideos') || '[]');
      setIsFirstDownload(downloads.length === 0);

      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 15;
          }
          return prev;
        });
      }, 200);

      setMessage('Downloading video...');
      
      // Use the download service
      const result = await downloadService.downloadVideoWithModal(
        downloadInfo.videoId,
        downloadInfo.title,
        downloadInfo.videoUrl,
        downloadInfo.thumbnail,
        (progressData) => {
          // Update progress from service
          if (progressData.progress) {
            setProgress(progressData.progress);
          }
          if (progressData.message) {
            setMessage(progressData.message);
          }
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setDownloadState('success');
        setMessage(result.message || 'Video downloaded successfully!');
        
        if (onDownloadComplete) {
          onDownloadComplete(result.downloadInfo);
        }
      } else {
        throw new Error(result.message || 'Download failed');
      }

    } catch (error) {
      console.error('Download error:', error);
      setDownloadState('error');
      setMessage(error.message || 'Download failed. Please try again.');
    }
  };

  const handleClose = () => {
    if (downloadState === 'downloading') {
      return; // Prevent closing during download
    }
    setDownloadState('idle');
    setProgress(0);
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          {downloadState !== 'downloading' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              {downloadState === 'downloading' && <Loader2 className="w-6 h-6 animate-spin" />}
              {downloadState === 'success' && <CheckCircle className="w-6 h-6" />}
              {downloadState === 'error' && <XCircle className="w-6 h-6" />}
              {downloadState === 'idle' && <Download className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {downloadState === 'downloading' && 'Downloading Video'}
                {downloadState === 'success' && 'Download Complete'}
                {downloadState === 'error' && 'Download Failed'}
                {downloadState === 'idle' && 'Download Video'}
              </h3>
              <p className="text-white text-opacity-90 text-sm">
                {downloadInfo?.title?.substring(0, 50)}
                {downloadInfo?.title?.length > 50 && '...'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Bar */}
          {downloadState === 'downloading' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">{message}</p>
            
            {isFirstDownload && downloadState === 'success' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center text-blue-800 mb-2">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <span className="font-semibold">First Download!</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Create a "videotubedownloads" folder in your Downloads directory and save all videos there for easy offline access.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            {downloadState === 'success' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Awesome!
                </button>
                <button
                  onClick={() => window.open('/downloads', '_blank')}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Downloads
                </button>
              </>
            )}
            
            {downloadState === 'error' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={startDownload}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </>
            )}
            
            {downloadState === 'downloading' && (
              <div className="flex-1 text-center text-gray-500 py-3">
                <span className="text-sm">Please wait while downloading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
