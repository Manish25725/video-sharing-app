import { useState, useEffect } from "react"
import { Upload, Plus, List, BarChart3, Users, Video, Trash2, Edit, Eye, Play, MoreVertical, Settings, Bell, Heart, MessageCircle, Share2 } from "lucide-react"
import { videoService, transformVideosArray } from "../services/videoService"
import { useAuth } from "../contexts/AuthContext"

const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("manage")
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: null,
    video: null,
    playlist: ""
  })

  const [playlists] = useState([
    "Tech Reviews",
    "Coding Tutorials", 
    "Design Tips",
    "Music Videos",
    "Travel Vlogs"
  ])

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

  // Fetch videos on component mount
  useEffect(() => {
    if (user) {
      fetchUserVideos()
    }
  }, [user])

  const fetchUserVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await videoService.getAllVideos(1, 50, "", "createdAt", "desc", user._id)
      if (response.success) {
        const transformedVideos = transformVideosArray(response.data)
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
        alert("Failed to update video status")
      }
    } catch (error) {
      console.error("Error toggling publish status:", error)
      alert("Failed to update video status")
    }
  }

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        const response = await videoService.deleteVideo(videoId)
        if (response.success) {
          setVideos(prevVideos => prevVideos.filter(video => video.id !== videoId))
          alert("Video deleted successfully")
        } else {
          alert("Failed to delete video")
        }
      } catch (error) {
        console.error("Error deleting video:", error)
        alert("Failed to delete video")
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await videoService.publishVideo(formData, formData.video, formData.thumbnail)
      
      if (response.success) {
        alert("Video uploaded successfully!")
        setFormData({
          title: "",
          description: "",
          thumbnail: null,
          video: null,
          playlist: ""
        })
        // Refresh video list
        fetchUserVideos()
      } else {
        alert("Failed to upload video: " + (response.message || "Unknown error"))
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      alert("Failed to upload video")
    } finally {
      setLoading(false)
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add to Playlist (Optional)
          </label>
          <select
            name="playlist"
            value={formData.playlist}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a playlist</option>
            {playlists.map((playlist, index) => (
              <option key={index} value={playlist}>{playlist}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Uploading..." : "Upload Video"}
        </button>
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
                  <div className="relative">
                    <img
                      src={video.thumbnail || "https://picsum.photos/160/90?random=" + video.id}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {video.views || 0} views
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {video.likes || 0} likes
                      </span>
                      <span>
                        {video.uploadTime ? new Date(video.uploadTime).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Publish/Unpublish Toggle */}
                  <button
                    onClick={() => handlePublishToggle(video.id, video.isPublished)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      video.isPublished
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {video.isPublished ? "Published" : "Unpublished"}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      // Handle edit functionality
                      console.log("Edit video:", video.id)
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit video"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* More Options */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )

  const renderAnalytics = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Views</p>
              <p className="text-3xl font-bold">221,234</p>
            </div>
            <Eye className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Subscribers</p>
              <p className="text-3xl font-bold">4,053</p>
            </div>
            <Users className="w-12 h-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Videos</p>
              <p className="text-3xl font-bold">63</p>
            </div>
            <Video className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  )

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
    </div>
  )
}

export default AdminDashboard
