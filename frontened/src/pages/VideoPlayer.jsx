import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { ThumbsUp, ThumbsDown, Share, Download, MoreHorizontal, Bell, Play, Eye, MessageCircle } from "lucide-react"
import { videoService } from "../services/videoService"
import { likeService } from "../services/likeService"
import { subscriptionService } from "../services/subscriptionService"
import { commentService, transformCommentsArray } from "../services/commentService"
import { useAuth } from "../contexts/AuthContext"
import { formatDate, formatTimeAgo } from "../utils/formatters"
import '../styles/VideoPlayer.css'

const VideoPlayer = () => {
  const { videoId } = useParams()
  const { user } = useAuth()
  const [video, setVideo] = useState(null)
  const [videoStats, setVideoStats] = useState({ views: 0, likesCount: 0, isLikedByUser: false })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [hasViewBeenCounted, setHasViewBeenCounted] = useState(false) // Track if view was already counted
  const [isIncrementingView, setIsIncrementingView] = useState(false) // Prevent multiple simultaneous calls

  useEffect(() => {
    if (videoId) {
      fetchVideoData()
      fetchVideoStats()
      fetchRelatedVideos()
      fetchComments()
      // Reset view tracking for new video
      setHasViewBeenCounted(false)
      setIsIncrementingView(false)
    }
  }, [videoId])

  const fetchVideoData = async () => {
    try {
      setLoading(true)
      const response = await videoService.getVideoById(videoId)
      console.log('Video data response:', response)
      if (response && response.data) {
        console.log('Video createdAt:', response.data.createdAt, typeof response.data.createdAt)
        setVideo(response.data)
        console.log('Video owner:', response.data.owner)
        console.log('Current user:', user)
        console.log('Is own video:', user?._id === response.data.owner?._id)
        // Check subscription status if user is logged in and video has owner
        if (user && response.data.owner?._id) {
          checkSubscriptionStatus(response.data.owner._id)
        }
      } else {
        setError("Video not found")
      }
    } catch (err) {
      console.error("Error fetching video:", err)
      setError("Failed to load video")
    } finally {
      setLoading(false)
    }
  }

  const fetchVideoStats = async () => {
    try {
      const response = await videoService.getVideoStats(videoId)
      if (response && response.data) {
        setVideoStats(response.data)
      }
    } catch (err) {
      console.error("Error fetching video stats:", err)
    }
  }

  const incrementViewCount = async () => {
    // Only increment view count once per video session and prevent concurrent calls
    if (hasViewBeenCounted || isIncrementingView) {
      console.log('View already counted or currently being counted for this session');
      return;
    }

    try {
      setIsIncrementingView(true); // Prevent concurrent calls
      console.log('Incrementing view count for video:', videoId);
      
      const response = await videoService.incrementViews(videoId)
      
      if (response && response.success) {
        setHasViewBeenCounted(true) // Mark view as counted
        
        // Update local view count in stats
        setVideoStats(prev => ({
          ...prev,
          views: response.data?.views || (prev.views || 0) + 1
        }))
        
        console.log('View count incremented successfully');
      }
    } catch (err) {
      console.error("Error incrementing views:", err)
    } finally {
      setIsIncrementingView(false); // Reset the flag
    }
  }

  // Handle share functionality
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: `Check out this video: ${video.title}`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
        alert('Unable to copy link')
      }
    }
  }

  // Handle dislike functionality
  const handleDislike = () => {
    // For now, just show a message since we haven't implemented dislikes in backend
    alert('Dislike feature coming soon!')
  }

  // Handle more options
  const handleMoreOptions = () => {
    alert('More options coming soon!')
  }

  // Handle comment like/dislike
  const handleCommentLike = async (commentId) => {
    try {
      // This would need to be implemented in the backend
      console.log('Like comment:', commentId)
      alert('Comment like feature coming soon!')
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const handleCommentReply = (commentId) => {
    // This would need to be implemented
    console.log('Reply to comment:', commentId)
    alert('Reply feature coming soon!')
  }

  const fetchRelatedVideos = async () => {
    try {
      const response = await videoService.getAllVideos(1, 10)
      if (response && response.data) {
        // Filter out current video and transform data
        const filteredVideos = response.data
          .filter(v => v._id !== videoId)
          .slice(0, 10)
          .map(v => ({
            id: v._id,
            title: v.title,
            thumbnail: v.thumbnail,
            channelName: v.owner?.fullName || v.owner?.userName || 'Unknown',
            channelAvatar: v.owner?.avatar,
            views: v.views || 0,
            uploadTime: formatTimeAgo(v.createdAt),
            duration: v.duration || "0:00"
          }))
        setRelatedVideos(filteredVideos)
      }
    } catch (err) {
      console.error("Error fetching related videos:", err)
    }
  }

  const fetchComments = async () => {
    try {
      setCommentsLoading(true)
      const response = await commentService.getVideoComments(videoId)
      if (response && response.data) {
        setComments(transformCommentsArray(response.data))
      }
    } catch (err) {
      console.error("Error fetching comments:", err)
    } finally {
      setCommentsLoading(false)
    }
  }

  const checkSubscriptionStatus = async (channelId) => {
    try {
      const isSubscribed = await subscriptionService.isSubscribedToChannel(channelId);
      setIsSubscribed(isSubscribed);
      console.log('Subscription status:', isSubscribed);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setIsSubscribed(false);
    }
  }

  const handleToggleLike = async () => {
    if (!user) {
      alert("Please login to like videos")
      return
    }

    try {
      const response = await likeService.toggleVideoLike(videoId)
      if (response && response.success) {
        // Update local state
        setVideoStats(prev => ({
          ...prev,
          isLikedByUser: !prev.isLikedByUser,
          likesCount: prev.isLikedByUser ? prev.likesCount - 1 : prev.likesCount + 1
        }))
      }
    } catch (err) {
      console.error("Error toggling like:", err)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please login to subscribe")
      return
    }

    if (!video?.owner?._id) return

    try {
      const response = await subscriptionService.toggleSubscription(video.owner._id)
      console.log('Toggle subscription response:', response)
      if (response && response.success) {
        const newSubscriptionStatus = !isSubscribed
        setIsSubscribed(newSubscriptionStatus)
        
        // Update the subscriber count in the video data
        if (response.data?.subscriberCount !== undefined) {
          setVideo(prev => ({
            ...prev,
            owner: {
              ...prev.owner,
              subscribersCount: response.data.subscriberCount
            }
          }))
        } else {
          // If no count returned, manually fetch updated video data
          fetchVideoData()
        }
      }
    } catch (err) {
      console.error("Error toggling subscription:", err)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert("Please login to comment")
      return
    }
    if (!newComment.trim()) return

    try {
      const response = await commentService.addComment(videoId, newComment.trim())
      if (response && response.success) {
        setNewComment("")
        fetchComments() // Refresh comments
      }
    } catch (err) {
      console.error("Error adding comment:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading video...</div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Not Found</h2>
          <p className="text-gray-600">{error || "The video you're looking for doesn't exist."}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  console.log('Rendering video player with:', { video, user, videoId });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative youtube-video-container">
              {video.videoFile ? (
                <video
                  controls
                  className="w-full h-full object-contain youtube-video-player"
                  poster={video.thumbnail}
                  onPlay={incrementViewCount}
                  controlsList="nodownload"
                  preload="metadata"
                  onError={(e) => console.error('Video playback error:', e)}
                >
                  <source src={video.videoFile} type="video/mp4" />
                  <source src={video.videoFile} type="video/webm" />
                  <source src={video.videoFile} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="relative w-full h-full youtube-thumbnail-container">
                  <img
                    src={video.thumbnail || "/placeholder.svg?height=480&width=854&text=Video"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 youtube-play-overlay group cursor-pointer">
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-all duration-200 shadow-lg group-hover:scale-110">
                        <Play className="w-8 h-8 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Video Title */}
            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              {video.title}
            </h1>

            {/* Video Stats and Actions */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>{(videoStats.views || 0).toLocaleString()} views</span>
                <span>•</span>
                <span>{formatTimeAgo(video.createdAt)}</span>
              </div>

              <div className="flex items-center space-x-1">
                {/* Like Button */}
                <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                  <button 
                    onClick={handleToggleLike}
                    className={`flex items-center space-x-2 px-4 py-2 hover:bg-gray-200 transition-colors ${
                      videoStats.isLikedByUser ? 'text-blue-600' : 'text-gray-700'
                    }`}
                    title={videoStats.isLikedByUser ? 'Remove like' : 'Like this video'}
                  >
                    <ThumbsUp className={`w-5 h-5 ${videoStats.isLikedByUser ? 'fill-current' : ''}`} />
                    <span className="font-medium">{(videoStats.likesCount || 0).toLocaleString()}</span>
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button 
                    onClick={handleDislike}
                    className="px-4 py-2 hover:bg-gray-200 transition-colors text-gray-700"
                    title="Dislike this video"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Share Button */}
                <button 
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-700 yt-button"
                  title="Share video"
                >
                  <Share className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </button>

                {/* More Options */}
                <button 
                  onClick={handleMoreOptions}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-700 yt-button"
                  title="More options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <img
                  src={video.owner?.avatar || "/placeholder.svg?height=40&width=40&text=User"}
                  alt={video.owner?.fullName || 'Channel'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {video.owner?.fullName || video.owner?.userName || 'Unknown Channel'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {(video.owner?.subscribersCount || 0).toLocaleString()} subscribers
                  </p>
                </div>
              </div>
              {user && user._id !== video.owner?._id ? (
                <button 
                  onClick={handleSubscribe}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-colors subscribe-button ${
                    isSubscribed 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={isSubscribed ? 'Unsubscribe' : 'Subscribe to this channel'}
                >
                  {isSubscribed ? (
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Subscribed</span>
                    </div>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              ) : user && user._id === video.owner?._id ? (
                <div className="flex items-center">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Your Video
                  </span>
                </div>
              ) : null}
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {video.description}
              </p>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {comments.length} Comments
                </h3>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800">
                  <span>Sort by</span>
                </button>
              </div>

              {/* Add Comment Form */}
              {user ? (
                <div className="flex space-x-3">
                  <img
                    src={user.avatar || "/placeholder.svg?height=32&width=32&text=You"}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full border-0 border-b border-gray-300 focus:border-gray-500 bg-transparent resize-none text-sm py-2 px-0 focus:outline-none"
                        rows={1}
                        onFocus={(e) => e.target.rows = 3}
                        onBlur={(e) => !newComment && (e.target.rows = 1)}
                      />
                      {newComment && (
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setNewComment("")}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Comment
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span>Sign in to leave a comment</span>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4 mt-6">
                {commentsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading comments...</div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <img
                        src={comment.user?.avatar || "/placeholder.svg?height=24&width=24&text=U"}
                        alt={comment.user?.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.user?.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">{comment.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <button 
                            onClick={() => handleCommentLike(comment.id)}
                            className="flex items-center space-x-1 hover:text-gray-800 transition-colors"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.likesCount || 0}</span>
                          </button>
                          <button 
                            onClick={handleDislike}
                            className="flex items-center space-x-1 hover:text-gray-800 transition-colors"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleCommentReply(comment.id)}
                            className="hover:text-gray-800 transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No comments yet. Be the first to share what you think!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:w-96 lg:shrink-0">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Videos</h3>
              {relatedVideos.length > 0 ? (
                relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo._id}
                    className="flex space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                    onClick={() => window.location.href = `/video/${relatedVideo._id}`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={relatedVideo.thumbnail || "/placeholder.svg?height=94&width=168&text=Video"}
                        alt={relatedVideo.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                        5:32
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600">
                        {relatedVideo.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-1 hover:text-gray-800">
                        {relatedVideo.owner?.fullName || relatedVideo.owner?.userName}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span>{(relatedVideo.views || 0).toLocaleString()} views</span>
                        <span>•</span>
                        <span>{formatTimeAgo(relatedVideo.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <p>No related videos found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
