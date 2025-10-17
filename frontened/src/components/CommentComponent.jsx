import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';
import { commentService } from '../services/commentService';

const CommentComponent = ({ 
  comment, 
  onLike, 
  onDislike, 
  onReply,
  isLoading = false,
  user,
  depth = 0 // Track nesting depth to limit replies
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0 && comment.repliesCount > 0) {
      setLoadingReplies(true);
      try {
        const response = await commentService.getCommentReplies(comment.id);
        if (response.success && response.data.replies) {
          // Transform the replies data to ensure proper user info
          const transformedReplies = response.data.replies.map(reply => {
            const userInfo = reply.userDetails || reply.owner || {};
            return {
              ...reply,
              id: reply._id,
              user: {
                id: userInfo._id,
                name: userInfo.fullName || userInfo.userName || 'Unknown User',
                userName: userInfo.userName || 'unknown',
                avatar: userInfo.avatar || '',
              }
            };
          });
          setReplies(transformedReplies);
        }
      } catch (error) {
        console.error('Error loading replies:', error);
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setRepliesLoading(true);
    try {
      const response = await commentService.addReply(comment.id, replyContent);
      if (response.data) {
        // Transform the reply data to ensure proper user info
        const replyData = response.data;
        const userInfo = replyData.owner || replyData.userDetails || {};
        
        const transformedReply = {
          ...replyData,
          id: replyData._id,
          user: {
            id: userInfo._id,
            name: userInfo.fullName || userInfo.userName || user?.fullName || user?.userName || 'You',
            userName: userInfo.userName || user?.userName || 'you',
            avatar: userInfo.avatar || user?.avatar || '',
          }
        };

        // Add the new reply to the local state
        setReplies(prev => [transformedReply, ...prev]);
        setReplyContent('');
        setShowReplyForm(false);
        setShowReplies(true);
        
        // Call parent callback if provided
        if (onReply) {
          onReply(comment.id, transformedReply);
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setRepliesLoading(false);
    }
  };

  // Limit nesting depth to prevent infinite nesting
  const maxDepth = 3;
  const canReply = user && depth < maxDepth;

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-100' : ''}`}>
      <div className="flex space-x-3">
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
            {comment.isReply && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Reply
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {comment.content}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            {/* Like Button */}
            <button 
              onClick={() => onLike(comment.id)}
              disabled={isLoading}
              className={`flex items-center space-x-1 hover:text-gray-800 transition-colors ${
                comment.isLikedByUser ? 'text-blue-600' : ''
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsUp className={`w-3 h-3 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
              <span>{comment.likesCount || 0}</span>
            </button>
            
            {/* Dislike Button */}
            <button 
              onClick={() => onDislike(comment.id)}
              disabled={isLoading}
              className={`flex items-center space-x-1 hover:text-gray-800 transition-colors ${
                comment.isDislikedByUser ? 'text-red-600' : ''
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ThumbsDown className={`w-3 h-3 ${comment.isDislikedByUser ? 'fill-current' : ''}`} />
              <span>{comment.dislikesCount || 0}</span>
            </button>
            
            {/* Reply Button */}
            {canReply && (
              <button 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="hover:text-gray-800 transition-colors"
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && user && (
            <div className="mt-3 ml-0">
              <form onSubmit={handleReplySubmit} className="space-y-2">
                <div className="flex space-x-2">
                  <img
                    src={user.avatar || "/placeholder.svg?height=20&width=20&text=You"}
                    alt="Your avatar"
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0 mt-1"
                  />
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user?.name}...`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || repliesLoading}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {repliesLoading ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Show Replies Button */}
          {comment.repliesCount > 0 && (
            <button
              onClick={handleToggleReplies}
              className="flex items-center space-x-1 mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              disabled={loadingReplies}
            >
              {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <MessageCircle className="w-3 h-3" />
              <span>
                {loadingReplies 
                  ? 'Loading...' 
                  : showReplies 
                    ? 'Hide replies' 
                    : `Show ${comment.repliesCount} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`
                }
              </span>
            </button>
          )}

          {/* Replies List */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {replies.map((reply) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  onLike={onLike}
                  onDislike={onDislike}
                  onReply={onReply}
                  isLoading={isLoading}
                  user={user}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentComponent;