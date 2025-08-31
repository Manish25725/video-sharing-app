import apiClient from './api.js';

// Download Services
export const downloadService = {
  // Download video for offline viewing
  async downloadVideo(videoId, videoTitle, videoUrl, thumbnailUrl = null) {
    try {
      console.log('downloadService.downloadVideo called with:', {
        videoId,
        videoTitle,
        videoUrl,
        thumbnailUrl
      });
      
      // For online download - fetch the video blob
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Failed to download video');
      
      const blob = await response.blob();
      
      // Create download link with proper filename and suggest save location
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean filename for better compatibility
      const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      link.download = `${cleanTitle}.mp4`;
      
      // Try to suggest saving to Downloads/videotubedownloads folder
      // Note: Modern browsers will show save dialog, user can choose location
      link.setAttribute('download', `${cleanTitle}.mp4`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Store download info in localStorage for offline access
      const downloadInfo = {
        id: videoId,
        title: videoTitle,
        thumbnail: thumbnailUrl,
        downloadedAt: new Date().toISOString(),
        localPath: `Downloads/videotubedownloads/${cleanTitle}.mp4`,
        originalFilename: `${cleanTitle}.mp4`
      };
      
      console.log('Saving download info:', downloadInfo);
      this.saveDownloadInfo(downloadInfo);
      
      return { 
        success: true, 
        message: 'Video download started! Please save it to your Downloads/videotubedownloads folder for easy access.',
        suggestedPath: 'Downloads/videotubedownloads/'
      };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, message: 'Failed to download video' };
    }
  },

  // Save download information to localStorage
  saveDownloadInfo(downloadInfo) {
    const downloads = this.getDownloadedVideos();
    const existingIndex = downloads.findIndex(d => d.id === downloadInfo.id);
    
    if (existingIndex >= 0) {
      downloads[existingIndex] = downloadInfo;
    } else {
      downloads.push(downloadInfo);
    }
    
    localStorage.setItem('downloadedVideos', JSON.stringify(downloads));
  },

  // Get all downloaded videos from localStorage
  getDownloadedVideos() {
    try {
      const stored = localStorage.getItem('downloadedVideos');
      const downloads = stored ? JSON.parse(stored) : [];
      console.log('getDownloadedVideos returning:', downloads);
      
      // Add placeholders for downloads without thumbnails
      const enhancedDownloads = downloads.map(download => {
        if (!download.thumbnail) {
          // For downloads without thumbnails, we'll show the file icon placeholder
          return {
            ...download,
            thumbnail: null // Explicitly set to null so our UI handles it properly
          };
        }
        return download;
      });
      
      return enhancedDownloads;
    } catch (error) {
      console.error('Error reading downloaded videos:', error);
      return [];
    }
  },

  // Remove download from localStorage
  removeDownload(videoId) {
    const downloads = this.getDownloadedVideos();
    const filtered = downloads.filter(d => d.id !== videoId);
    localStorage.setItem('downloadedVideos', JSON.stringify(filtered));
  },

  // Check if a video is downloaded
  isVideoDownloaded(videoId) {
    const downloads = this.getDownloadedVideos();
    return downloads.some(d => d.id === videoId);
  },

  // Browse local folder (for offline viewing)
  async browseLocalFolder() {
    try {
      // For web browsers, we'll use the File System Access API if available
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker({
          id: 'videotubedownloads',
          startIn: 'downloads',
          mode: 'read'
        });
        const files = [];
        
        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === 'file' && name.endsWith('.mp4')) {
            const file = await handle.getFile();
            files.push({
              name: name,
              size: file.size,
              lastModified: file.lastModified,
              file: file
            });
          }
        }
        
        return { 
          success: true, 
          files,
          directoryName: dirHandle.name,
          message: `Found ${files.length} video files in ${dirHandle.name}`
        };
      } else {
        // Fallback: Use file input for older browsers
        return { success: false, message: 'File System Access not supported. Please use a modern browser like Chrome or Edge.' };
      }
    } catch (error) {
      console.error('Error browsing local folder:', error);
      if (error.name === 'AbortError') {
        return { success: false, message: 'Folder selection was cancelled' };
      }
      return { success: false, message: 'Failed to access local folder' };
    }
  },

  // Browse specifically for videotubedownloads folder
  async browseVideotubedownloadsFolder() {
    try {
      if (!('showDirectoryPicker' in window)) {
        return {
          success: false,
          message: 'File System Access API not supported. Please use Chrome or Edge browser.'
        };
      }

      const dirHandle = await window.showDirectoryPicker({
        id: 'videotubedownloads-specific',
        startIn: 'downloads',
        mode: 'read'
      });

      const files = [];
      
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file' && name.endsWith('.mp4')) {
          const file = await handle.getFile();
          files.push({
            name: name,
            size: file.size,
            lastModified: file.lastModified,
            file: file
          });
        }
      }

      // Check if this looks like the right folder
      const isVideotubeFolder = dirHandle.name.toLowerCase().includes('videotube') ||
                               dirHandle.name.toLowerCase().includes('download');

      return {
        success: true,
        files,
        directoryName: dirHandle.name,
        isVideotubeFolder,
        message: files.length > 0 
          ? `Found ${files.length} video files in ${dirHandle.name}`
          : `No video files found. Make sure you're selecting your videotubedownloads folder.`
      };
    } catch (error) {
      console.error('Error browsing videotubedownloads folder:', error);
      return {
        success: false,
        message: error.name === 'AbortError' 
          ? 'Folder selection cancelled'
          : 'Failed to access videotubedownloads folder'
      };
    }
  },

  // Get video URL for local file
  async getLocalVideoUrl(file) {
    return URL.createObjectURL(file);
  }
};

// Helper functions for download management
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDownloadDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
