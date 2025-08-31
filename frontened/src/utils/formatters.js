// YouTube-style date and time formatting utilities

// Helper function to safely format dates like YouTube (e.g., "Aug 30, 2025")
export const formatDate = (dateValue) => {
  if (!dateValue) return 'Unknown date';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    // YouTube format: "Aug 30, 2025"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Unknown date';
  }
};

// Helper function to format time ago like YouTube (e.g., "2 hours ago", "3 days ago")
export const formatTimeAgo = (dateValue) => {
  if (!dateValue) return 'Unknown time';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.44); // More accurate month calculation
    const diffYears = Math.floor(diffDays / 365.25); // Account for leap years
    
    // YouTube-style time formatting with more precise thresholds
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Time ago formatting error:', error, 'for date:', dateValue);
    return 'Unknown time';
  }
};

// Format view count like YouTube (e.g., "1.2M views", "450K views")
export const formatViews = (views) => {
  if (typeof views === 'string') return views;
  
  const num = Number(views) || 0;
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B views`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} view${num !== 1 ? 's' : ''}`;
};

// Format duration like YouTube (e.g., "4:32", "1:05:23")
export const formatDuration = (duration) => {
  if (!duration) return '0:00';
  if (typeof duration === 'string' && duration.includes(':')) return duration;
  
  const totalSeconds = Math.floor(Number(duration) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};