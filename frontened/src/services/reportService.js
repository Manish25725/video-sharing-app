import api from './api.js';

const reportService = {
  reportVideo: (videoId, reason, description) => api.post('/reports', { reportType: 'video', videoId, reason, description }),

  reportComment: (commentId, reason, description) => api.post('/reports', { reportType: 'comment', commentId, reason, description }),

  reportTweet: (tweetId, reason, description) => api.post('/reports', { reportType: 'tweet', tweetId, reason, description }),

  getReports: (params = {}) => api.get('/reports', { params }),
  updateStatus: (id, status) => api.patch(/reports//status, { status }),
  deleteContent: (id) => api.delete(/reports//content),
  banUserFromReport: (id) => api.post(/reports//ban),
};

export default reportService;