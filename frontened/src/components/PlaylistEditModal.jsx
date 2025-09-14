import React, { useState, useEffect } from 'react';
import { X, Trash2, FolderMinus } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';

const PlaylistEditModal = ({ isOpen, onClose, videoId, videoTitle }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [videoPlaylists, setVideoPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingFromPlaylist, setRemovingFromPlaylist] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fetch creator playlists and check which ones contain this video
  useEffect(() => {
    if (isOpen && user && videoId) {
      fetchPlaylistsAndVideoStatus();
    }
  }, [isOpen, user, videoId]);

  const fetchPlaylistsAndVideoStatus = async () => {
    try {
      setLoading(true);
      
      // Get all creator playlists
      const response = await playlistService.getCreatorPlaylists(user._id);
      if (response.success && response.data) {
        const allPlaylists = response.data.map(playlist => ({
          ...playlist,
          id: playlist._id || playlist.id
        }));
        setPlaylists(allPlaylists);

        // Check which playlists contain this video
        const playlistsWithVideo = allPlaylists.filter(playlist => 
          playlist.videos && playlist.videos.includes(videoId)
        );
        setVideoPlaylists(playlistsWithVideo);
      } else {
        setPlaylists([]);
        setVideoPlaylists([]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
      setVideoPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromPlaylist = async (playlistId, playlistName) => {
    if (!window.confirm(`Remove "${videoTitle}" from "${playlistName}"?`)) {
      return;
    }

    try {
      setRemovingFromPlaylist(playlistId);
      console.log('Removing from creator playlist:', { playlistId, videoId }); 
      
      const response = await playlistService.removeVideoFromPlaylist(playlistId, videoId);

      if (response.success) {
        showToast(`Video removed from "${playlistName}"!`, 'success');
        // Refresh the playlist status
        fetchPlaylistsAndVideoStatus();
      } else {
        showToast('Failed to remove video from playlist', 'error');
      }
    } catch (error) {
      console.error('Error removing video from playlist:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove video from playlist';
      showToast(errorMessage, 'error');
    } finally {
      setRemovingFromPlaylist(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Manage Playlist Assignments</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Video: {videoTitle}</h4>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading playlists...</span>
            </div>
          ) : (
            <>
              {/* Playlists containing this video */}
              {videoPlaylists.length > 0 ? (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FolderMinus size={16} className="mr-2" />
                    Currently in these playlists:
                  </h4>
                  <div className="space-y-2">
                    {videoPlaylists.map((playlist) => (
                      <div
                        key={playlist._id || playlist.id}
                        className="flex items-center justify-between p-3 border border-purple-200 bg-purple-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{playlist.name}</div>
                          {playlist.description && (
                            <div className="text-sm text-gray-500">{playlist.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveFromPlaylist(playlist._id || playlist.id, playlist.name)}
                          disabled={removingFromPlaylist === (playlist._id || playlist.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
                          title="Remove from playlist"
                        >
                          {removingFromPlaylist === (playlist._id || playlist.id) ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 mb-6">
                  <FolderMinus size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>This video is not in any creator playlists yet.</p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Video is in <strong>{videoPlaylists.length}</strong> playlist(s)</p>
                  <p>• Total creator playlists: <strong>{playlists.length}</strong></p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Done
                </button>
              </div>
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

export default PlaylistEditModal;