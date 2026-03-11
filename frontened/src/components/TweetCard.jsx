import { useState } from 'react';
import {
  Heart, MessageSquare, Trash2, Edit3, MoreVertical,
  MessageCircleOff, MessageCircle, Send, Check
} from 'lucide-react';
import { tweetService } from '../services/tweetService';
import { likeService } from '../services/likeService';
import { formatTimeAgo } from '../utils/formatters';

const TweetCard = ({ tweet, currentUser, onDeleted, onUpdated }) => {
  const [localTweet, setLocalTweet] = useState(tweet);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const isOwner = currentUser && localTweet.owner?.id === currentUser._id;

  const handleLike = async () => {
    if (!currentUser || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await likeService.toggleTweetLike(localTweet.id);
      if (res) {
        const wasLiked = localTweet.isLikedByUser;
        setLocalTweet(prev => ({
          ...prev,
          isLikedByUser: !wasLiked,
          likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        }));
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this tweet?')) return;
    const res = await tweetService.deleteTweet(localTweet.id);
    if (res?.success) onDeleted?.(localTweet.id);
  };

  const openEdit = () => {
    setEditContent(localTweet.content);
    setEditing(true);
    setShowMenu(false);
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    const res = await tweetService.updateTweet(localTweet.id, editContent.trim());
    if (res?.success) {
      const updated = { ...localTweet, content: editContent.trim() };
      setLocalTweet(updated);
      setEditing(false);
      onUpdated?.(updated);
    }
  };

  const handleToggleComments = async () => {
    const res = await tweetService.toggleComments(localTweet.id);
    if (res?.success) {
      setLocalTweet(prev => ({ ...prev, commentsEnabled: !prev.commentsEnabled }));
      setShowMenu(false);
    }
  };

  const handleCommentToggle = async () => {
    if (!showComments && !commentsLoaded) {
      const res = await tweetService.getTweetComments(localTweet.id);
      if (res?.success) {
        setComments(res.data || []);
        setCommentsLoaded(true);
      }
    }
    setShowComments(prev => !prev);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !currentUser || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await tweetService.addComment(localTweet.id, commentInput.trim());
      if (res?.success && res.data) {
        setComments(prev => [res.data, ...prev]);
        setCommentInput('');
        setLocalTweet(prev => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const res = await tweetService.deleteComment(commentId);
    if (res?.success) {
      setComments(prev => prev.filter(c => c._id !== commentId));
      setLocalTweet(prev => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }));
    }
  };

  const handleVote = async (optionIndex) => {
    if (!currentUser) return;
    const res = await tweetService.votePoll(localTweet.id, optionIndex);
    if (res?.success && res.data) {
      setLocalTweet(prev => ({
        ...prev,
        poll: { ...prev.poll, options: res.data.options },
      }));
    }
  };

  const images = localTweet.images || [];
  const poll = localTweet.poll;

  const userId = currentUser?._id;
  const pollEnded = poll?.endsAt && new Date(poll.endsAt) < new Date();
  const totalVotes = poll?.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  const userVotedIndexes = poll?.options?.reduce((arr, opt, i) => {
    const voted = opt.votes?.some(v =>
      v === userId || v?._id === userId || v?.toString() === userId
    );
    if (voted) arr.push(i);
    return arr;
  }, []) || [];
  const hasVoted = userVotedIndexes.length > 0;
  const showResults = pollEnded || hasVoted;

  const imageGridClass = images.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {localTweet.owner?.avatar ? (
            <img
              src={localTweet.owner.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {(localTweet.owner?.fullName || localTweet.owner?.userName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {localTweet.owner?.fullName || localTweet.owner?.userName}
            </p>
            <p className="text-xs text-gray-500">{formatTimeAgo(localTweet.createdAt)}</p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                <button
                  onClick={openEdit}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={handleToggleComments}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {localTweet.commentsEnabled ? (
                    <><MessageCircleOff className="w-4 h-4" /> Disable comments</>
                  ) : (
                    <><MessageCircle className="w-4 h-4" /> Enable comments</>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="mb-3">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
            maxLength={500}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 text-sm whitespace-pre-wrap mb-3">{localTweet.content}</p>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className={`grid ${imageGridClass} gap-1.5 mb-3 rounded-xl overflow-hidden`}>
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className={`w-full object-cover rounded-lg ${images.length === 1 ? 'max-h-80' : 'h-40'}`}
            />
          ))}
        </div>
      )}

      {/* Poll */}
      {poll?.question && (
        <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm mb-3">{poll.question}</p>
          <div className="space-y-2">
            {poll.options?.map((option, i) => {
              const votes = option.votes?.length || 0;
              const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isSelected = userVotedIndexes.includes(i);
              const canVote = !showResults && !pollEnded && currentUser;
              return (
                <button
                  key={i}
                  onClick={() => canVote && handleVote(i)}
                  disabled={!canVote}
                  className={`relative w-full text-left rounded-lg overflow-hidden border transition-colors ${
                    isSelected ? 'border-blue-500' : 'border-gray-300'
                  } ${canVote ? 'hover:border-blue-400 cursor-pointer' : 'cursor-default'}`}
                >
                  {showResults && (
                    <div
                      className={`absolute inset-y-0 left-0 transition-all ${isSelected ? 'bg-blue-100' : 'bg-gray-200'}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between px-3 py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                      {option.text}
                    </span>
                    {showResults && (
                      <span className="text-gray-500 font-medium ml-2">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            {pollEnded
              ? ' · Poll ended'
              : poll.endsAt
              ? ` · Ends ${formatTimeAgo(poll.endsAt)}`
              : ''}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center space-x-5 pt-3 border-t border-gray-100 mt-1">
        <button
          onClick={handleLike}
          disabled={likeLoading || !currentUser}
          className={`flex items-center space-x-1.5 text-sm transition-colors ${
            localTweet.isLikedByUser ? 'text-red-600' : 'text-gray-500 hover:text-red-500'
          } disabled:opacity-50`}
        >
          <Heart className={`w-4 h-4 ${localTweet.isLikedByUser ? 'fill-current' : ''}`} />
          <span>{localTweet.likesCount}</span>
        </button>

        <button
          onClick={handleCommentToggle}
          className={`flex items-center space-x-1.5 text-sm transition-colors ${
            showComments ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{localTweet.commentsCount}</span>
        </button>

        {!localTweet.commentsEnabled && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageCircleOff className="w-3.5 h-3.5" /> Comments off
          </span>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {!localTweet.commentsEnabled ? (
            <p className="text-sm text-gray-500 italic py-2">Comments are disabled for this tweet.</p>
          ) : (
            <>
              {currentUser && (
                <div className="flex items-center gap-2 mb-4">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(currentUser.fullName || currentUser.userName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentInput.trim() || submittingComment}
                      className="text-blue-600 disabled:opacity-40 transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {comments.map(comment => {
                    const owner = comment.ownerDetails || comment.owner || {};
                    const isCommentOwner =
                      currentUser && (owner._id === currentUser._id || owner === currentUser._id);
                    return (
                      <div key={comment._id} className="flex items-start gap-2">
                        {owner.avatar ? (
                          <img
                            src={owner.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0 mt-0.5">
                            {(owner.fullName || owner.userName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">
                            {owner.fullName || owner.userName}
                          </p>
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                        {isCommentOwner && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-gray-400 hover:text-red-500 mt-1 flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TweetCard;
