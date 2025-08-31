import apiClient from './api.js';

// Download Services
export const downloadService = {
  // Download video for offline viewing with modal support
  async downloadVideoWithModal(videoId, videoTitle, videoUrl, thumbnailUrl = null, onProgress = null) {
    try {
      console.log('downloadService.downloadVideoWithModal called with:', {
        videoId,
        videoTitle,
        videoUrl,
        thumbnailUrl
      });
      
      // Check if this is the user's first download
      const existingDownloads = this.getDownloadedVideos();
      const isFirstDownload = existingDownloads.length === 0;
      
      if (onProgress) onProgress({ stage: 'starting', progress: 0, message: 'Starting download...' });
      
      // For online download - fetch the video blob
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Failed to download video');
      
      if (onProgress) onProgress({ stage: 'downloading', progress: 50, message: 'Downloading video...' });
      
      const blob = await response.blob();
      
      if (onProgress) onProgress({ stage: 'processing', progress: 80, message: 'Processing download...' });
      
      // Create download link with proper filename
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean filename for better compatibility
      const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      link.download = `${cleanTitle}.mp4`;
      
      let saveMethod = 'traditional';
      let saveLocation = 'Downloads folder';
      
      // For File System Access API supported browsers, try to suggest the folder
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            id: 'videotube-download',
            startIn: 'downloads',
            suggestedName: `${cleanTitle}.mp4`,
            types: [{
              description: 'Video files',
              accept: { 'video/mp4': ['.mp4'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          saveMethod = 'picker';
          saveLocation = 'Selected location';
          
        } catch (error) {
          if (error.name === 'AbortError') {
            window.URL.revokeObjectURL(url);
            throw new Error('Download cancelled by user');
          }
          // Fall back to traditional download if save picker fails
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        // Traditional download method (fallback)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      window.URL.revokeObjectURL(url);
      
      if (onProgress) onProgress({ stage: 'saving', progress: 95, message: 'Saving download info...' });
      
      // Store download info in localStorage for offline access
      const downloadInfo = {
        id: videoId,
        title: videoTitle,
        thumbnail: thumbnailUrl,
        downloadedAt: new Date().toISOString(),
        localPath: `Downloads/videotubedownloads/${cleanTitle}.mp4`,
        originalFilename: `${cleanTitle}.mp4`
      };
      
      this.saveDownloadInfo(downloadInfo);
      
      if (onProgress) onProgress({ 
        stage: 'complete', 
        progress: 100, 
        message: 'Download completed successfully!',
        isFirstDownload,
        saveMethod,
        saveLocation
      });
      
      return { 
        success: true, 
        message: `Video downloaded successfully! ${isFirstDownload ? 'Create a "videotubedownloads" folder in Downloads for better organization.' : ''}`,
        isFirstDownload,
        saveMethod,
        downloadInfo
      };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Legacy download method (keep for compatibility)
  async downloadVideo(videoId, videoTitle, videoUrl, thumbnailUrl = null) {
    // This method is now just a wrapper for the modal version
    return this.downloadVideoWithModal(videoId, videoTitle, videoUrl, thumbnailUrl);
  },

  // Create downloadable folder structure
  async createFolderStructure() {
    try {
      // Create a zip-like structure with instructions
      const instructionsContent = `VideoTube Downloads Folder Setup
==========================================

1. Extract this zip file to your Downloads folder
2. This will create: Downloads/videotubedownloads/
3. Save all VideoTube downloads in the videotubedownloads folder
4. When offline, browse to this folder to watch your videos

Folder Structure:
Downloads/
  └── videotubedownloads/
      ├── README.txt (this file)
      └── (save your downloaded videos here)

Happy watching! 🎬
`;

      // Create the instructions file
      const blob = new Blob([instructionsContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'VideoTube_Folder_Setup.txt';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Also create a more comprehensive setup guide
      await this.createSetupGuide();
      
      return { success: true, message: 'Folder structure guide downloaded!' };
    } catch (error) {
      console.error('Error creating folder structure:', error);
      return { success: false, message: 'Failed to create folder structure' };
    }
  },

  // Create detailed setup guide
  async createSetupGuide() {
    const setupGuide = `# VideoTube Downloads Setup Guide

## Quick Setup (Windows)
1. Open your Downloads folder (usually C:\\Users\\YourName\\Downloads)
2. Create a new folder named "videotubedownloads"
3. Save all VideoTube downloads in this folder

## Quick Setup (Mac)
1. Open your Downloads folder (usually /Users/YourName/Downloads)
2. Create a new folder named "videotubedownloads"  
3. Save all VideoTube downloads in this folder

## Why This Folder Structure?
- ✅ Easy to find videos when offline
- ✅ Organized downloads in one place
- ✅ Works with VideoTube's offline browsing
- ✅ No confusion about where videos are saved

## How to Create the Folder:
### Windows:
1. Open File Explorer
2. Navigate to Downloads folder
3. Right-click → New → Folder
4. Name it "videotubedownloads"

### Mac:
1. Open Finder
2. Navigate to Downloads folder
3. File → New Folder
4. Name it "videotubedownloads"

## Using Your Downloads:
1. Always save VideoTube downloads in the videotubedownloads folder
2. When offline, go to Downloads page and click "Browse for Video File"
3. Select your videotubedownloads folder
4. Choose any video to watch offline

Enjoy your offline viewing! 🎬
`;

    const blob = new Blob([setupGuide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VideoTube_Setup_Guide.md';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Enhanced remove with local file deletion guidance (no alerts)
  async removeDownloadWithFile(videoId, videoTitle, onProgress = null) {
    try {
      if (onProgress) onProgress({ stage: 'removing', message: 'Removing from downloads list...' });
      
      // First, remove from localStorage
      this.removeDownload(videoId);
      
      if (onProgress) onProgress({ stage: 'checking', message: 'Checking file system access...' });
      
      // Check if File System Access API is supported for file deletion
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await window.showDirectoryPicker({
            id: 'videotube-delete',
            startIn: 'downloads',
            mode: 'readwrite'
          });
          
          if (onProgress) onProgress({ stage: 'searching', message: 'Looking for video file...' });
          
          // Try to find and delete the file
          const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
          const possibleFilenames = [
            `${cleanTitle}.mp4`,
            `${videoTitle}.mp4`,
            videoTitle.replace(/[^\w\s-]/g, '') + '.mp4'
          ];
          
          let fileFound = false;
          for (const filename of possibleFilenames) {
            try {
              const fileHandle = await dirHandle.getFileHandle(filename);
              await dirHandle.removeEntry(filename);
              fileFound = true;
              break;
            } catch (error) {
              // File not found with this name, try next
              continue;
            }
          }
          
          if (fileFound) {
            if (onProgress) onProgress({ 
              stage: 'complete', 
              message: 'Video completely removed from your computer!',
              success: true,
              fileDeleted: true
            });
            
            return {
              success: true,
              message: `"${videoTitle}" has been completely removed from your computer.`,
              fileDeleted: true
            };
          } else {
            if (onProgress) onProgress({ 
              stage: 'complete', 
              message: 'Removed from downloads list. File not found for automatic deletion.',
              success: true,
              fileDeleted: false
            });
            
            return {
              success: true,
              message: `"${videoTitle}" removed from downloads list. Could not automatically find the video file.`,
              fileDeleted: false
            };
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            if (onProgress) onProgress({ 
              stage: 'complete', 
              message: 'Removed from downloads list. File deletion cancelled.',
              success: true,
              fileDeleted: false
            });
            
            return {
              success: true,
              message: `"${videoTitle}" removed from downloads list. File deletion cancelled.`,
              fileDeleted: false
            };
          }
          
          // Fallback: just remove from list
          if (onProgress) onProgress({ 
            stage: 'complete', 
            message: 'Removed from downloads list. Manual file deletion may be needed.',
            success: true,
            fileDeleted: false
          });
          
          return {
            success: true,
            message: `"${videoTitle}" removed from downloads list. You may need to manually delete the file.`,
            fileDeleted: false
          };
        }
      } else {
        // For browsers without File System Access API
        if (onProgress) onProgress({ 
          stage: 'complete', 
          message: 'Removed from downloads list. Manual file deletion required.',
          success: true,
          fileDeleted: false
        });
        
        return {
          success: true,
          message: `"${videoTitle}" removed from downloads list. Please manually delete the file from your videotubedownloads folder.`,
          fileDeleted: false
        };
      }
    } catch (error) {
      console.error('Error removing download:', error);
      
      if (onProgress) onProgress({ 
        stage: 'error', 
        message: 'Failed to remove download',
        success: false
      });
      
      return {
        success: false,
        message: 'Failed to remove download'
      };
    }
  },

  // Provide manual deletion instructions
  async provideDeletionInstructions(videoTitle) {
    const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    
    const shouldShowInstructions = window.confirm(
      `"${videoTitle}" has been removed from your downloads list.\n\n` +
      `To also delete the video file from your computer:\n\n` +
      `1. Open your Downloads/videotubedownloads folder\n` +
      `2. Look for: ${cleanTitle}.mp4\n` +
      `3. Delete the file manually\n\n` +
      `Would you like to download a deletion guide with more details?`
    );
    
    if (shouldShowInstructions) {
      await this.createDeletionGuide(videoTitle, cleanTitle);
    }
    
    return {
      success: true,
      message: `"${videoTitle}" removed from downloads list. Check your Downloads folder for manual file deletion instructions.`,
      fileDeleted: false
    };
  },

  // Create deletion guide
  async createDeletionGuide(videoTitle, cleanFilename) {
    const deletionGuide = `# Video File Deletion Guide

## File to Delete: ${videoTitle}
**Filename to look for:** ${cleanFilename}.mp4

## Steps to Delete:

### Windows:
1. Open File Explorer
2. Navigate to: Downloads → videotubedownloads
3. Look for the file: ${cleanFilename}.mp4
4. Right-click on the file → Delete
5. Empty your Recycle Bin to permanently delete

### Mac:
1. Open Finder
2. Navigate to: Downloads → videotubedownloads
3. Look for the file: ${cleanFilename}.mp4
4. Right-click on the file → Move to Trash
5. Empty your Trash to permanently delete

## Alternative Filenames:
If you can't find ${cleanFilename}.mp4, look for:
- ${videoTitle}.mp4
- Any file with a similar name containing "${videoTitle.substring(0, 20)}..."

## Need Help?
If you can't find the file:
1. Search your Downloads folder for ".mp4" files
2. Look for files modified around the time you downloaded this video
3. Check if the file was saved with a different name

---
Generated by VideoTube Downloads
`;

    const blob = new Blob([deletionGuide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Delete_${cleanFilename}_Guide.md`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  },

  // Show setup guide for first-time users
  showFirstTimeSetupGuide() {
    const guide = `
🎬 VideoTube Download Setup Guide

To ensure the best offline experience:

1. Open your Downloads folder
2. Create a new folder named "videotubedownloads"
3. Save all downloaded videos in this folder
4. When offline, browse to this folder to watch your videos

This setup makes it easy to:
✅ Find your videos when offline
✅ Keep them organized
✅ Use the automatic folder detection
    `;
    
    return window.confirm(guide + '\n\nWould you like to start your first download?');
  },

  // Download folder creation helper
  async downloadFolderHelper() {
    await this.createFolderStructure();
    return {
      success: true,
      message: 'Setup guide downloaded! Follow the instructions to create your videotubedownloads folder.'
    };
  },

  // Get folder creation instructions
  getFolderInstructions() {
    return {
      windows: 'Downloads/videotubedownloads/',
      mac: 'Downloads/videotubedownloads/',
      instructions: [
        'Navigate to your Downloads folder',
        'Create a new folder named "videotubedownloads"',
        'Save all VideoTube downloads in this folder',
        'When offline, browse to this folder to watch videos'
      ]
    };
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
