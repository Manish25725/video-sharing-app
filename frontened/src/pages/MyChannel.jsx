import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Upload, Plus, List, BarChart3, Users, Video, Trash2, Edit, Eye, Play, MoreVertical, Settings, Bell, Heart, MessageCircle, Share2, FolderPlus, FolderEdit, Radio, Search } from "lucide-react"
import { videoService, transformVideosArray } from "../services/videoService"
import { dashboardService } from "../services/dashboardService"
import { likeService } from "../services/likeService"
import { useAuth } from "../contexts/AuthContext"
import socketService from "../services/socketService"
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
    videoType: "",
    subtitle: null
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

  // Manage videos search/filter state
  const [videoSearch, setVideoSearch] = useState('')
  const [videoFilter, setVideoFilter] = useState('all')

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

  const handleGenerateSubtitles = async (videoId) => {
    setSubtitleGenerating(videoId)
    setSubtitleStep("Starting…")
    try {
      // Enqueue the job — returns immediately with a jobId
      // apiClient already unwraps response.data, so the ApiResponse fields
      // are at the top level: response.statuscode / response.data / response.message
      const response = await videoService.generateSubtitles(videoId)
      const { jobId, status } = response?.data ?? {}

      // Server says subtitles already exist — no need to poll
      if (status === "already_exists") {
        setSubtitleGenerating(null)
        setSubtitleStep("")
        showToast("Subtitles are already generated for this video.", "success")
        return
      }

      // Server says job is already in progress — attach to existing job
      if (status === "waiting" || status === "active" || status === "delayed") {
        showToast("Subtitle generation is already in progress…", "success")
      } else {
        showToast("Subtitle generation started… this may take a minute.", "success")
      }

      if (!jobId) throw new Error("No job ID returned from server")

      // Poll every 4 seconds until the job completes or fails
      subtitlePollRef.current = setInterval(async () => {
        try {
          const statusRes = await videoService.getSubtitleJobStatus(videoId, jobId)
          const state    = statusRes?.data?.state
          const stepMsg  = statusRes?.data?.progress?.message

          // Update the live step label whenever the worker reports a new step
          if (stepMsg) setSubtitleStep(stepMsg)

          if (state === "completed") {
            clearInterval(subtitlePollRef.current)
            subtitlePollRef.current = null
            setSubtitleGenerating(null)
            setSubtitleStep("")
            showToast("Subtitles generated successfully! 🎉", "success")
            fetchUserVideos()
          } else if (state === "failed") {
            clearInterval(subtitlePollRef.current)
            subtitlePollRef.current = null
            setSubtitleGenerating(null)
            setSubtitleStep("")
            showToast(statusRes?.data?.reason || "Failed to generate subtitles", "error")
          }
          // else: waiting | active | delayed — keep polling
        } catch {
          clearInterval(subtitlePollRef.current)
          subtitlePollRef.current = null
          setSubtitleGenerating(null)
          setSubtitleStep("")
          showToast("Lost connection while checking subtitle status", "error")
        }
      }, 4000)

    } catch (err) {
      console.error("Generate subtitles error:", err)
      setSubtitleGenerating(null)
      setSubtitleStep("")
      const msg = err?.message || "Failed to start subtitle generation"
      showToast(msg, "error")
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
        },
        formData.subtitle || null
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
          videoType: "",
          subtitle: null
        })
        // Reset file inputs
        document.querySelector('input[name="video"]').value = ''
        document.querySelector('input[name="thumbnail"]').value = ''
        const subtitleInput = document.querySelector('input[name="subtitle"]')
        if (subtitleInput) subtitleInput.value = ''
        
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Upload Video</h1>
        <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
          Publish your latest masterpiece to the PlayVibe community.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Video file drop zone */}
            <label
              className="flex flex-col items-center justify-center gap-6 rounded-2xl px-6 py-16 cursor-pointer transition-all"
              style={{
                border: '2px dashed rgba(236,91,19,0.35)',
                background: formData.video ? 'rgba(236,91,19,0.08)' : 'rgba(236,91,19,0.04)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,91,19,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = formData.video ? 'rgba(236,91,19,0.08)' : 'rgba(236,91,19,0.04)')}
            >
              <input
                type="file"
                name="video"
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
                required
              />
              <div className="flex flex-col items-center gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform"
                  style={{ background: 'rgba(236,91,19,0.2)', color: '#ec5b13' }}
                >
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    {formData.video ? formData.video.name : 'Drag and drop video file'}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                    {formData.video
                      ? 'Click to change file'
                      : 'MP4, MOV, or AVI up to 4GB. Your video will remain private until you publish.'}
                  </p>
                </div>
              </div>
              {!formData.video && (
                <div
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white pointer-events-none"
                  style={{ background: '#ec5b13', boxShadow: '0 4px 16px rgba(236,91,19,0.3)' }}
                >
                  Select File
                </div>
              )}
            </label>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: '#cbd5e1' }}>Video Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Give your video a catchy name"
                required
                className="w-full rounded-xl p-4 text-white outline-none transition-all placeholder:text-slate-600"
                style={{
                  background: 'rgba(236,91,19,0.05)',
                  border: '1px solid rgba(236,91,19,0.2)',
                }}
                onFocus={e => { e.target.style.border = '1px solid rgba(236,91,19,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,91,19,0.08)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(236,91,19,0.2)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: '#cbd5e1' }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Tell viewers what your video is about..."
                required
                className="w-full rounded-xl p-4 text-white outline-none transition-all resize-none placeholder:text-slate-600"
                style={{
                  background: 'rgba(236,91,19,0.05)',
                  border: '1px solid rgba(236,91,19,0.2)',
                }}
                onFocus={e => { e.target.style.border = '1px solid rgba(236,91,19,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,91,19,0.08)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(236,91,19,0.2)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Subtitles */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: '#cbd5e1' }}>
                Subtitles / Captions <span style={{ color: '#64748b', fontWeight: 400 }}>(optional — .vtt)</span>
              </label>
              <label
                className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                style={{ background: 'rgba(236,91,19,0.04)', border: '1px dashed rgba(236,91,19,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,91,19,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(236,91,19,0.04)')}
              >
                <Upload className="w-4 h-4 flex-shrink-0" style={{ color: '#ec5b13' }} />
                <span className="text-sm font-semibold" style={{ color: '#ec5b13' }}>Choose .vtt file</span>
                <span className="text-sm flex-1 truncate" style={{ color: '#64748b' }}>
                  {formData.subtitle ? formData.subtitle.name : 'No file selected — auto captions will be generated'}
                </span>
                <input
                  type="file"
                  name="subtitle"
                  onChange={handleFileChange}
                  accept=".vtt"
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">

            {/* Thumbnail */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: '#cbd5e1' }}>Thumbnail</label>
              <label
                className="aspect-video w-full rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden relative transition-all"
                style={{ border: '2px dashed rgba(236,91,19,0.25)', background: 'rgba(236,91,19,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,91,19,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = formData.thumbnail ? 'rgba(236,91,19,0.04)' : 'rgba(236,91,19,0.04)')}
              >
                {formData.thumbnail ? (
                  <img
                    src={URL.createObjectURL(formData.thumbnail)}
                    alt="Thumbnail preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Upload className="w-8 h-8" style={{ color: 'rgba(236,91,19,0.6)' }} />
                    <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Click to upload image</p>
                  </>
                )}
                <input
                  type="file"
                  name="thumbnail"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  required
                />
              </label>
              <p className="text-xs" style={{ color: '#64748b' }}>
                A good thumbnail stands out and gets more clicks.
              </p>
            </div>

            {/* Settings card */}
            <div
              className="p-5 rounded-2xl flex flex-col gap-4"
              style={{ background: 'rgba(236,91,19,0.05)', border: '1px solid rgba(236,91,19,0.12)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Visibility</span>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider"
                  style={{ background: 'rgba(236,91,19,0.2)', color: '#ec5b13' }}
                >
                  Public
                </span>
              </div>
              <div style={{ borderTop: '1px solid rgba(236,91,19,0.08)' }} />
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold" style={{ color: '#94a3b8' }}>Category</label>
                <select
                  name="videoType"
                  value={formData.videoType}
                  onChange={handleInputChange}
                  required
                  className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-right"
                  style={{ color: '#ec5b13' }}
                >
                  <option value="" style={{ background: '#221610' }}>Select type</option>
                  <option value="Music" style={{ background: '#221610' }}>Music</option>
                  <option value="Movies" style={{ background: '#221610' }}>Movies</option>
                  <option value="Gaming" style={{ background: '#221610' }}>Gaming</option>
                  <option value="News" style={{ background: '#221610' }}>News</option>
                  <option value="Sports" style={{ background: '#221610' }}>Sports</option>
                  <option value="Learning" style={{ background: '#221610' }}>Learning</option>
                  <option value="Fashion" style={{ background: '#221610' }}>Fashion</option>
                </select>
              </div>
            </div>

            {/* Upload button + progress */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || isUploading}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-black text-base text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.35)' }}
                onMouseEnter={e => !loading && !isUploading && (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading... {Math.round(uploadProgress)}%
                  </>
                ) : loading ? (
                  'Processing...'
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Video
                  </>
                )}
              </button>

              {/* Progress bar */}
              {isUploading && (
                <div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(236,91,19,0.15)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%`, background: '#ec5b13' }}
                    />
                  </div>
                  <p className="text-xs text-center mt-1" style={{ color: '#94a3b8' }}>
                    {Math.round(uploadProgress)}% uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Terms notice */}
            <div
              className="p-4 rounded-xl flex gap-3"
              style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.18)' }}
            >
              <Plus className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ca8a04' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#a16207' }}>
                By uploading you agree to PlayVibe's Terms of Service and Community Guidelines.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )

  const renderVideoList = () => {
    const filtered = videos.filter(v => {
      const matchesSearch = !videoSearch || v.title?.toLowerCase().includes(videoSearch.toLowerCase());
      const matchesFilter =
        videoFilter === 'all' ||
        (videoFilter === 'live' && v.isLive) ||
        (videoFilter === 'shorts' && v.isShort);
      return matchesSearch && matchesFilter;
    });

    return (
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">Manage Videos</h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              You have {videos.length} uploaded video{videos.length !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
            style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.3)' }}
          >
            <Upload className="w-5 h-5" />
            Upload New
          </button>
        </div>

        {/* Filter + Search bar */}
        <div
          className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 rounded-2xl mb-6"
          style={{ background: 'rgba(45,30,22,0.4)', border: '1px solid rgba(236,91,19,0.1)' }}
        >
          <div
            className="flex gap-6 pb-3 md:pb-0 md:pr-6 w-full md:w-auto"
            style={{ borderBottom: 'none', borderRight: 'none' }}
          >
            {['all', 'shorts', 'live'].map(tab => (
              <button
                key={tab}
                onClick={() => setVideoFilter(tab)}
                className="text-sm font-bold pb-1 transition-colors"
                style={{
                  color: videoFilter === tab ? '#ec5b13' : '#94a3b8',
                  borderBottom: videoFilter === tab ? '2px solid #ec5b13' : '2px solid transparent',
                }}
              >
                {tab === 'all' ? 'All Videos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search your library..."
              value={videoSearch}
              onChange={e => setVideoSearch(e.target.value)}
              className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none"
              style={{
                background: 'rgba(236,91,19,0.06)',
                border: '1px solid rgba(236,91,19,0.12)',
                color: '#f1f5f9',
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl animate-pulse"
                style={{ background: 'rgba(45,30,22,0.4)', border: '1px solid rgba(236,91,19,0.08)' }}>
                <div className="w-48 shrink-0 rounded-xl" style={{ aspectRatio: '16/9', background: 'rgba(61,40,29,0.8)' }} />
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-5 rounded" style={{ background: 'rgba(61,40,29,0.8)' }} />
                  <div className="h-4 w-2/3 rounded" style={{ background: 'rgba(61,40,29,0.6)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(236,91,19,0.1)', boxShadow: '0 0 40px rgba(236,91,19,0.15)' }}>
              <Video className="w-10 h-10" style={{ color: '#ec5b13' }} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">
              {videoSearch ? 'No videos found' : 'No videos uploaded yet'}
            </h3>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              {videoSearch ? `No videos match "${videoSearch}"` : 'Upload your first video to get started!'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(video => (
              <div
                key={video.id}
                className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl transition-all"
                style={{ background: 'rgba(45,30,22,0.4)', border: '1px solid rgba(236,91,19,0.08)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = '1px solid rgba(236,91,19,0.35)';
                  e.currentTarget.style.background = 'rgba(45,30,22,0.65)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = '1px solid rgba(236,91,19,0.08)';
                  e.currentTarget.style.background = 'rgba(45,30,22,0.4)';
                }}
              >
                {/* Thumbnail */}
                <div
                  className="relative flex-shrink-0 w-full md:w-48 rounded-xl overflow-hidden cursor-pointer"
                  style={{ aspectRatio: '16/9', background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(236,91,19,0.1)' }}
                  onClick={() => handleViewVideo(video.id)}
                >
                  <img
                    src={video.thumbnail || `https://picsum.photos/192/108?random=${video.id}`}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.4)' }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#ec5b13' }}>
                      <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  <span
                    className="absolute bottom-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.8)' }}
                  >
                    {formatDuration(video.duration)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <h3
                    className="font-bold text-lg truncate cursor-pointer transition-colors"
                    style={{ color: '#f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ec5b13')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#f1f5f9')}
                    onClick={() => handleViewVideo(video.id)}
                  >
                    {video.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: '#94a3b8' }}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {video.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#64748b' }} />
                      {video.uploadTime ? new Date(video.uploadTime).toLocaleDateString() : 'Recently'}
                    </span>
                    <button
                      onClick={() => handlePublishToggle(video.id, video.isPublished)}
                      className="px-2 py-0.5 rounded text-xs font-bold transition-colors"
                      style={video.isPublished ? {
                        background: 'rgba(34,197,94,0.1)',
                        color: '#4ade80',
                        border: '1px solid rgba(34,197,94,0.2)',
                      } : {
                        background: 'rgba(100,116,139,0.1)',
                        color: '#94a3b8',
                        border: '1px solid rgba(100,116,139,0.2)',
                      }}
                    >
                      {video.isPublished ? 'Public' : 'Unpublished'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 flex-wrap">
                  <button
                    onClick={() => { setSelectedVideoForPlaylist(video); setShowPlaylistModal(true); }}
                    className="p-2 rounded-lg transition-all"
                    title="Add to playlist"
                    style={{ background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(236,91,19,0.1)', color: '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ec5b13'; e.currentTarget.style.border = '1px solid rgba(236,91,19,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid rgba(236,91,19,0.1)'; }}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setSelectedVideoForPlaylist(video); setShowPlaylistEditModal(true); }}
                    className="p-2 rounded-lg transition-all"
                    title="Manage playlists"
                    style={{ background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(236,91,19,0.1)', color: '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ec5b13'; e.currentTarget.style.border = '1px solid rgba(236,91,19,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.border = '1px solid rgba(236,91,19,0.1)'; }}
                  >
                    <FolderEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditVideo(video)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{ background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(236,91,19,0.1)', color: '#f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,40,29,1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(61,40,29,0.8)')}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden xl:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleViewVideo(video.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{ background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(236,91,19,0.1)', color: '#f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,40,29,1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(61,40,29,0.8)')}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden xl:inline">View</span>
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-2 rounded-lg transition-all"
                    title="Delete video"
                    style={{ background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.border = '1px solid rgba(239,68,68,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,40,29,0.8)'; e.currentTarget.style.border = '1px solid rgba(239,68,68,0.15)'; }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === video.id ? null : video.id)}
                      className="p-2 rounded-lg transition-all"
                      title="More options"
                      style={{ background: 'rgba(61,40,29,0.8)', border: '1px solid rgba(236,91,19,0.1)', color: '#94a3b8' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openDropdown === video.id && (
                      <div
                        className="absolute right-0 mt-2 w-48 rounded-xl z-20 overflow-hidden shadow-2xl"
                        style={{ background: 'rgba(34,22,16,0.97)', border: '1px solid rgba(236,91,19,0.15)', backdropFilter: 'blur(16px)' }}
                      >
                        {[
                          { label: 'Copy Link', action: () => { navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`); setOpenDropdown(null); showToast('Video link copied!', 'success'); } },
                          { label: 'View Video', action: () => { handleViewVideo(video.id); setOpenDropdown(null); } },
                          { label: 'Edit Details', action: () => { handleEditVideo(video); setOpenDropdown(null); } },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                            style={{ color: '#cbd5e1' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,91,19,0.1)'; e.currentTarget.style.color = '#ec5b13'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                          >
                            {item.label}
                          </button>
                        ))}
                        <div style={{ borderTop: '1px solid rgba(236,91,19,0.1)' }} />
                        <button
                          onClick={() => { handleDeleteVideo(video.id); setOpenDropdown(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#f87171' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          Delete Video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const renderAnalytics = () => {
    const formatNumber = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return (num || 0).toLocaleString();
    };

    const avgViews = analyticsData.totalVideos > 0
      ? Math.round(analyticsData.totalViews / analyticsData.totalVideos) : 0;
    const avgLikes = analyticsData.totalVideos > 0
      ? Math.round(analyticsData.totalLikes / analyticsData.totalVideos) : 0;

    const statCards = [
      {
        label: 'Total Views', value: formatNumber(analyticsData.totalViews),
        icon: <Eye className="w-6 h-6" />,
        gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        glow: 'rgba(37,99,235,0.35)',
      },
      {
        label: 'Subscribers', value: formatNumber(analyticsData.totalSubscribers),
        icon: <Users className="w-6 h-6" />,
        gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        glow: 'rgba(124,58,237,0.35)',
      },
      {
        label: 'Total Videos', value: formatNumber(analyticsData.totalVideos),
        icon: <Video className="w-6 h-6" />,
        gradient: 'linear-gradient(135deg, #059669, #047857)',
        glow: 'rgba(5,150,105,0.35)',
      },
      {
        label: 'Total Likes', value: formatNumber(analyticsData.totalLikes),
        icon: <Heart className="w-6 h-6" />,
        gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        glow: 'rgba(220,38,38,0.35)',
      },
    ];

    // bar chart heights (mock)
    const bars = [40, 65, 50, 80, 95, 70, 60, 45, 75, 90, 85, 100];

    return (
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">Channel Analytics</h1>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Detailed performance breakdown for the last 30 days</p>
          </div>
          <button
            onClick={fetchAnalyticsData}
            disabled={analyticsLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: 'rgba(236,91,19,0.15)', border: '1px solid rgba(236,91,19,0.3)', color: '#ec5b13' }}
            onMouseEnter={e => !analyticsLoading && (e.currentTarget.style.background = 'rgba(236,91,19,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(236,91,19,0.15)')}
          >
            <BarChart3 className="w-4 h-4" />
            {analyticsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {analyticsLoading ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl animate-pulse"
                  style={{ background: 'rgba(45,30,22,0.5)' }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statCards.map(card => (
                <div key={card.label} className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl"
                  style={{ background: card.gradient, boxShadow: `0 8px 32px ${card.glow}` }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{card.label}</p>
                  <h3 className="text-3xl font-black mt-1">{card.value}</h3>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <div className="text-9xl">{card.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts + Quick Stats row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Bar chart */}
              <div className="lg:col-span-2 p-6 rounded-2xl"
                style={{ background: 'rgba(45,30,22,0.4)', border: '1px solid rgba(236,91,19,0.1)' }}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white">Views Trend</h3>
                    <p className="text-sm" style={{ color: '#64748b' }}>Daily views across last 30 days</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ background: '#ec5b13' }}>Daily</span>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(45,30,22,0.8)', color: '#94a3b8' }}>Weekly</span>
                  </div>
                </div>
                <div className="h-52 flex items-end justify-between gap-1">
                  {bars.map((h, i) => (
                    <div key={i} className="w-full rounded-t-lg transition-all cursor-pointer group"
                      style={{ height: `${h}%`, background: 'rgba(236,91,19,0.25)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ec5b13')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(236,91,19,0.25)')}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-4" style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
                  <span>1 Mar</span><span>10 Mar</span><span>20 Mar</span><span>30 Mar</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="p-6 rounded-2xl"
                style={{ background: 'rgba(45,30,22,0.4)', border: '1px solid rgba(236,91,19,0.1)' }}>
                <h3 className="text-xl font-bold text-white mb-6">Quick Stats</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Avg. Views / video', value: formatNumber(avgViews), iconBg: 'rgba(37,99,235,0.15)', iconColor: '#60a5fa', icon: <BarChart3 className="w-5 h-5" /> },
                    { label: 'Avg. Likes / video',  value: formatNumber(avgLikes), iconBg: 'rgba(220,38,38,0.15)', iconColor: '#f87171', icon: <Heart className="w-5 h-5" /> },
                    { label: 'Avg. Watch Time',     value: '—',                   iconBg: 'rgba(124,58,237,0.15)', iconColor: '#a78bfa', icon: <Play className="w-5 h-5" /> },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className="p-3 rounded-xl flex-shrink-0" style={{ background: item.iconBg, color: item.iconColor }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{item.label}</p>
                        <p className="text-lg font-black text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="w-full mt-8 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'rgba(236,91,19,0.08)', border: '1px solid rgba(236,91,19,0.15)', color: '#94a3b8' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ec5b13'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(236,91,19,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  Download Full Report
                </button>
              </div>
            </div>

            {/* AI Insights banner */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(236,91,19,0.12), rgba(236,91,19,0.04))', border: '1px solid rgba(236,91,19,0.2)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{ background: '#ec5b13', boxShadow: '0 8px 24px rgba(236,91,19,0.35)' }}>
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-bold text-white mb-1">PlayVibe AI Insights</h4>
                <p style={{ color: '#94a3b8' }}>
                  Your channel is growing. Upload consistently to boost your reach — channels posting 3+ videos/week see <strong className="text-white">2x subscriber growth</strong> on average.
                </p>
              </div>
              <button
                className="px-6 py-3 rounded-xl font-bold text-white whitespace-nowrap transition-all hover:scale-105"
                style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.35)' }}
              >
                Apply Strategy
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#221610' }}>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-white">My Channel</h1>
        <Link
          to="/go-live"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{ background: '#ec5b13', boxShadow: '0 4px 20px rgba(236,91,19,0.35)' }}
        >
          <Radio className="w-4 h-4" />
          Go Live
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(45,30,22,0.6)', border: '1px solid rgba(236,91,19,0.1)' }}>
          {[
            { id: 'upload',    icon: <Upload className="w-4 h-4" />,   label: 'Upload Video' },
            { id: 'manage',    icon: <List className="w-4 h-4" />,     label: 'Manage Videos' },
            { id: 'analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={activeTab === tab.id ? {
                background: '#ec5b13',
                color: '#fff',
                boxShadow: '0 2px 12px rgba(236,91,19,0.35)',
              } : {
                color: '#94a3b8',
                background: 'transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
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
