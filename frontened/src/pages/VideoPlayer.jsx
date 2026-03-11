import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download,
  MoreVertical,
  MessageCircle,
  Share,
  MoreHorizontal,
  Bell,
  Eye,
  Scissors,
  Bookmark,
  Clock,
  Flag,
  Plus,
  Captions
} from 'lucide-react';
import { videoService } from '../services/videoService';
import { likeService } from '../services/likeService';
import { dislikeService } from '../services/dislikeService';
import { commentService } from '../services/commentService';
import { subscriptionService } from '../services/subscriptionService';
import { downloadService } from '../services/downloadService';
import watchLaterService from '../services/watchLaterService';
import watchHistoryService from '../services/watchHistoryService';
import streamService from '../services/streamService';
import { transformCommentsArray } from "../services/commentService";
import { useAuth } from "../contexts/AuthContext";
import { formatDate, formatTimeAgo } from "../utils/formatters";
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import CommentComponent from '../components/CommentComponent';
import ReportModal from '../components/ReportModal';
import Toast from '../components/Toast';
import RelatedVideos from '../components/RelatedVideos';
import '../styles/VideoPlayer.css';

/* ─── Chat Replay Panel (for live stream recordings) ────────── */
const formatOffset = (secs) => {
  if (secs === null || secs === undefined) return "";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const ChatReplayPanel = ({ messages, allMessages, loading }) => {
  const endRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-20">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-red-500" />
        <span className="font-semibold text-sm text-gray-900">Live Chat Replay</span>
        {allMessages.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {messages.length} / {allMessages.length} messages
          </span>
        )}
      </div>
      <div className="h-[520px] overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-center">
            <MessageCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm">No chat was recorded for this stream.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 text-center">
            <MessageCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm">Play the video to see chat messages appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div key={msg._id || i} className="flex gap-2">
                <span className="text-[11px] text-gray-400 tabular-nums pt-0.5 flex-shrink-0 w-9">
                  {formatOffset(msg.offsetSeconds)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-indigo-600 mr-1.5">{msg.username}</span>
                  <span className="text-sm text-gray-800 break-words">{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
};

const VideoPlayer = () => {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [video, setVideo] = useState(null)
  const [videoStats, setVideoStats] = useState({ 
    views: 0, 
    likesCount: 0, 
    dislikesCount: 0,
    isLikedByUser: false, 
    isDislikedByUser: false 
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentActionsLoading, setCommentActionsLoading] = useState(new Set()) // Track loading state for comment actions
  const [hasViewBeenCounted, setHasViewBeenCounted] = useState(false) // Track if view was already counted
  const [isIncrementingView, setIsIncrementingView] = useState(false) // Prevent multiple simultaneous calls
  const [showMoreMenu, setShowMoreMenu] = useState(false) // For dropdown menu
  
  // Download state
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  
  // Watch Later state
  const [isInWatchLater, setIsInWatchLater] = useState(false)
  const [watchLaterLoading, setWatchLaterLoading] = useState(false)
  
  // Playlist Modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  // Video element ref (used for chat replay time sync)
  const videoRef = useRef(null)

  // Chat replay state (only active for live stream recordings that have video.streamKey)
  const [chatReplay, setChatReplay] = useState([])
  const [chatReplayLoading, setChatReplayLoading] = useState(false)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportToast, setReportToast] = useState(null)
  const [subtitlesOn, setSubtitlesOn] = useState(false)
  
  useEffect(() => {
    if (videoId) {
      fetchVideoData()
      fetchVideoStats()
      fetchComments()
      // Check if video is in watch later list
      if (user) {
        checkWatchLaterStatus()
      }
      // Reset view tracking for new video
      setHasViewBeenCounted(false)
      setIsIncrementingView(false)
    }
  }, [videoId, user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoreMenu && !event.target.closest('.more-options-container')) {
        setShowMoreMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  // Fetch chat replay messages when the video is a live stream recording
  useEffect(() => {
    if (!video?.streamKey) return;
    setChatReplayLoading(true);
    streamService.getChatReplay(video.streamKey)
      .then(({ data }) => setChatReplay(Array.isArray(data) ? data : []))
      .catch(() => setChatReplay([]))
      .finally(() => setChatReplayLoading(false));
  }, [video?.streamKey]);

  // Sync chat replay messages with the video's current playback time
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !video?.streamKey) return;
    const onTimeUpdate = () => setCurrentVideoTime(videoEl.currentTime);
    videoEl.addEventListener('timeupdate', onTimeUpdate);
    return () => videoEl.removeEventListener('timeupdate', onTimeUpdate);
  }, [video]);

  // Imperatively enable/disable subtitles based on user's playback preference
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !video?.subtitles?.length) return;

    const applySubtitlePreference = () => {
      const shouldShow = user?.playback?.subtitles === true;
      const tracks = Array.from(videoEl.textTracks);
      tracks.forEach((t, i) => {
        t.mode = shouldShow && i === 0 ? 'showing' : 'hidden';
      });
      setSubtitlesOn(shouldShow);
    };

    // Apply immediately if metadata already loaded, otherwise wait for it
    if (videoEl.readyState >= 1) {
      applySubtitlePreference();
    } else {
      videoEl.addEventListener('loadedmetadata', applySubtitlePreference);
      return () => videoEl.removeEventListener('loadedmetadata', applySubtitlePreference);
    }
  }, [video, user]);

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

        // Add to watch history if user is logged in
        if (user) {
          try {
            const re=await watchHistoryService.addToWatchHistory(videoId);
            console.log('Video added to watch history',re);
          } catch (historyError) {
            console.error('Error adding to watch history:', historyError);
            // Don't fail the entire operation if watch history fails
          }
        }
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
  const handleDislike = async () => {
    if (!user) {
      alert("Please login to dislike videos")
      return
    }

    try {
      const response = await dislikeService.toggleVideoDislike(videoId)
      if (response && response.success) {
        // If currently disliked, toggle it off
        if (videoStats.isDislikedByUser) {
          setVideoStats(prev => ({
            ...prev,
            dislikesCount: prev.dislikesCount - 1,
            isDislikedByUser: false
          }))
        } else {
          // If currently liked, remove like and add dislike
          if (videoStats.isLikedByUser) {
            // Remove like first
            await likeService.toggleVideoLike(videoId)
            setVideoStats(prev => ({
              ...prev,
              likesCount: prev.likesCount - 1,
              dislikesCount: prev.dislikesCount + 1,
              isLikedByUser: false,
              isDislikedByUser: true
            }))
          } else {
            // Just add dislike
            setVideoStats(prev => ({
              ...prev,
              dislikesCount: prev.dislikesCount + 1,
              isDislikedByUser: true
            }))
          }
        }
      }
    } catch (err) {
      console.error("Error toggling dislike:", err)
    }
  }  // Handle more options
  const handleMoreOptions = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  const toggleSubtitles = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const tracks = Array.from(videoEl.textTracks);
    if (tracks.length === 0) return;
    const next = !subtitlesOn;
    tracks.forEach(t => { t.mode = next ? 'showing' : 'hidden'; });
    setSubtitlesOn(next);
  };

  // Handle download video
  const handleDownloadVideo = async () => {
    if (!video) {
      alert('Video not loaded')
      setShowMoreMenu(false)
      return
    }

    setIsDownloading(true)
    setDownloadProgress(0)
    setShowMoreMenu(false)

    try {
      const filename = downloadService.generateSafeFilename(video.title)
      
      await downloadService.downloadVideoWithProgress(
        video.videoFile,
        filename,
        (progress) => {
          setDownloadProgress(progress)
        }
      )
      
      // Success
      setDownloadProgress(100)
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 1000)
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  // Handle clip creation
  const handleCreateClip = () => {
    alert('Clip creation feature coming soon!')
    setShowMoreMenu(false)
  }

  // Handle save to playlist
  const handleSaveVideo = async () => {
    if (!user) {
      alert('Please log in to save videos')
      setShowMoreMenu(false)
      return
    }

    try {
      setWatchLaterLoading(true)
      if (isInWatchLater) {
        // Remove from watch later
        await watchLaterService.removeFromWatchLater(videoId)
        setIsInWatchLater(false)
        alert('Video removed from Watch Later!')
      } else {
        // Add to watch later
        await watchLaterService.addToWatchLater(videoId)
        setIsInWatchLater(true)
        alert('Video added to Watch Later!')
      }
    } catch (error) {
      console.error('Error toggling watch later:', error)
      alert('Failed to update Watch Later list')
    } finally {
      setWatchLaterLoading(false)
      setShowMoreMenu(false)
    }
  }

  // Handle report video
  const handleReportVideo = () => {
    setShowReportModal(true)
    setShowMoreMenu(false)
  }

  // Handle comment like/dislike
  const handleCommentLike = async (commentId) => {
    if (!user) {
      alert('Please login to like comments')
      return
    }

    // Prevent multiple clicks
    if (commentActionsLoading.has(commentId)) {
      console.log('Action already in progress for comment:', commentId)
      return
    }

    try {
      // Add to loading set
      setCommentActionsLoading(prev => new Set(prev).add(commentId))
      
      console.log('Attempting to like comment:', commentId)

      const response = await likeService.toggleCommentLike(commentId)
      console.log('Like response:', response)
      
      if (response && response.success) {
        // Simply refresh the comments to get the updated state from backend
        await fetchComments()
      } else {
        alert('Failed to like comment')
      }
    } catch (error) {
      console.error('Error liking comment:', error)
      alert('Failed to like comment')
    } finally {
      // Remove from loading set
      setCommentActionsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  const handleCommentDislike = async (commentId) => {
    if (!user) {
      alert('Please login to dislike comments')
      return
    }

    // Prevent multiple clicks
    if (commentActionsLoading.has(commentId)) {
      console.log('Action already in progress for comment:', commentId)
      return
    }

    try {
      // Add to loading set
      setCommentActionsLoading(prev => new Set(prev).add(commentId))
      
      console.log('Attempting to dislike comment:', commentId)

      const response = await dislikeService.toggleCommentDislike(commentId)
      console.log('Dislike response:', response)
      
      if (response && response.success) {
        // Simply refresh the comments to get the updated state from backend
        await fetchComments()
      } else {
        alert('Failed to dislike comment')
      }
    } catch (error) {
      console.error('Error disliking comment:', error)
      alert('Failed to dislike comment')
    } finally {
      // Remove from loading set
      setCommentActionsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  // Handle comment reply
  const handleCommentReply = (commentId, newReply) => {
    // Update the comments state to include the new reply
    setComments(prevComments => 
      prevComments.map(comment => {
        // If this is a reply to the top-level comment
        if (comment.id === commentId) {
          return {
            ...comment,
            repliesCount: (comment.repliesCount || 0) + 1,
            replies: [newReply, ...(comment.replies || [])]
          };
        }
        
        // If this is a reply to a nested comment, we need to update the nested structure
        if (comment.replies && comment.replies.length > 0) {
          const updateNestedReplies = (replies) => {
            return replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  repliesCount: (reply.repliesCount || 0) + 1,
                  replies: [newReply, ...(reply.replies || [])]
                };
              }
              // Recursively check nested replies
              if (reply.replies && reply.replies.length > 0) {
                return {
                  ...reply,
                  replies: updateNestedReplies(reply.replies)
                };
              }
              return reply;
            });
          };
          
          return {
            ...comment,
            replies: updateNestedReplies(comment.replies)
          };
        }
        
        return comment;
      })
    );
  };

  const fetchComments = async () => {
    try {
      console.log('🔍 Fetching comments for video:', videoId)
      setCommentsLoading(true)
      const response = await commentService.getVideoComments(videoId)
      console.log('📥 Comments fetch response:', response)
      
      if (response && response.data) {
        const transformedComments = transformCommentsArray(response.data)
        console.log('🔄 Transformed comments:', {
          count: transformedComments.length,
          firstComment: transformedComments[0] ? {
            id: transformedComments[0].id,
            content: transformedComments[0].content?.substring(0, 50) + '...',
            user: transformedComments[0].user?.name
          } : null
        })
        setComments(transformedComments)
        console.log('✅ Comments state updated')
      } else {
        console.log('❌ No comment data in response')
        setComments([])
      }
    } catch (err) {
      console.error("❌ Error fetching comments:", err)
      setComments([])
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

  const checkWatchLaterStatus = async () => {
    try {
      const response = await watchLaterService.getWatchLaterVideos()
      if (response && response.data) {
        const isInList = response.data.some(video => video._id === videoId)
        setIsInWatchLater(isInList)
      }
    } catch (err) {
      console.error("Error checking watch later status:", err)
      setIsInWatchLater(false)
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
        // If currently liked, toggle it off
        if (videoStats.isLikedByUser) {
          setVideoStats(prev => ({
            ...prev,
            likesCount: prev.likesCount - 1,
            isLikedByUser: false
          }))
        } else {
          // If currently disliked, remove dislike and add like
          if (videoStats.isDislikedByUser) {
            // Remove dislike first
            await dislikeService.toggleVideoDislike(videoId)
            setVideoStats(prev => ({
              ...prev,
              likesCount: prev.likesCount + 1,
              dislikesCount: prev.dislikesCount - 1,
              isLikedByUser: true,
              isDislikedByUser: false
            }))
          } else {
            // Just add like
            setVideoStats(prev => ({
              ...prev,
              likesCount: prev.likesCount + 1,
              isLikedByUser: true
            }))
          }
        }
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
    console.log('💬 Comment submission started')
    
    if (!user) {
      console.log('❌ User not authenticated')
      alert("Please login to comment")
      return
    }
    
    if (!newComment.trim()) {
      console.log('❌ Empty comment')
      return
    }

    console.log('📝 Submitting comment:', {
      videoId,
      content: newComment.trim(),
      user: { id: user._id, name: user.fullName || user.userName }
    })

    try {
      const response = await commentService.addComment(videoId, newComment.trim())
      console.log('📨 Comment service response:', response)
      
      if (response && response.success) {
        console.log('✅ Comment added successfully')
        setNewComment("")
        
        // Refresh comments from server to get the new comment with proper formatting
        console.log('🔄 Refreshing comments from server...')
        await fetchComments();
      } else if (response) {
        console.log('❌ Server returned error:', response.message)
        alert('Failed to add comment: ' + (response.message || 'Unknown error'))
      } else {
        console.log('❌ No response from server')
        alert('Failed to add comment: No response from server')
      }
    } catch (err) {
      console.error("❌ Comment submission error:", err)
      alert('Failed to add comment: ' + (err.message || 'Network error'))
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
                  ref={videoRef}
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
                  {Array.isArray(video.subtitles) && video.subtitles.map((track, i) => (
                    <track
                      key={track.language + i}
                      kind="subtitles"
                      label={track.label}
                      srcLang={track.language}
                      src={track.url}
                    />
                  ))}
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
                    className={`px-4 py-2 hover:bg-gray-200 transition-colors ${
                      videoStats.isDislikedByUser ? 'text-red-600' : 'text-gray-700'
                    }`}
                    title={videoStats.isDislikedByUser ? 'Remove dislike' : 'Dislike this video'}
                  >
                    <div className="flex items-center space-x-2">
                      <ThumbsDown className={`w-5 h-5 ${videoStats.isDislikedByUser ? 'fill-current' : ''}`} />
                      <span className="font-medium">{(videoStats.dislikesCount || 0).toLocaleString()}</span>
                    </div>
                  </button>
                </div>

                {/* CC / Subtitles Button — always visible in action bar */}
                {Array.isArray(video.subtitles) && video.subtitles.length > 0 && (
                  <button
                    onClick={toggleSubtitles}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors yt-button ${
                      subtitlesOn
                        ? 'bg-gray-900 text-white hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={subtitlesOn ? 'Turn off subtitles' : 'Turn on subtitles'}
                  >
                    <Captions className="w-5 h-5" />
                    <span className="font-medium">CC</span>
                  </button>
                )}

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
                <div className="relative more-options-container">
                  <button 
                    onClick={handleMoreOptions}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-700 yt-button"
                    title="More options"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMoreMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        <button
                          onClick={handleDownloadVideo}
                          disabled={isDownloading}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4 mr-3" />
                          {isDownloading ? `Downloading ${downloadProgress}%` : 'Download'}
                        </button>
                        <button
                          onClick={handleCreateClip}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Scissors className="w-4 h-4 mr-3" />
                          Clip
                        </button>
                        <button
                          onClick={handleSaveVideo}
                          disabled={watchLaterLoading}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Clock className="w-4 h-4 mr-3" />
                          {watchLaterLoading 
                            ? 'Updating...' 
                            : isInWatchLater 
                              ? 'Remove from Watch Later' 
                              : 'Save to Watch Later'
                          }
                        </button>
                        <button
                          onClick={() => {
                            setShowPlaylistModal(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-3" />
                          Add to Playlist
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={handleReportVideo}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Flag className="w-4 h-4 mr-3" />
                          Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
              
              {/* Action buttons container */}
              <div className="flex items-center space-x-3">
                {/* Subscribe Button */}
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
                    <CommentComponent
                      key={comment.id}
                      comment={comment}
                      onLike={handleCommentLike}
                      onDislike={handleCommentDislike}
                      onReply={handleCommentReply}
                      isLoading={commentActionsLoading.has(comment.id)}
                      user={user}
                      depth={0}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No comments yet. Be the first to share what you think!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Chat Replay (live recordings) + Related Videos */}
          <div className="lg:w-96 lg:shrink-0">
            {/* Chat replay panel — only shown for videos saved from live streams */}
            {video.streamKey && (
              <div className="mb-5">
                <ChatReplayPanel
                  messages={chatReplay.filter(
                    (m) => m.offsetSeconds === null || m.offsetSeconds <= currentVideoTime
                  )}
                  allMessages={chatReplay}
                  loading={chatReplayLoading}
                />
              </div>
            )}
            <div className="space-y-3">
              <RelatedVideos videoId={videoId} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Download Progress Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <Download className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Downloading Video</h3>
              <p className="text-gray-600 mb-4">Please wait while we download your video...</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{downloadProgress}% Complete</p>
              
              {downloadProgress === 100 && (
                <p className="text-green-600 text-sm mt-2 font-medium">✅ Download Complete!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={videoId}
        videoTitle={video?.title}
      />

      {/* Report Video Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="video"
        targetId={videoId}
        onSuccess={() => setReportToast("Report submitted. Thank you for helping keep our platform safe.")}
      />

      {/* Report Toast */}
      {reportToast && (
        <Toast
          message={reportToast}
          type="success"
          onClose={() => setReportToast(null)}
        />
      )}
    </div>
  )
}

export default VideoPlayer
