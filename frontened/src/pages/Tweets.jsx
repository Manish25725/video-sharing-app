import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Image, BarChart2, X, Send, Plus,
  Search, Bell, MapPin, FileText, Users, TrendingUp, ThumbsUp, Edit3
} from 'lucide-react';
import { tweetService, transformTweetsArray } from '../services/tweetService';
import { useAuth } from '../contexts/AuthContext';
import TweetCard from '../components/TweetCard';

const Tweets = () => {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Composer state
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollMultiple, setPollMultiple] = useState(false);
  const [pollEndsAt, setPollEndsAt] = useState('');
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (user) fetchTweets();
  }, [user]);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await tweetService.getUserTweets();
      if (response.success && response.data) {
        setTweets(transformTweetsArray(response.data));
      } else {
        setTweets([]);
      }
    } catch (err) {
      setError('Failed to load tweets');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - selectedImages.length;
    const toAdd = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedImages(prev => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) setPollOptions(prev => [...prev, '']);
  };

  const removePollOption = (index) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePollOption = (index, value) => {
    setPollOptions(prev => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const resetComposer = () => {
    setContent('');
    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollMultiple(false);
    setPollEndsAt('');
  };

  const canSubmitPoll = showPoll && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2;
  const canSubmit = content.trim() || selectedImages.length > 0 || canSubmitPoll;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    const formData = new FormData();
    if (content.trim()) formData.append('content', content.trim());
    selectedImages.forEach(img => formData.append('images', img.file));
    if (showPoll && pollQuestion.trim()) {
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length >= 2) {
        formData.append('pollQuestion', pollQuestion.trim());
        formData.append('pollOptions', JSON.stringify(validOptions));
        formData.append('pollMultiple', pollMultiple ? 'true' : 'false');
        if (pollEndsAt) formData.append('pollEndsAt', pollEndsAt);
      }
    }
    try {
      setSubmitting(true);
      const response = await tweetService.createTweet(formData);
      if (response.success) {
        resetComposer();
        await fetchTweets();
      } else {
        alert(response.message || 'Failed to post tweet');
      }
    } catch (err) {
      alert('Failed to post tweet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTweetDeleted = (tweetId) => {
    setTweets(prev => prev.filter(t => t.id !== tweetId));
  };

  const handleTweetUpdated = (updatedTweet) => {
    setTweets(prev => prev.map(t => (t.id === updatedTweet.id ? updatedTweet : t)));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#141414' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(236,91,19,0.1)' }}
          >
            <MessageSquare className="w-10 h-10" style={{ color: '#ec5b13' }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Sign in to view tweets</h2>
          <p className="text-slate-400 text-sm">You need to be logged in to access the tweets section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#141414' }}>

      {/* ── Content ── */}
      <div className="max-w-4xl w-full mx-auto px-8 py-8 flex flex-col gap-8 flex-1">

        {/* Composer */}
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'rgba(45,30,22,0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(236,91,19,0.1)',
          }}
        >
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: '#ec5b13' }}
                >
                  {(user.fullName || user.userName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's happening in your world?"
                className="w-full bg-transparent border-none text-lg text-slate-100 placeholder-slate-500 focus:ring-0 resize-none outline-none leading-relaxed"
                style={{ minHeight: '100px' }}
                maxLength={500}
              />

              {/* Image previews */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedImages.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden">
                      <img src={img.preview} alt="" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Poll builder */}
              {showPoll && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(58,40,30,0.6)', border: '1px solid rgba(65,46,36,1)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-300">Poll</p>
                    <button onClick={() => setShowPoll(false)} className="text-slate-400 hover:text-slate-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="Ask a question…"
                    className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none text-slate-100 placeholder-slate-500"
                    style={{ background: 'rgba(15,15,15,0.8)', border: '1px solid rgba(65,46,36,1)' }}
                    maxLength={200}
                    onFocus={e => { e.currentTarget.style.borderColor = '#ec5b13'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(65,46,36,1)'; }}
                  />
                  <div className="flex flex-col gap-2 mb-3">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={e => updatePollOption(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none text-slate-100 placeholder-slate-500"
                          style={{ background: 'rgba(15,15,15,0.8)', border: '1px solid rgba(65,46,36,1)' }}
                          maxLength={100}
                          onFocus={e => { e.currentTarget.style.borderColor = '#ec5b13'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(65,46,36,1)'; }}
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => removePollOption(i)} className="text-slate-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 5 && (
                    <button
                      onClick={addPollOption}
                      className="flex items-center gap-1 text-sm mb-3 font-medium transition-colors"
                      style={{ color: '#ec5b13' }}
                    >
                      <Plus className="w-4 h-4" /> Add option
                    </button>
                  )}
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-1.5 text-sm text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pollMultiple}
                        onChange={e => setPollMultiple(e.target.checked)}
                        className="rounded"
                        style={{ accentColor: '#ec5b13' }}
                      />
                      Multiple choice
                    </label>
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm text-slate-400">Ends at</label>
                      <input
                        type="datetime-local"
                        value={pollEndsAt}
                        onChange={e => setPollEndsAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="rounded px-2 py-1 text-xs outline-none text-slate-300"
                        style={{
                          background: 'rgba(15,15,15,0.8)',
                          border: '1px solid rgba(65,46,36,1)',
                          colorScheme: 'dark',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: '1px solid rgba(65,46,36,1)' }}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => imageInputRef.current && imageInputRef.current.click()}
                    disabled={selectedImages.length >= 4}
                    title="Add images (up to 4)"
                    className="p-2 rounded-lg transition-colors disabled:opacity-40"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ec5b13'; e.currentTarget.style.background = 'rgba(236,91,19,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  <button
                    onClick={() => setShowPoll(v => !v)}
                    title="Add a poll"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: showPoll ? '#ec5b13' : '#94a3b8', background: showPoll ? 'rgba(236,91,19,0.1)' : 'transparent' }}
                    onMouseEnter={e => { if (!showPoll) { e.currentTarget.style.color = '#ec5b13'; e.currentTarget.style.background = 'rgba(236,91,19,0.1)'; } }}
                    onMouseLeave={e => { if (!showPoll) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <BarChart2 className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ec5b13'; e.currentTarget.style.background = 'rgba(236,91,19,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ec5b13'; e.currentTarget.style.background = 'rgba(236,91,19,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{content.length}/500</span>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="flex items-center gap-2 px-8 py-2.5 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#ec5b13', boxShadow: '0 4px 15px rgba(236,91,19,0.2)' }}
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Tweet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(236,91,19,0.2)', borderTopColor: '#ec5b13' }}
            />
            <p className="text-slate-400 text-sm">Loading tweets…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchTweets} className="mt-2 text-red-300 hover:text-red-200 font-medium text-sm">
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && tweets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full scale-150"
                style={{ background: 'rgba(236,91,19,0.2)', filter: 'blur(48px)' }}
              />
              {/* Circle */}
              <div
                className="relative w-48 h-48 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(45,30,22,0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '2px solid rgba(236,91,19,0.2)',
                }}
              >
                <MessageSquare
                  className="w-20 h-20"
                  style={{ color: '#ec5b13', opacity: 0.8 }}
                  strokeWidth={1.5}
                />
              </div>
              {/* Badge */}
              <div
                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
                style={{ background: '#ec5b13', transform: 'rotate(12deg)' }}
              >
                <Plus className="w-5 h-5" />
              </div>
            </div>

            <div className="max-w-md flex flex-col gap-3">
              <h3 className="text-3xl font-black text-slate-100 tracking-tight">Your feed is waiting</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Share your first thought with the PlayVibe community. Connect with other creators and start the conversation.
              </p>
            </div>

            <button
              onClick={() => document.querySelector('textarea')?.focus()}
              className="mt-10 px-10 py-4 font-bold rounded-2xl flex items-center gap-3 group transition-all shadow-xl"
              style={{
                background: 'rgba(58,40,30,1)',
                border: '1px solid rgba(65,46,36,1)',
                color: '#e2e8f0',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ec5b13';
                e.currentTarget.style.borderColor = '#ec5b13';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(58,40,30,1)';
                e.currentTarget.style.borderColor = 'rgba(65,46,36,1)';
                e.currentTarget.style.color = '#e2e8f0';
              }}
            >
              <Edit3 className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span>Post your first tweet</span>
            </button>
          </div>
        )}

        {/* Tweet list */}
        {!loading && tweets.length > 0 && (
          <div className="flex flex-col gap-4">
            {tweets.map(tweet => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                currentUser={user}
                onDeleted={handleTweetDeleted}
                onUpdated={handleTweetUpdated}
              />
            ))}
          </div>
        )}

        {/* Footer stats */}
        <div
          className="mt-auto grid grid-cols-3 gap-6 transition-all"
          style={{ opacity: 0.4, filter: 'grayscale(1)' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.filter = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.filter = 'grayscale(1)'; }}
        >
          {[
            { icon: <Users className="w-5 h-5" />, label: 'Followers', value: '1.2k' },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Impressions', value: '8.4k' },
            { icon: <ThumbsUp className="w-5 h-5" />, label: 'Total Likes', value: '342' },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="p-4 rounded-xl flex items-center gap-4"
              style={{
                background: 'rgba(45,30,22,0.4)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(236,91,19,0.1)',
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400" style={{ background: 'rgba(30,20,15,0.8)' }}>
                {icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold">{label}</span>
                <span className="text-lg font-bold text-slate-300">{value}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Tweets;
