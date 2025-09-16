import { useState, useEffect } from "react"
import { Upload, Plus, List, BarChart3, Users, Video, Trash2, Edit, Eye, Play, MoreVertical, Settings, Bell, Heart, MessageCircle, Share2, FolderPlus, FolderEdit } from "lucide-react"
import { videoService, transformVideosArray } from "../services/videoService"
import { dashboardService } from "../services/dashboardService"
import { likeService } from "../services/likeService"
import { useAuth } from "../contexts/AuthContext"
import AddToPlaylistModal from "../components/AddToPlaylistModal"
import CreatorPlaylistModal from "../components/CreatorPlaylistModal"
import PlaylistEditModal from "../components/PlaylistEditModal"
import Toast from "../components/Toast"

const MyChannel = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("manage")
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    totalSubscribers: 0,
    totalVideos: 0,
    totalLikes: 0
  })
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: null,
    video: null,
    videoType: ""
  })

  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    thumbnail: null
  })

  // Format duration function
  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    if (typeof duration === 'string' && duration.includes(':')) return duration;
    
    // Handle decimal durations by rounding to nearest second
    const totalSeconds = Math.round(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // More options dropdown state
  const [openDropdown, setOpenDropdown] = useState(null)

  // Playlist modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState(null)
  const [showPlaylistEditModal, setShowPlaylistEditModal] = useState(false)



  // Fetch videos on component mount
  useEffect(() => {
    if (user) {
      fetchUserVideos()
      fetchAnalyticsData()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.relative')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  const fetchUserVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use dashboard service to get user's channel videos
      const response = await dashboardService.getChannelVideos()
      console.log("Dashboard videos response:", response)
      
      if (response.success !== false && response.data) {
        // Transform the data if it's an array
        let videosData = Array.isArray(response.data) ? response.data : []
        
        // Get additional stats for each video (just likes count and views)
        const transformedVideos = await Promise.all(
          videosData.map(async (video) => {
            try {
              // Get video stats (likes count and view count)
              const statsResponse = await videoService.getVideoStats(video._id)
              
              return {
                id: video._id,
                title: video.title,
                thumbnail: video.thumbnail,
                duration: video.duration,
                views: statsResponse?.data?.views || video.views || 0,
                description: video.description,
                isPublished: video.isPublished,
                uploadTime: video.createdAt,
                likes: statsResponse?.data?.likesCount || 0
              }
            } catch (error) {
              console.error("Error fetching stats for video:", video._id, error)
              // Fallback to basic video data
              return {
                id: video._id,
                title: video.title,
                thumbnail: video.thumbnail,
                duration: video.duration,
                views: video.views || 0,
                description: video.description,
                isPublished: video.isPublished,
                uploadTime: video.createdAt,
                likes: 0
              }
            }
          })
        )
        
        console.log("Transformed videos:", transformedVideos)
        setVideos(transformedVideos)
      } else {
        setError("Failed to load videos")
      }
    } catch (err) {
      console.error("Error fetching videos:", err)
      setError("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true)
      const response = await dashboardService.getChannelStats()
      console.log("Analytics response:", response)
      
      if (response.success !== false && response.data) {
        setAnalyticsData({
          totalViews: response.data.totalViews || 0,
          totalSubscribers: response.data.totalSubscribers || 0,
          totalVideos: response.data.totalVideos || 0,
          totalLikes: response.data.totalLikes || 0
        })
      }
    } catch (err) {
      console.error("Error fetching analytics:", err)
      // Keep default values on error
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const handlePublishToggle = async (videoId, currentStatus) => {
    try {
      const newStatus = !currentStatus
      const response = await videoService.togglePublishStatus(videoId, newStatus)
      
      if (response.success) {
        // Update the video in the local state
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video.id === videoId 
              ? { ...video, isPublished: newStatus }
              : video
          )
        )
      } else {
        showToast("Failed to update video status", "error")
      }
    } catch (error) {
      console.error("Error toggling publish status:", error)
      showToast("Failed to update video status", "error")
    }
  }

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        const response = await videoService.deleteVideo(videoId)
        if (response.success) {
          setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId))
          showToast("Video deleted successfully", "success")
        } else {
          showToast("Failed to delete video", "error")
        }
      } catch (error) {
        console.error("Error deleting video:", error)
        showToast("Failed to delete video", "error")
      }
    }
  }

  const handleEditVideo = (video) => {
    setEditingVideo(video)
    setEditFormData({
      title: video.title,
      description: video.description,
      thumbnail: null
    })
    setIsEditModalOpen(true)
  }

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'thumbnail') {
      setEditFormData(prev => ({ ...prev, thumbnail: files[0] }))
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleUpdateVideo = async (e) => {
    e.preventDefault()
    if (!editingVideo) return

    try {
      setLoading(true)
      const response = await videoService.updateVideo(
        editingVideo.id,
        {
          title: editFormData.title,
          description: editFormData.description
        },
        editFormData.thumbnail
      )

      if (response.success) {
        // Update the video in local state
        setVideos(prevVideos =>
          prevVideos.map(video =>
            video.id === editingVideo.id
              ? {
                  ...video,
                  title: editFormData.title,
                  description: editFormData.description,
                  thumbnail: response.data?.thumbnail || video.thumbnail
                }
              : video
          )
        )
        setIsEditModalOpen(false)
        showToast("Video updated successfully", "success")
      } else {
        showToast("Failed to update video", "error")
      }
    } catch (error) {
      console.error("Error updating video:", error)
      showToast("Failed to update video", "error")
    } finally {
      setLoading(false)
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingVideo(null)
    setEditFormData({
      title: "",
      description: "",
      thumbnail: null
    })
  }

  const handleViewVideo = async (videoId) => {
    // Open video first, then try to increment views in background
    window.open(`/video/${videoId}`, '_blank')
    
    // Try to increment view count in background without blocking navigation
    try {
      await videoService.incrementViews(videoId)
      // Update local state only if increment succeeds
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? { ...video, views: video.views + 1 }
            : video
        )
      )
    } catch (error) {
      console.error("Error incrementing views:", error)
      // Don't do anything on error - video is already opened
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsUploading(true)
      setUploadProgress(0)
      setLoading(true)
      
      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90 // Stop at 90%, will complete when upload finishes
          }
          return prev + Math.random() * 15 // Random increment between 0-15%
        })
      }, 500)

      const response = await videoService.publishVideoWithProgress(
        formData, 
        formData.video, 
        formData.thumbnail,
        (progress) => {
          setUploadProgress(progress)
        }
      )
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (response.success) {
        showToast("Video uploaded successfully! 🎉", "success")
        setFormData({
          title: "",
          description: "",
          thumbnail: null,
          video: null,
          videoType: ""
        })
        // Reset file inputs
        document.querySelector('input[name="video"]').value = ''
        document.querySelector('input[name="thumbnail"]').value = ''
        
        // Refresh video list and analytics
        fetchUserVideos()
        fetchAnalyticsData()
      } else {
        showToast("Failed to upload video: " + (response.message || "Unknown error"), "error")
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      showToast("Failed to upload video", "error")
    } finally {
      setLoading(false)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const renderUploadForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New Video</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter video title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter video description"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Upload a video</span>
                  <input
                    type="file"
                    name="video"
                    onChange={handleFileChange}
                    accept="video/*"
                    className="hidden"
                    required
                  />
                </label>
              </div>
              {formData.video && (
                <p className="mt-2 text-sm text-gray-600">{formData.video.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">Upload thumbnail</span>
                  <input
                    type="file"
                    name="thumbnail"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                </label>
              </div>
              {formData.thumbnail && (
                <p className="mt-2 text-sm text-gray-600">{formData.thumbnail.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Type *
            </label>
            <select
              name="videoType"
              value={formData.videoType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select video type</option>
              <option value="Music">Music</option>
              <option value="Movies">Movies</option>
              <option value="Gaming">Gaming</option>
              <option value="News">News</option>
              <option value="Sports">Sports</option>
              <option value="Learning">Learning</option>
              <option value="Fashion">Fashion</option>
            </select>
          </div>


        </div>

        <button
          type="submit"
          disabled={loading || isUploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Uploading... {Math.round(uploadProgress)}%
            </div>
          ) : loading ? (
            "Processing..."
          ) : (
            "Upload Video"
          )}
        </button>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1 text-center">
              Upload Progress: {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </form>
    </div>
  )

  const renderVideoList = () => (
    <div className="bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Manage Videos</h2>
        <div className="flex items-center space-x-3">
          <input 
            type="text" 
            placeholder="Search videos..."
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            Filter
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading videos...</div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos uploaded yet</h3>
              <p className="text-gray-600">Upload your first video to get started!</p>
            </div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="flex items-center bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Video Thumbnail and Info */}
                <div className="flex items-center flex-1 space-x-4">
                  <div className="relative cursor-pointer" onClick={() => handleViewVideo(video.id)}>
                    <img
                      src={video.thumbnail || "https://picsum.photos/160/90?random=" + video.id}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleViewVideo(video.id)}
                      title="Click to view video"
                    >
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {video.views || 0} views
                      </span>
                      <span>
                        {video.likes || 0} likes
                      </span>
                      <span>
                        {video.uploadTime ? new Date(video.uploadTime).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ml-4">
                  {/* Status Badge */}
                  <button
                    onClick={() => handlePublishToggle(video.id, video.isPublished)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      video.isPublished
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {video.isPublished ? "Published" : "Unpublished"}
                  </button>

                  {/* Playlist Actions */}
                  <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setSelectedVideoForPlaylist(video)
                        setShowPlaylistModal(true)
                      }}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Add to playlist"
                    >
                      <FolderPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedVideoForPlaylist(video)
                        setShowPlaylistEditModal(true)
                      }}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                      title="Manage playlists"
                    >
                      <FolderEdit className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Video Actions */}
                  <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                    <button
                      onClick={() => handleEditVideo(video)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit video"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* More Options */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === video.id ? null : video.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {openDropdown === video.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`)
                              setOpenDropdown(null)
                              showToast("Video link copied to clipboard!", "success")
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => {
                              handleViewVideo(video.id)
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Video
                          </button>
                          <button
                            onClick={() => {
                              handleEditVideo(video)
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit Details
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDeleteVideo(video.id)
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete Video
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )

  const renderAnalytics = () => {
    // Format numbers with commas for better readability
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toLocaleString();
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <button
            onClick={fetchAnalyticsData}
            disabled={analyticsLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {analyticsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading analytics...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Views</p>
                  <p className="text-3xl font-bold">{formatNumber(analyticsData.totalViews)}</p>
                </div>
                <Eye className="w-12 h-12 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Subscribers</p>
                  <p className="text-3xl font-bold">{formatNumber(analyticsData.totalSubscribers)}</p>
                </div>
                <Users className="w-12 h-12 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Videos</p>
                  <p className="text-3xl font-bold">{formatNumber(analyticsData.totalVideos)}</p>
                </div>
                <Video className="w-12 h-12 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Total Likes</p>
                  <p className="text-3xl font-bold">{formatNumber(analyticsData.totalLikes)}</p>
                </div>
                <Heart className="w-12 h-12 text-red-200" />
              </div>
            </div>
          </div>
        )}
        
        {/* Additional Analytics Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Average views per video</div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData.totalVideos > 0 
                  ? formatNumber(Math.round(analyticsData.totalViews / analyticsData.totalVideos))
                  : '0'
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Average likes per video</div>
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData.totalVideos > 0 
                  ? formatNumber(Math.round(analyticsData.totalLikes / analyticsData.totalVideos))
                  : '0'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Channel</h1>
      
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upload"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Video
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "manage"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <List className="w-4 h-4 inline mr-2" />
              Manage Videos
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "upload" && renderUploadForm()}
      {activeTab === "manage" && renderVideoList()}
      {activeTab === "analytics" && renderAnalytics()}

      {/* Edit Video Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Video</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Thumbnail (Optional)
                  </label>
                  <input
                    type="file"
                    name="thumbnail"
                    onChange={handleEditFormChange}
                    accept="image/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editFormData.thumbnail && (
                    <p className="mt-2 text-sm text-gray-600">
                      New thumbnail: {editFormData.thumbnail.name}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Video"}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Add to Creator Playlist Modal */}
      <CreatorPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={selectedVideoForPlaylist?.id || selectedVideoForPlaylist?._id}
        videoTitle={selectedVideoForPlaylist?.title}
      />

      {/* Playlist Edit Modal */}
      <PlaylistEditModal
        isOpen={showPlaylistEditModal}
        onClose={() => setShowPlaylistEditModal(false)}
        videoId={selectedVideoForPlaylist?.id || selectedVideoForPlaylist?._id}
        videoTitle={selectedVideoForPlaylist?.title}
      />
    </div>
  )
}

export default MyChannel
