import api from "./api.js";

// HLS is served by the Express API server (port 8000) which has CORS configured
const NMS_HTTP_URL = import.meta.env.VITE_NMS_HTTP_URL || "http://localhost:8000";

export const getHlsUrl = (streamKey) =>
  `${NMS_HTTP_URL}/live/${streamKey}/index.m3u8`;

const streamService = {
  // Streaming
  goLive: (formData) => api.uploadFile("/streams/go-live", formData),
  endStream: (streamKey) => api.patch(`/streams/${streamKey}/end`),
  getMyStream: () => api.get("/streams/my-stream"),

  // Discovery
  getLiveStreams: () => api.get("/streams/live"),
  getStreamByKey: (streamKey) => api.get(`/streams/${streamKey}`),
  getRecordedStreams: () => api.get("/streams/recorded"),

  // Chat history
  getStreamMessages: (streamKey) => api.get(`/streams/${streamKey}/messages`),

  // VOD: save a stream recording as a video + fetch chat replay with timestamps
  saveRecording: (streamKey) => api.post(`/streams/${streamKey}/save-recording`),
  getChatReplay: (streamKey) => api.get(`/streams/${streamKey}/chat-replay`),

  // Scheduling
  scheduleStream: (formData) => api.uploadFile("/streams/schedule", formData),
  getScheduledStreams: () => api.get("/streams/scheduled"),
  cancelScheduledStream: (id) => api.patch(`/streams/schedule/${id}/cancel`),
};

export default streamService;
