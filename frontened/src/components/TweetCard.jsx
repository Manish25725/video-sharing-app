import { useState, useRef, useEffect } from 'react';
import {
  Heart, MessageSquare, Trash2, Edit3, MoreVertical,
  MessageCircleOff, MessageCircle, Send, Check, X, BarChart2
} from 'lucide-react';
import { tweetService } from '../services/tweetService';
import { likeService } from '../services/likeService';
import { formatTimeAgo } from '../utils/formatters';

/* ─── Avatar helper ─────────────────────────────────────────── */
const Avatar = ({ src, name, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  const colors = ['bg-violet-500','bg-[#ec5b13]/100','bg-emerald-500','bg-rose-500','bg-amber-500','bg-pink-500'];
  const color = colors[(name || 'U').charCodeAt(0) % colors.length];
  return src ? (
    <img src={src} alt="" className={`${dim} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />
  ) : (
    <div className={`${dim} rounded-full ${color} flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white`}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
};

/* ─── Image grid ────────────────────────────────────────────── */
const ImageGrid = ({ images }) => {
  const [lightbox, setLightbox] = useState(null);
  if (!images?.length) return null;

  const gridClass =
    images.length === 1 ? 'grid-cols-1' :
    images.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <>
      <div className={`grid ${gridClass} gap-1 rounded-2xl overflow-hidden my-3`}>
        {images.map((url, i) => (
          <div
            key={i}
            onClick={() => setLightbox(i)}
            className={`relative overflow-hidden cursor-zoom-in group
              ${images.length === 1 ? 'max-h-[420px]' : 'h-44'}
              ${images.length === 3 && i === 0 ? 'row-span-2 h-full' : ''}
            `}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-7 h-7" />
          </button>
          <img
            src={images[lightbox]}
            alt=""
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-4 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightbox ? 'bg-transparent' : 'bg-transparent/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

/* ─── Poll widget ───────────────────────────────────────────── */
const PollWidget = ({ poll, totalVotes, userVotedIndexes, showResults, canVote, onVote }) => {
  const isMultiple = poll.multipleChoice;
  return (
    <div className="my-3 rounded-2xl border border-[rgba(236,91,19,0.1)] bg-[rgba(45,30,22,0.6)] overflow-hidden shadow-inner">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#ec5b13]" />
            <p className="font-bold text-slate-100 text-[15px]">{poll.question}</p>
          </div>
          {isMultiple && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-black/40 px-2 py-1 rounded-md">Multiple Choice</span>
          )}
        </div>
        <div className="space-y-2.5">
          {poll.options?.map((option, i) => {
            const votes = option.votes?.length || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = userVotedIndexes.includes(i);
            return (
              <button
                key={i}
                onClick={() => canVote && onVote(i)}
                disabled={!canVote}
                className={`group relative w-full text-left rounded-xl overflow-hidden transition-all duration-200 border
                  ${canVote ? 'cursor-pointer hover:border-[#ec5b13]/60' : 'cursor-default'}
                  ${isSelected ? 'border-[#ec5b13] bg-[#ec5b13]/10' : 'border-[#412e24] bg-transparent'}
                `}
              >
                {/* Progress fill */}
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out
                      ${isSelected ? 'bg-[#ec5b13]/30' : 'bg-[#412e24]/60'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between px-4 py-3 z-10">
                  <span className="flex items-center gap-3 text-[14px] font-medium text-slate-200">
                    <span className={`w-4 h-4 flex items-center justify-center flex-shrink-0 transition-colors
                      ${isMultiple ? 'rounded-md' : 'rounded-full'}
                      ${isSelected ? 'bg-[#ec5b13] border-none' : 'border border-slate-500 group-hover:border-[#ec5b13]'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    {option.text}
                  </span>
                  {showResults && (
                    <span className={`text-sm font-bold ml-3 ${isSelected ? 'text-[#ec5b13]' : 'text-slate-400'}`}>
                      {pct}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-4 py-2.5 bg-black/20 border-t border-[#412e24] flex items-center gap-2 text-xs font-medium text-slate-400">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {poll.endsAt && (
          <>
            <span>·</span>
            <span>{new Date(poll.endsAt) < new Date() ? '🔒 Poll ended' : `Ends ${formatTimeAgo(poll.endsAt)}`}</span>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Main TweetCard ────────────────────────────────────────── */
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
  const menuRef = useRef(null);

  const isOwner = currentUser && localTweet.owner?.id === currentUser._id;

  /* Close menu on outside click */
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleLike = async () => {
    if (!currentUser || likeLoading) return;
    setLikeLoading(true);
    const wasLiked = localTweet.isLikedByUser;
    setLocalTweet(prev => ({
      ...prev,
      isLikedByUser: !wasLiked,
      likesCount: wasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
    }));
    try {
      await likeService.toggleTweetLike(localTweet.id);
    } catch {
      setLocalTweet(prev => ({
        ...prev,
        isLikedByUser: wasLiked,
        likesCount: wasLiked ? prev.likesCount + 1 : prev.likesCount - 1,
      }));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this tweet?')) return;
    const res = await tweetService.deleteTweet(localTweet.id);
    if (res?.success) onDeleted?.(localTweet.id);
  };

  const openEdit = () => { setEditContent(localTweet.content); setEditing(true); setShowMenu(false); };

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
    if (res?.success) { setLocalTweet(prev => ({ ...prev, commentsEnabled: !prev.commentsEnabled })); setShowMenu(false); }
  };

  const handleCommentToggle = async () => {
    if (!showComments && !commentsLoaded) {
      const res = await tweetService.getTweetComments(localTweet.id);
      if (res?.success) { setComments(res.data || []); setCommentsLoaded(true); }
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
    } finally { setSubmittingComment(false); }
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
      setLocalTweet(prev => ({ ...prev, poll: { ...prev.poll, options: res.data.options } }));
    }
  };

  const poll = localTweet.poll;
  const userId = currentUser?._id;
  const pollEnded = poll?.endsAt && new Date(poll.endsAt) < new Date();
  const totalVotes = poll?.options?.reduce((s, o) => s + (o.votes?.length || 0), 0) || 0;
  const userVotedIndexes = poll?.options?.reduce((arr, opt, i) => {
    if (opt.votes?.some(v => v === userId || v?._id === userId || v?.toString() === userId)) arr.push(i);
    return arr;
  }, []) || [];
  const hasVoted = userVotedIndexes.length > 0;
  const showResults = pollEnded || hasVoted;

  return (
    <article className="rounded-2xl shadow-xl transition-all duration-200 overflow-hidden" style={{ background: "rgba(45,30,22,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(236,91,19,0.1)" }}>
      <div className="p-3 sm:p-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={localTweet.owner?.avatar}
              name={localTweet.owner?.fullName || localTweet.owner?.userName}
              size="lg"
            />
            <div>
              <p className="font-semibold text-slate-100 text-sm leading-tight">
                {localTweet.owner?.fullName || localTweet.owner?.userName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                @{localTweet.owner?.userName} · {formatTimeAgo(localTweet.createdAt)}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-full hover:bg-[#2a1b14] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1.5 bg-transparent border border-[#412e24] rounded-xl shadow-xl z-20 min-w-[190px] overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={openEdit}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1b120c] transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-slate-500" /> Edit tweet
                    </button>
                    <button
                      onClick={handleToggleComments}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1b120c] transition-colors"
                    >
                      {localTweet.commentsEnabled
                        ? <><MessageCircleOff className="w-4 h-4 text-slate-500" /> Disable comments</>
                        : <><MessageCircle className="w-4 h-4 text-slate-500" /> Enable comments</>}
                    </button>
                    <div className="h-px bg-[#2a1b14] my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete tweet
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {editing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              autoFocus
              className="w-full p-3 border border-[#ec5b13]/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/30 text-sm bg-[#ec5b13]/10/30"
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdate}
                className="px-4 py-1.5 bg-[#ec5b13] text-white text-sm font-medium rounded-full hover:bg-[#d44d0d] transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-1.5 bg-[#2a1b14] text-slate-400 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          localTweet.content && (
            <p className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap mb-1">
              {localTweet.content}
            </p>
          )
        )}

        {/* ── Images ── */}
        <ImageGrid images={localTweet.images} />

        {/* ── Poll ── */}
        {poll?.question && (
          <PollWidget
            poll={poll}
            totalVotes={totalVotes}
            userVotedIndexes={userVotedIndexes}
            showResults={showResults}
            canVote={!pollEnded && !!currentUser}
            onVote={handleVote}
          />
        )}

        {/* ── Action bar ── */}
        <div className="flex items-center gap-1 pt-3 mt-2 border-t border-[#412e24]">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading || !currentUser}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
              ${localTweet.isLikedByUser
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}
              disabled:opacity-40`}
          >
            <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${localTweet.isLikedByUser ? 'fill-current' : ''}`} />
            <span>{localTweet.likesCount || 0}</span>
          </button>

          {/* Comment */}
          <button
            onClick={handleCommentToggle}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
              ${showComments ? 'text-[#ec5b13] bg-[#ec5b13]/10' : 'text-slate-400 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10'}`}
          >
            <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>{localTweet.commentsCount || 0}</span>
          </button>

          {/* Comments disabled badge */}
          {!localTweet.commentsEnabled && (
            <span className="ml-auto flex items-center gap-1 text-xs text-slate-500 bg-[#1b120c] border border-[#412e24] rounded-full px-2.5 py-1">
              <MessageCircleOff className="w-3 h-3" /> Comments off
            </span>
          )}
        </div>
      </div>

      {/* ── Comments section ── */}
      {showComments && (
        <div className="border-t border-[#412e24] bg-transparent px-5 py-4">
          {!localTweet.commentsEnabled ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
              <MessageCircleOff className="w-4 h-4" />
              <span>Comments are disabled for this tweet.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Comment input */}
              {currentUser && (
                <div className="flex items-center gap-3">
                  <Avatar src={currentUser.avatar} name={currentUser.fullName || currentUser.userName} size="sm" />
                  <div className="flex-1 flex items-center bg-transparent border border-[#412e24] rounded-full pl-4 pr-2 py-1.5 gap-2 focus-within:border-[#ec5b13] focus-within:ring-2 focus-within:ring-[#ec5b13]/20 transition-all">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      placeholder="Write a comment…"
                      className="flex-1 bg-transparent text-sm outline-none text-slate-200 placeholder-gray-400"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentInput.trim() || submittingComment}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ec5b13] text-white disabled:opacity-40 disabled:bg-gray-300 hover:bg-[#d44d0d] transition-colors flex-shrink-0"
                    >
                      {submittingComment
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments list */}
              {comments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-2">No comments yet — be the first!</p>
              ) : (
                <div className="space-y-3">
                  {comments.map(comment => {
                    const owner = comment.ownerDetails || comment.userDetails || comment.owner || {};
                    const isCommentOwner = currentUser && (owner._id === currentUser._id || owner === currentUser._id);
                    return (
                      <div key={comment._id} className="flex items-start gap-2.5 group">
                        <Avatar src={owner.avatar} name={owner.fullName || owner.userName} size="sm" />
                        <div className="flex-1 bg-transparent rounded-2xl rounded-tl-sm border border-[#412e24] px-3.5 py-2.5 shadow-xs">
                          <p className="text-xs font-semibold text-slate-100 mb-0.5">
                            {owner.fullName || owner.userName}
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
                        </div>
                        {isCommentOwner && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 mt-1 flex-shrink-0 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default TweetCard;
