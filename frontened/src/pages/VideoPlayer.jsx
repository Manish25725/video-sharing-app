import { useState, useEffect, useRef } from 'react';
import PageLoader from '../components/PageLoader.jsx';
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
    <div className="rounded-xl overflow-hidden sticky top-20"
      style={{ background: 'rgba(15,15,15,0.85)', border: '1px solid rgba(236,91,19,0.15)', backdropFilter: 'blur(12px)' }}>
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(236,91,19,0.1)', background: 'rgba(236,91,19,0.05)' }}>
        <MessageCircle className="w-4 h-4" style={{ color: '#ec5b13' }} />
        <span className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>Live Chat Replay</span>
        {allMessages.length > 0 && (
          <span className="ml-auto text-xs" style={{ color: '#64748b' }}>
            {messages.length} / {allMessages.length} messages
          </span>
        )}
      </div>
      <div className="h-[520px] overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <PageLoader message="" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center" style={{ color: '#64748b' }}>
            <MessageCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm">No chat was recorded for this stream.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center" style={{ color: '#64748b' }}>
            <MessageCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm">Play the video to see chat messages appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div key={msg._id || i} className="flex gap-2">
                <span className="text-[11px] tabular-nums pt-0.5 flex-shrink-0 w-9" style={{ color: '#64748b' }}>
                  {formatOffset(msg.offsetSeconds)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold mr-1.5" style={{ color: '#ec5b13' }}>{msg.username}</span>
                  <span className="text-sm break-words" style={{ color: '#e2e8f0' }}>{msg.message}</span>
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
      if (response && response.data) {
        setVideo(response.data)
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
      return;
    }

    try {
      setIsIncrementingView(true); // Prevent concurrent calls
      
      const response = await videoService.incrementViews(videoId)
      
      if (response && response.success) {
        setHasViewBeenCounted(true) // Mark view as counted
        
        // Update local view count in stats
        setVideoStats(prev => ({
          ...prev,
          views: response.data?.views || (prev.views || 0) + 1
        }))
        

        // Add to watch history if user is logged in
        if (user) {
          try {
            const re=await watchHistoryService.addToWatchHistory(videoId);
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
      return
    }

    try {
      // Add to loading set
      setCommentActionsLoading(prev => new Set(prev).add(commentId))
      

      const response = await likeService.toggleCommentLike(commentId)
      
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
      return
    }

    try {
      // Add to loading set
      setCommentActionsLoading(prev => new Set(prev).add(commentId))
      

      const response = await dislikeService.toggleCommentDislike(commentId)
      
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
      setCommentsLoading(true)
      const response = await commentService.getVideoComments(videoId)
      
      if (response && response.data) {
        const transformedComments = transformCommentsArray(response.data)
        setComments(transformedComments)
      } else {
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
    
    if (!newComment.trim()) {
      return
    }


    try {
      const response = await commentService.addComment(videoId, newComment.trim())
      
      if (response && response.success) {
        setNewComment("")
        
        // Refresh comments from server to get the new comment with proper formatting
        await fetchComments();
      } else if (response) {
        alert('Failed to add comment: ' + (response.message || 'Unknown error'))
      } else {
        alert('Failed to add comment: No response from server')
      }
    } catch (err) {
      console.error("❌ Comment submission error:", err)
      alert('Failed to add comment: ' + (err.message || 'Network error'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Loading video..." />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#141414' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Video Not Found</h2>
          <p className="mb-4" style={{ color: '#94a3b8' }}>{error || "The video you're looking for doesn't exist."}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-6 py-2 rounded-full font-semibold text-white text-sm transition-colors"
            style={{ background: '#ec5b13' }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Video Player Column ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Cinematic Player */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            {video.videoFile ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain"
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
              <div className="relative w-full h-full">
                <img
                  src={video.thumbnail || "/placeholder.svg?height=480&width=854&text=Video"}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    style={{ background: 'rgba(236,91,19,0.9)' }}
                  >
                    <Play className="w-10 h-10 text-white fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#f1f5f9' }}>
              {video.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

              {/* Channel Info */}
              <div className="flex items-center gap-4">
                <img
                  src={video.owner?.avatar || "/placeholder.svg?height=48&width=48&text=U"}
                  alt={video.owner?.fullName || 'Channel'}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer"
                  onClick={() => video.owner?.userName && navigate(`/channel/${video.owner.userName}`)}
                />
                <div>
                  <h3
                    className="font-bold cursor-pointer hover:underline"
                    style={{ color: '#f1f5f9' }}
                    onClick={() => video.owner?.userName && navigate(`/channel/${video.owner.userName}`)}
                  >
                    {video.owner?.fullName || video.owner?.userName || 'Unknown Channel'}
                  </h3>
                  <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                    {(video.owner?.subscribersCount || 0).toLocaleString()} subscribers
                  </p>
                </div>
                {user && user._id !== video.owner?._id && (
                  <button
                    onClick={handleSubscribe}
                    className="ml-2 px-6 py-2 font-bold rounded-full transition-colors text-sm"
                    style={isSubscribed
                      ? { background: 'rgba(236,91,19,0.12)', color: '#ec5b13', border: '1px solid rgba(236,91,19,0.3)' }
                      : { background: '#ec5b13', color: '#fff' }}
                  >
                    {isSubscribed
                      ? <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Subscribed</span>
                      : 'Subscribe'}
                  </button>
                )}
                {user && user._id === video.owner?._id && (
                  <span
                    className="ml-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(236,91,19,0.12)', color: '#ec5b13', border: '1px solid rgba(236,91,19,0.2)' }}
                  >
                    Your Video
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">

                {/* Like / Dislike */}
                <div
                  className="flex items-center rounded-full p-1"
                  style={{ background: 'rgba(236,91,19,0.08)', border: '1px solid rgba(236,91,19,0.15)' }}
                >
                  <button
                    onClick={handleToggleLike}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
                    style={{
                      color: videoStats.isLikedByUser ? '#ec5b13' : '#cbd5e1',
                      borderRight: '1px solid rgba(236,91,19,0.2)'
                    }}
                  >
                    <ThumbsUp className={`w-4 h-4 ${videoStats.isLikedByUser ? 'fill-current' : ''}`} />
                    {(videoStats.likesCount || 0).toLocaleString()}
                  </button>
                  <button
                    onClick={handleDislike}
                    className="px-4 py-1.5 rounded-full transition-colors"
                    style={{ color: videoStats.isDislikedByUser ? '#ec5b13' : '#cbd5e1' }}
                  >
                    <ThumbsDown className={`w-4 h-4 ${videoStats.isDislikedByUser ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* CC / Subtitles */}
                {(() => {
                  const hasSubtitles = Array.isArray(video?.subtitles) && video.subtitles.length > 0;
                  return (
                    <button
                      onClick={hasSubtitles ? toggleSubtitles : undefined}
                      disabled={!hasSubtitles}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                      style={!hasSubtitles
                        ? { background: 'rgba(236,91,19,0.05)', color: '#475569', cursor: 'not-allowed', opacity: 0.5, border: '1px solid rgba(236,91,19,0.1)' }
                        : subtitlesOn
                          ? { background: '#ec5b13', color: '#fff', border: '1px solid #ec5b13' }
                          : { background: 'rgba(236,91,19,0.08)', color: '#cbd5e1', border: '1px solid rgba(236,91,19,0.15)' }}
                      title={!hasSubtitles ? 'No subtitles available' : subtitlesOn ? 'Turn off subtitles' : 'Turn on subtitles'}
                    >
                      <Captions className="w-4 h-4" /> CC
                    </button>
                  );
                })()}

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={{ background: 'rgba(236,91,19,0.08)', color: '#cbd5e1', border: '1px solid rgba(236,91,19,0.15)' }}
                >
                  <Share className="w-4 h-4" /> Share
                </button>

                {/* Save to Watch Later */}
                <button
                  onClick={handleSaveVideo}
                  disabled={watchLaterLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={isInWatchLater
                    ? { background: 'rgba(236,91,19,0.18)', color: '#ec5b13', border: '1px solid rgba(236,91,19,0.3)' }
                    : { background: 'rgba(236,91,19,0.08)', color: '#cbd5e1', border: '1px solid rgba(236,91,19,0.15)' }}
                >
                  <Bookmark className={`w-4 h-4 ${isInWatchLater ? 'fill-current' : ''}`} />
                  {isInWatchLater ? 'Saved' : 'Save'}
                </button>

                {/* More options */}
                <div className="relative more-options-container">
                  <button
                    onClick={handleMoreOptions}
                    className="p-2.5 rounded-full transition-colors"
                    style={{ background: 'rgba(236,91,19,0.08)', color: '#cbd5e1', border: '1px solid rgba(236,91,19,0.15)' }}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  {showMoreMenu && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-xl z-50 overflow-hidden"
                      style={{ background: 'rgba(26,16,10,0.97)', border: '1px solid rgba(236,91,19,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                    >
                      <div className="py-1.5">
                        <button
                          onClick={handleDownloadVideo}
                          disabled={isDownloading}
                          className="w-full flex items-center px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
                          style={{ color: '#cbd5e1' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Download className="w-4 h-4 mr-3" style={{ color: '#ec5b13' }} />
                          {isDownloading ? `Downloading ${downloadProgress}%` : 'Download'}
                        </button>
                        <button
                          onClick={handleCreateClip}
                          className="w-full flex items-center px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#cbd5e1' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Scissors className="w-4 h-4 mr-3" style={{ color: '#ec5b13' }} />
                          Clip
                        </button>
                        <button
                          onClick={handleSaveVideo}
                          disabled={watchLaterLoading}
                          className="w-full flex items-center px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
                          style={{ color: '#cbd5e1' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Clock className="w-4 h-4 mr-3" style={{ color: '#ec5b13' }} />
                          {watchLaterLoading ? 'Updating...' : isInWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}
                        </button>
                        <button
                          onClick={() => { setShowPlaylistModal(true); setShowMoreMenu(false); }}
                          className="w-full flex items-center px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#cbd5e1' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,91,19,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Plus className="w-4 h-4 mr-3" style={{ color: '#ec5b13' }} />
                          Add to Playlist
                        </button>
                        <div style={{ height: 1, background: 'rgba(236,91,19,0.15)', margin: '4px 0' }} />
                        <button
                          onClick={handleReportVideo}
                          className="w-full flex items-center px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#f87171' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
          </div>

          {/* Description */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(236,91,19,0.05)', border: '1px solid rgba(236,91,19,0.1)' }}
          >
            <div className="flex flex-wrap gap-3 text-sm font-bold mb-2" style={{ color: '#f1f5f9' }}>
              <span>{(videoStats.views || 0).toLocaleString()} views</span>
              <span>{formatTimeAgo(video.createdAt)}</span>
              {Array.isArray(video.tags) && video.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{ color: '#ec5b13' }}>#{tag}</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>
              {video.description}
            </p>
          </div>

          {/* Comments Section */}
          <div
            className="flex flex-col gap-6 rounded-2xl p-5 md:p-6"
            style={{
              background: 'rgba(45,30,22,0.5)',
              border: '1px solid rgba(236,91,19,0.12)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#f8fafc' }}>
                <MessageCircle className="w-5 h-5" style={{ color: '#ec5b13' }} />
                {comments.length} Comments
              </h2>
              <button
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-full w-fit"
                style={{
                  color: '#cbd5e1',
                  background: 'rgba(236,91,19,0.08)',
                  border: '1px solid rgba(236,91,19,0.14)'
                }}
              >
                <Clock className="w-4 h-4" style={{ color: '#ec5b13' }} />
                Sort by newest
              </button>
            </div>

            {/* Comment Input */}
            {user ? (
              <div
                className="flex gap-4 rounded-2xl p-4"
                style={{
                  background: 'rgba(236,91,19,0.04)',
                  border: '1px solid rgba(236,91,19,0.1)'
                }}
              >
                <img
                  src={user.avatar || "/placeholder.svg?height=40&width=40&text=You"}
                  alt="Your avatar"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 flex flex-col gap-3">
                  <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none"
                      style={{
                        background: 'rgba(18,12,8,0.7)',
                        color: '#f8fafc',
                        border: '1px solid rgba(236,91,19,0.18)'
                      }}
                    />
                    <div className="flex justify-end gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => setNewComment("")}
                        className="px-4 py-2 text-sm font-semibold rounded-full transition-colors"
                        style={{
                          color: '#cbd5e1',
                          background: 'rgba(148,163,184,0.08)',
                          border: '1px solid rgba(148,163,184,0.18)'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-5 py-2 text-sm font-bold rounded-full transition-colors disabled:opacity-50"
                        style={{
                          background: '#ec5b13',
                          color: '#fff',
                          boxShadow: '0 4px 18px rgba(236,91,19,0.25)'
                        }}
                      >
                        Comment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 text-sm rounded-xl px-4 py-3"
                style={{
                  color: '#cbd5e1',
                  background: 'rgba(236,91,19,0.04)',
                  border: '1px solid rgba(236,91,19,0.1)'
                }}
              >
                <MessageCircle className="w-5 h-5" style={{ color: '#ec5b13' }} />
                <span>Sign in to leave a comment</span>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col gap-4 mt-1">
              {commentsLoading ? (
                <div className="text-center py-8" style={{ color: '#cbd5e1' }}>Loading comments...</div>
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
                <div
                  className="text-center py-10 rounded-xl"
                  style={{
                    color: '#cbd5e1',
                    background: 'rgba(236,91,19,0.03)',
                    border: '1px dashed rgba(236,91,19,0.18)'
                  }}
                >
                  No comments yet. Be the first to share what you think!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4 flex flex-col gap-4">

          {/* Chat Replay (live recordings only) */}
          {video.streamKey && (
            <div className="mb-2">
              <ChatReplayPanel
                messages={chatReplay.filter(
                  (m) => m.offsetSeconds === null || m.offsetSeconds <= currentVideoTime
                )}
                allMessages={chatReplay}
                loading={chatReplayLoading}
              />
            </div>
          )}

          {/* Up Next */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg" style={{ color: '#f1f5f9' }}>Up Next</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>Autoplay</span>
              <div className="w-8 h-4 rounded-full relative" style={{ background: '#ec5b13' }}>
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </div>

          {/* Related Videos */}
          <div className="space-y-3">
            <RelatedVideos videoId={videoId} />
          </div>

          {/* Premium promo */}
          <div
            className="mt-4 rounded-2xl p-6 flex flex-col items-center text-center gap-4"
            style={{ background: 'rgba(236,91,19,0.05)', backdropFilter: 'blur(8px)', border: '1px solid rgba(236,91,19,0.1)' }}
          >
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#ec5b13' }}>
              Premium Vibe
            </span>
            <h3 className="font-bold text-lg" style={{ color: '#f1f5f9' }}>Watch without limits</h3>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Try PlayVibe Premium and enjoy ad-free videos and offline play.
            </p>
            <button
              className="w-full py-2 font-bold rounded-xl text-sm text-white hover:scale-105 transition-transform"
              style={{ background: '#ec5b13' }}
            >
              Start Free Trial
            </button>
          </div>
        </aside>
      </div>

      {/* Download Progress Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ background: 'rgba(26,16,10,0.98)', border: '1px solid rgba(236,91,19,0.2)' }}
          >
            <div className="text-center">
              <Download className="w-12 h-12 mx-auto mb-4" style={{ color: '#ec5b13' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>Downloading Video</h3>
              <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Please wait while we download your video...</p>
              <div className="w-full h-2 rounded-full mb-2" style={{ background: 'rgba(236,91,19,0.1)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%`, background: '#ec5b13' }}
                />
              </div>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{downloadProgress}% Complete</p>
              {downloadProgress === 100 && (
                <p className="text-sm mt-2 font-medium" style={{ color: '#4ade80' }}>Download Complete!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={videoId}
        videoTitle={video?.title}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="video"
        targetId={videoId}
        onSuccess={() => setReportToast("Report submitted. Thank you for helping keep our platform safe.")}
      />

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
