import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, MoreVertical, Trash2, Edit, List } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const Playlists = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (isLoggedIn) {
      fetchPlaylists();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await playlistService.getUserPlaylists();
      if (response && response.data) {
        // Filter to show only user playlists (not creator playlists)
        const userPlaylists = response.data.filter(playlist => playlist.type === 'user');
        setPlaylists(userPlaylists);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      showToast('Failed to load playlists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      showToast('Please enter a playlist name', 'error');
      return;
    }

    try {
      setCreating(true);
      const playlistData = {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        isPrivate: isPrivate,
        type: 'user' // Explicitly set type as user playlist
      };

      const response = await playlistService.createPlaylist(playlistData);
      if (response && response.data) {
        setPlaylists(prev => [response.data, ...prev]);
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setIsPrivate(false);
        showToast('Playlist created successfully!', 'success');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create playlist';
      showToast(errorMessage, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      await playlistService.deletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(playlist => playlist._id !== playlistId));
      showToast('Playlist deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Failed to delete playlist', 'error');
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your playlists</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to create and manage playlists.</p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Playlists</h1>
            <p className="text-gray-600 mt-2">Create and manage your personal video collections</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Playlist
          </button>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No playlists yet</h3>
            <p className="text-gray-600 mb-6">Create your first playlist to organize your favorite videos</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors"
            >
              Create Your First Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist._id}
                className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handlePlaylistClick(playlist._id)}
              >
                {/* Playlist Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300">
                  {playlist.videos && playlist.videos.length > 0 ? (
                    <div className="relative w-full h-full bg-gray-900">
                      {/* Placeholder for video thumbnail - in real app you'd fetch first video's thumbnail */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-80"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <List className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Video Count Overlay */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center">
                    <List className="w-3 h-3 mr-1" />
                    {playlist.videos?.length || 0}
                  </div>

                  {/* Privacy Badge */}
                  {playlist.isPrivate && (
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Private
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-full font-medium flex items-center">
                      <Play className="w-4 h-4 mr-2" />
                      Play all
                    </button>
                  </div>
                  
                  {/* Options Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add dropdown logic here if needed
                      }}
                      className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 min-h-[2.5rem]">
                    {playlist.name}
                  </h3>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>View full playlist</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist._id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="text-gray-500">
                      {playlist.videos?.length || 0} video{(playlist.videos?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">New playlist</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setIsPrivate(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePlaylist} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter playlist title"
                  required
                  maxLength={50}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {newPlaylistName.length}/50
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="Tell viewers about your playlist"
                  rows="3"
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {newPlaylistDescription.length}/200
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Visibility
                </label>
                <div className="space-y-3">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                      className="mt-1 mr-3 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Public</div>
                      <div className="text-sm text-gray-600">Anyone can search for and view</div>
                    </div>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                      className="mt-1 mr-3 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Private</div>
                      <div className="text-sm text-gray-600">Only you can view</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                    setIsPrivate(false);
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPlaylistName.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default Playlists;
