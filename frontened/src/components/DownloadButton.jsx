import { Download, Check, Loader } from 'lucide-react';
import { useDownload } from '../hooks/useDownload';

const DownloadButton = ({ video, size = 'sm', showText = false, className = '' }) => {
  const { downloadVideo, isVideoDownloaded, isDownloading } = useDownload();

  const handleDownload = async (e) => {
    e.stopPropagation(); // Prevent video card click
    
    if (isVideoDownloaded(video.id)) {
      return; // Already downloaded
    }

    const result = await downloadVideo(video);
    if (result.success) {
      // Optional: Show success message
      console.log('Video downloaded successfully');
    } else {
      alert(result.message || 'Failed to download video');
    }
  };

  const isDownloaded = isVideoDownloaded(video.id);
  const downloading = isDownloading(video.id);

  // Size configurations
  const sizeConfig = {
    xs: { icon: 'w-3 h-3', button: 'p-1', text: 'text-xs' },
    sm: { icon: 'w-4 h-4', button: 'p-2', text: 'text-sm' },
    md: { icon: 'w-5 h-5', button: 'p-3', text: 'text-base' },
    lg: { icon: 'w-6 h-6', button: 'p-4', text: 'text-lg' }
  };

  const config = sizeConfig[size] || sizeConfig.sm;

  if (downloading) {
    return (
      <button
        disabled
        className={`inline-flex items-center ${config.button} bg-gray-400 text-white rounded-full transition-colors cursor-not-allowed ${className}`}
        title="Downloading..."
      >
        <Loader className={`${config.icon} animate-spin`} />
        {showText && <span className={`ml-2 ${config.text}`}>Downloading...</span>}
      </button>
    );
  }

  if (isDownloaded) {
    return (
      <button
        disabled
        className={`inline-flex items-center ${config.button} bg-green-500 text-white rounded-full cursor-default ${className}`}
        title="Already downloaded"
      >
        <Check className={config.icon} />
        {showText && <span className={`ml-2 ${config.text}`}>Downloaded</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center ${config.button} bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors ${className}`}
      title="Download video"
    >
      <Download className={config.icon} />
      {showText && <span className={`ml-2 ${config.text}`}>Download</span>}
    </button>
  );
};

export default DownloadButton;
