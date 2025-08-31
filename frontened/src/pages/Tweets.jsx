import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Send, 
  X,
  Clock,
  User
} from 'lucide-react';
import { tweetService, transformTweetsArray } from '../services/tweetService';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeAgo } from '../utils/formatters';

const Tweets = () => {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTweetContent, setNewTweetContent] = useState('');
  const [editingTweet, setEditingTweet] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTweets();
    }
  }, [user]);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await tweetService.getUserTweets();
      
      if (response.success && response.data) {
        const transformedTweets = transformTweetsArray(response.data);
        setTweets(transformedTweets);
      } else {
        setTweets([]);
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
      setError('Failed to load tweets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTweet = async () => {
    if (!newTweetContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await tweetService.createTweet(newTweetContent.trim());
      
      if (response.success) {
        setNewTweetContent('');
        setShowCreateModal(false);
        await fetchTweets(); // Refresh tweets
      } else {
        alert(response.message || 'Failed to create tweet');
      }
    } catch (error) {
      console.error('Error creating tweet:', error);
      alert('Failed to create tweet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTweet = async () => {
    if (!newTweetContent.trim() || !editingTweet) return;

    try {
      setSubmitting(true);
      const response = await tweetService.updateTweet(editingTweet.id, newTweetContent.trim());
      
      if (response.success) {
        setNewTweetContent('');
        setShowEditModal(false);
        setEditingTweet(null);
        await fetchTweets(); // Refresh tweets
      } else {
        alert(response.message || 'Failed to update tweet');
      }
    } catch (error) {
      console.error('Error updating tweet:', error);
      alert('Failed to update tweet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Are you sure you want to delete this tweet?')) return;

    try {
      const response = await tweetService.deleteTweet(tweetId);
      
      if (response.success) {
        await fetchTweets(); // Refresh tweets
      } else {
        alert(response.message || 'Failed to delete tweet');
      }
    } catch (error) {
      console.error('Error deleting tweet:', error);
      alert('Failed to delete tweet');
    }
  };

  const openEditModal = (tweet) => {
    setEditingTweet(tweet);
    setNewTweetContent(tweet.content);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setNewTweetContent('');
    setEditingTweet(null);
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Tweets</h1>
                <p className="text-gray-600">Share your thoughts with the world</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tweet
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tweets...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchTweets}
              className="mt-2 text-red-700 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Tweets List */}
        {!loading && tweets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tweets yet</h3>
              <p className="text-gray-600 mb-6">Start sharing your thoughts by creating your first tweet!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Tweet
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tweets.map((tweet) => (
              <div key={tweet.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.fullName || user?.userName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(tweet.createdAt)}
                        {tweet.updatedAt !== tweet.createdAt && (
                          <span className="ml-2 text-xs">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(tweet)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit tweet"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTweet(tweet.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete tweet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="ml-13">
                  <p className="text-gray-800 whitespace-pre-wrap">{tweet.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Tweet Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create New Tweet</h3>
                <button 
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <textarea
                  value={newTweetContent}
                  onChange={(e) => setNewTweetContent(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={280}
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    {newTweetContent.length}/280
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeModals}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTweet}
                      disabled={!newTweetContent.trim() || submitting}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Tweet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tweet Modal */}
        {showEditModal && editingTweet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Tweet</h3>
                <button 
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <textarea
                  value={newTweetContent}
                  onChange={(e) => setNewTweetContent(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={280}
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    {newTweetContent.length}/280
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={closeModals}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditTweet}
                      disabled={!newTweetContent.trim() || submitting}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Edit3 className="w-4 h-4 mr-2" />
                      )}
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tweets;
