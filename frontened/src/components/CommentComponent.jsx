import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';
import { commentService } from '../services/commentService';
import ReportModal from './ReportModal';
import Toast from './Toast';

import { useEffect } from 'react';

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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportToast, setReportToast] = useState(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const componentId = React.useMemo(() => 
    comment.id || comment._id || `comment-${Math.random().toString(36).slice(2,9)}`, 
    [comment.id, comment._id]
  );

  // Close reply form when another component opens its reply form
  useEffect(() => {
    const onOtherOpen = (e) => {
      const openedId = e.detail?.commentId;
      if (openedId && openedId !== componentId) {
        setShowReplyForm(false);
      }
    };

    window.addEventListener('reply-form-opened', onOtherOpen);
    return () => window.removeEventListener('reply-form-opened', onOtherOpen);
  }, [componentId]);

  // Close reply form when user clicks elsewhere or cancels
  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyContent('');
  };

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0 && comment.repliesCount > 0) {
      setLoadingReplies(true);
      try {
        // Use the correct endpoint depending on whether this is a comment or a reply
        const isNestedReply = depth > 0 || comment.isReply;
        const response = isNestedReply
          ? await commentService.getReplyReplies(comment.id || comment._id)
          : await commentService.getCommentReplies(comment.id || comment._id);

        // Normalize the response from the service
        let repliesArray = [];
        if (response && response.success && response.data && response.data.replies) {
          repliesArray = response.data.replies;
        } else if (response && response.data && Array.isArray(response.data)) {
          repliesArray = response.data;
        } else {
          console.warn('Unexpected reply response format:', response);
          repliesArray = [];
        }

        const transformedReplies = repliesArray.map((reply) => {
          if (!reply || !reply._id) {
            console.warn('Invalid reply object:', reply);
            return null;
          }
          
          const userInfo = reply.userDetails || reply.owner || {};
          const displayName = userInfo.fullName || userInfo.userName || reply.user?.name || 'Anonymous';
          
          return {
            ...reply,
            id: reply._id,
            _id: reply._id, // Keep both for consistency
            user: {
              id: userInfo._id || userInfo.id || null,
              name: displayName,
              userName: userInfo.userName || '',
              avatar: userInfo.avatar || '',
            },
            repliesCount: reply.totalReplies || reply.repliesCount || 0,
            replies: []
          };
        }).filter(Boolean); // Remove any null entries

        setReplies(transformedReplies);
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
      // If this CommentComponent is rendering a reply (depth > 0), we must use
      // addReplyToReply so the backend looks up a Reply document, not a Comment.
      const isNestedReply = depth > 0 || comment.isReply;
      const response = isNestedReply
        ? await commentService.addReplyToReply(comment.id || comment._id, replyContent)
        : await commentService.addReply(comment.id || comment._id, replyContent);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      const replyData = response.data;
      if (!replyData._id) {
        throw new Error('Reply was not created properly');
      }

      const userInfo = replyData.owner || replyData.userDetails || {};
      const displayName = userInfo.fullName || userInfo.userName || user?.fullName || user?.userName || 'You';

      const transformedReply = {
        ...replyData,
        id: replyData._id,
        _id: replyData._id,
        user: {
          id: userInfo._id || userInfo.id || null,
          name: displayName,
          userName: userInfo.userName || user?.userName || '',
          avatar: userInfo.avatar || user?.avatar || '',
        },
        repliesCount: 0,
        replies: [],
        isReply: true
      };

      // Add the new reply to the local state
      setReplies(prev => [transformedReply, ...prev]);
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);

      // Notify other components to close their reply forms
      window.dispatchEvent(new CustomEvent('reply-form-opened', { detail: { commentId: componentId } }));

      // Call parent callback if provided - this will update the parent's state
      if (onReply) {
        onReply(comment.id, transformedReply);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setRepliesLoading(false);
    }
  };

  // Handle replies to this comment's nested replies
  const handleNestedReply = (parentReplyId, newReply) => {
    // If the reply is for one of our nested replies, update our local state
    setReplies(prevReplies => {
      const updatedReplies = prevReplies.map(reply => {
        if (reply.id === parentReplyId) {
          // Update the reply count and add the new reply to its nested replies
          return {
            ...reply,
            repliesCount: (reply.repliesCount || 0) + 1,
            replies: [newReply, ...(reply.replies || [])]
          };
        }
        return reply;
      });
      return updatedReplies;
    });

    // Also propagate up to parent if this isn't the top level
    if (onReply) {
      onReply(parentReplyId, newReply);
    }
  };

  // Limit nesting depth to prevent infinite nesting
  const maxDepth = 3;
  const canReply = user && depth < maxDepth;

  return (
    <div
      className={`${depth > 0 ? 'ml-6 pl-4' : ''}`}
      style={depth > 0 ? { borderLeft: '1px solid rgba(236,91,19,0.16)' } : undefined}
    >
      <div
        className="flex space-x-3 rounded-2xl p-4"
        style={{
          background: depth > 0 ? 'rgba(18,12,8,0.55)' : 'rgba(236,91,19,0.04)',
          border: '1px solid rgba(236,91,19,0.1)'
        }}
      >
        <img
          src={comment.user?.avatar || "/placeholder.svg?height=24&width=24&text=U"}
          alt={comment.user?.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm" style={{ color: '#f8fafc' }}>
              {comment.user?.name || 'Anonymous'}
            </span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isReply && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  color: '#ec5b13',
                  background: 'rgba(236,91,19,0.12)',
                  border: '1px solid rgba(236,91,19,0.16)'
                }}
              >
                Reply
              </span>
            )}
          </div>
          
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#e2e8f0' }}>
            {comment.content}
          </p>
          
          <div className="flex items-center flex-wrap gap-4 text-xs" style={{ color: '#cbd5e1' }}>
            {/* Like Button */}
            <button 
              onClick={() => onLike && onLike(comment.id || comment._id)}
              disabled={isLoading || !onLike}
              className={`flex items-center space-x-1 transition-colors ${
                comment.isLikedByUser ? '' : ''
              } ${isLoading || !onLike ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ color: comment.isLikedByUser ? '#ec5b13' : '#cbd5e1' }}
            >
              <ThumbsUp className={`w-3 h-3 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
              <span>{comment.likesCount || 0}</span>
            </button>
            
            {/* Dislike Button */}
            <button 
              onClick={() => onDislike && onDislike(comment.id || comment._id)}
              disabled={isLoading || !onDislike}
              className={`flex items-center space-x-1 transition-colors ${
                comment.isDislikedByUser ? '' : ''
              } ${isLoading || !onDislike ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ color: comment.isDislikedByUser ? '#f87171' : '#cbd5e1' }}
            >
              <ThumbsDown className={`w-3 h-3 ${comment.isDislikedByUser ? 'fill-current' : ''}`} />
              <span>{comment.dislikesCount || 0}</span>
            </button>
            
            {/* Reply Button */}
            {canReply && (
              <button 
                onClick={() => {
                  // Broadcast that this comment opened its reply form so others close theirs
                  window.dispatchEvent(new CustomEvent('reply-form-opened', { detail: { commentId: componentId } }));
                  setShowReplyForm(!showReplyForm);
                }}
                className="transition-colors"
                style={{ color: showReplyForm ? '#ec5b13' : '#cbd5e1' }}
              >
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
            )}

            {/* Report Button */}
            {user && (
              <button
                title="Report comment"
                onClick={() => setShowReportModal(true)}
                className="transition-colors"
                style={{ color: '#fca5a5' }}
              >
                <Flag className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && user && (
            <div className="mt-4 ml-0">
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
                    className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                    style={{
                      background: 'rgba(18,12,8,0.82)',
                      color: '#f8fafc',
                      border: '1px solid rgba(236,91,19,0.18)'
                    }}
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
                    className="px-3 py-1 text-xs rounded-full transition-colors"
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
                    disabled={!replyContent.trim() || repliesLoading}
                    className="px-3 py-1 text-xs text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ background: '#ec5b13' }}
                  >
                    {repliesLoading ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Show Replies Button */}
          {(comment.repliesCount > 0 || replies.length > 0) && (
            <button
              onClick={handleToggleReplies}
              className="flex items-center space-x-1 mt-3 text-xs transition-colors"
              style={{ color: '#ec5b13' }}
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
                  onReply={handleNestedReply} // Use our nested reply handler
                  isLoading={isLoading}
                  user={user}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Comment Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="comment"
          targetId={comment.id || comment._id}
          onSuccess={() => setReportToast("Report submitted. Thank you for helping keep our platform safe.")}
        />
      )}

      {/* Report Toast */}
      {reportToast && (
        <Toast
          message={reportToast}
          type="success"
          onClose={() => setReportToast(null)}
        />
      )}
    </div>
  );
};

export default CommentComponent;