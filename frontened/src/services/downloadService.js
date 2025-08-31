// Simple Download Service
const downloadService = {
  // Download video with progress tracking
  async downloadVideoWithProgress(videoUrl, filename, onProgress = null) {
    try {
      console.log('Starting download:', { videoUrl, filename });
      
      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('GET', videoUrl, true);
        xhr.responseType = 'blob';
        
        // Track download progress
        xhr.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            // Create download link
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = filename || 'video.mp4';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            window.URL.revokeObjectURL(url);
            
            resolve({
              success: true,
              message: `${filename} downloaded successfully!`
            });
          } else {
            reject(new Error(`Download failed: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error during download'));
        };
        
        xhr.send();
      });
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Generate safe filename
  generateSafeFilename(title) {
    return title
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50) // Limit length
      + '.mp4';
  }
};

export { downloadService };
export default downloadService;