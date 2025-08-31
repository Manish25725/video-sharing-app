import { useState, useEffect } from 'react';
import { downloadService } from '../services/downloadService';

export const useDownload = () => {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloading, setDownloading] = useState({});

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load downloaded videos on mount
  useEffect(() => {
    loadDownloadedVideos();
  }, []);

  const loadDownloadedVideos = () => {
    const videos = downloadService.getDownloadedVideos();
    setDownloadedVideos(videos);
  };

  const downloadVideo = async (video) => {
    if (!video.videoFile || !video.title) {
      return { success: false, message: 'Invalid video data' };
    }

    setDownloading(prev => ({ ...prev, [video.id]: true }));

    try {
      const result = await downloadService.downloadVideo(
        video.id,
        video.title,
        video.videoFile,
        video.thumbnail
      );

      if (result.success) {
        loadDownloadedVideos(); // Refresh the list
      }

      return result;
    } finally {
      setDownloading(prev => ({ ...prev, [video.id]: false }));
    }
  };

  const removeDownload = (videoId) => {
    downloadService.removeDownload(videoId);
    loadDownloadedVideos();
  };

  const isVideoDownloaded = (videoId) => {
    return downloadService.isVideoDownloaded(videoId);
  };

  const isDownloading = (videoId) => {
    return !!downloading[videoId];
  };

  return {
    downloadedVideos,
    isOnline,
    downloadVideo,
    removeDownload,
    isVideoDownloaded,
    isDownloading,
    loadDownloadedVideos
  };
};
