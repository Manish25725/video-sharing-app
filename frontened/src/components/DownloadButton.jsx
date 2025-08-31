import { Download, Check, Loader } from 'lucide-react';
import { useState } from 'react';
import { useDownload } from '../hooks/useDownload';
import DownloadModal from './DownloadModal';

const DownloadButton = ({ video, size = 'sm', showText = false, className = '' }) => {
  const { isVideoDownloaded, refreshDownloads } = useDownload();
  const [showModal, setShowModal] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);

  const handleDownload = async (e) => {
    e.stopPropagation(); // Prevent video card click
    
    if (isVideoDownloaded(video.id)) {
      return; // Already downloaded
    }

    // Set up download info and show modal
    setDownloadInfo({
      videoId: video.id,
      title: video.title,
      videoUrl: video.videoFile,
      thumbnail: video.thumbnail
    });
    setShowModal(true);
  };

  const handleDownloadComplete = (downloadData) => {
    // Refresh the downloads list
    refreshDownloads();
    setShowModal(false);
    setDownloadInfo(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setDownloadInfo(null);
  };

  const isDownloaded = isVideoDownloaded(video.id);

  // Size configurations
  const sizeConfig = {
    xs: { icon: 'w-3 h-3', button: 'p-1', text: 'text-xs' },
    sm: { icon: 'w-4 h-4', button: 'p-2', text: 'text-sm' },
    md: { icon: 'w-5 h-5', button: 'p-3', text: 'text-base' },
    lg: { icon: 'w-6 h-6', button: 'p-4', text: 'text-lg' }
  };

  const config = sizeConfig[size] || sizeConfig.sm;

  if (isDownloaded) {
    return (
      <>
        <button
          disabled
          className={`inline-flex items-center ${config.button} bg-green-500 text-white rounded-full cursor-default ${className}`}
          title="Already downloaded"
        >
          <Check className={config.icon} />
          {showText && <span className={`ml-2 ${config.text}`}>Downloaded</span>}
        </button>
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleDownload}
        className={`inline-flex items-center ${config.button} bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors ${className}`}
        title="Download video"
      >
        <Download className={config.icon} />
        {showText && <span className={`ml-2 ${config.text}`}>Download</span>}
      </button>

      <DownloadModal
        isOpen={showModal}
        onClose={handleModalClose}
        downloadInfo={downloadInfo}
        onDownloadComplete={handleDownloadComplete}
      />
    </>
  );
};

export default DownloadButton;
