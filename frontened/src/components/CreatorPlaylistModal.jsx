import React, { useState, useEffect } from 'react';
import { X, Plus, Folder, CheckCircle } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';

const CreatorPlaylistModal = ({ isOpen, onClose, videoId, videoTitle }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fetch creator playlists
  useEffect(() => {
    if (isOpen && user) {
      fetchCreatorPlaylists();
    }
  }, [isOpen, user]);

  const fetchCreatorPlaylists = async () => {
    try {
      setLoading(true);
      const response = await playlistService.getCreatorPlaylists(user._id);
      console.log('Creator playlist response:', response); // Debug log
      if (response.success && response.data) {
        // Transform the data to ensure proper id field
        const transformedPlaylists = response.data.map(playlist => ({
          ...playlist,
          id: playlist._id || playlist.id
        }));
        console.log('Transformed creator playlists:', transformedPlaylists); // Debug log
        setPlaylists(transformedPlaylists);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Error fetching creator playlists:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setCreatingPlaylist(true);
      const playlistData = {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        type: "creator" // This is the key difference - creator playlists
      };

      const response = await playlistService.createPlaylist(playlistData);
      console.log('Create creator playlist response:', response); // Debug log

      if (response.success) {
        showToast('Creator playlist created successfully!', 'success');
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateForm(false);
        fetchCreatorPlaylists(); // Refresh playlist list
      } else {
        showToast('Failed to create creator playlist', 'error');
      }
    } catch (error) {
      console.error('Error creating creator playlist:', error);
      showToast('Failed to create creator playlist', 'error');
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      setAddingToPlaylist(playlistId);
      console.log('Adding to creator playlist:', { playlistId, videoId }); // Debug log
      
      // Handle regular creator playlists
      const response = await playlistService.addVideoToPlaylist(playlistId, videoId);

      if (response.success) {
        showToast('Video added to creator playlist!', 'success');
        // Optionally close modal after adding
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        showToast('Failed to add video to creator playlist', 'error');
      }
    } catch (error) {
      console.error('Error adding video to creator playlist:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add video to creator playlist';
      showToast(errorMessage, 'error');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add to Creator Playlist</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading creator playlists...</span>
            </div>
          ) : (
            <>
              {/* Creator Playlists */}
              {playlists.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Creator Playlists</h4>
                  <div className="space-y-2">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist._id || playlist.id}
                        onClick={() => handleAddToPlaylist(playlist._id || playlist.id)}
                        disabled={addingToPlaylist === (playlist._id || playlist.id)}
                        className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          {addingToPlaylist === (playlist._id || playlist.id) ? (
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Folder size={16} className="text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{playlist.name}</div>
                          {playlist.description && (
                            <div className="text-sm text-gray-500">{playlist.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No playlists message */}
              {playlists.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No creator playlists yet.</p>
                  <p className="text-sm">Create your first playlist to organize your videos!</p>
                </div>
              )}

              {/* Create New Playlist Button/Form */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Plus size={16} className="text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-700">Create New Creator Playlist</span>
                </button>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <form onSubmit={handleCreatePlaylist}>
                    <div className="mb-3">
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Creator playlist name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        maxLength={50}
                      />
                    </div>
                    <div className="mb-3">
                      <textarea
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        maxLength={200}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={creatingPlaylist || !newPlaylistName.trim()}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingPlaylist ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPlaylistName('');
                          setNewPlaylistDescription('');
                        }}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Toast notification */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        )}
      </div>
    </div>
  );
};

export default CreatorPlaylistModal;