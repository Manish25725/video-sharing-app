import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Image, BarChart2, X, Send, Plus
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

  const canSubmit = content.trim() || selectedImages.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    const formData = new FormData();
    formData.append('content', content.trim());
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view tweets</h2>
          <p className="text-gray-600">You need to be logged in to access the tweets section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Tweets</h1>
          <p className="text-gray-500 text-sm mt-1">Share updates, polls and images with your subscribers</p>
        </div>

        {/* Composer */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-start gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(user.fullName || user.userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's on your mind? Share with your subscribers…"
                className="w-full resize-none outline-none text-gray-800 placeholder-gray-400 text-sm leading-relaxed"
                rows={3}
                maxLength={500}
              />

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {selectedImages.map((img, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden">
                      <img src={img.preview} alt="" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-0.5 text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showPoll && (
                <div className="mt-3 bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Poll</p>
                    <button onClick={() => setShowPoll(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={pollQuestion}
                    onChange={e => setPollQuestion(e.target.value)}
                    placeholder="Ask a question…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                  <div className="space-y-2 mb-3">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={e => updatePollOption(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={100}
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => removePollOption(i)} className="text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 5 && (
                    <button
                      onClick={addPollOption}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-3"
                    >
                      <Plus className="w-4 h-4" /> Add option
                    </button>
                  )}
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pollMultiple}
                        onChange={e => setPollMultiple(e.target.checked)}
                        className="rounded"
                      />
                      Multiple choice
                    </label>
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm text-gray-600">Ends at</label>
                      <input
                        type="datetime-local"
                        value={pollEndsAt}
                        onChange={e => setPollEndsAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => imageInputRef.current && imageInputRef.current.click()}
                    disabled={selectedImages.length >= 4}
                    title="Add images (up to 4)"
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-40"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => setShowPoll(v => !v)}
                    title="Add a poll"
                    className={`p-2 rounded-full transition-colors ${
                      showPoll ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <BarChart2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{content.length}/500</span>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading tweets…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchTweets} className="mt-2 text-red-700 hover:text-red-800 font-medium text-sm">
              Try again
            </button>
          </div>
        )}

        {!loading && tweets.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <MessageSquare className="mx-auto h-14 w-14 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No tweets yet</h3>
            <p className="text-gray-500 text-sm">Post your first tweet using the composer above.</p>
          </div>
        )}

        {!loading && tweets.length > 0 && (
          <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default Tweets;
