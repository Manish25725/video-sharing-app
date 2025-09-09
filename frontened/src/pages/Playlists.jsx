import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, MoreVertical, Trash2, Edit, List } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { videoService } from '../services/videoService';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const Playlists = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [playlistThumbnails, setPlaylistThumbnails] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
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
        
        // Fetch thumbnails for playlists with videos
        const thumbnailPromises = userPlaylists.map(async (playlist) => {
          if (playlist.videos && playlist.videos.length > 0) {
            try {
              // Fetch actual video data to get proper thumbnail
              const firstVideoId = playlist.videos[0]._id || playlist.videos[0];
              const videoResponse = await videoService.getVideoById(firstVideoId);
              
              return {
                playlistId: playlist._id,
                thumbnail: videoResponse?.data?.thumbnail
              };
            } catch (error) {
              console.error('Error fetching video thumbnail:', error);
              return { playlistId: playlist._id, thumbnail: null };
            }
          }
          return { playlistId: playlist._id, thumbnail: null };
        });
        
        const thumbnailResults = await Promise.all(thumbnailPromises);
        const thumbnailMap = {};
        thumbnailResults.forEach(({ playlistId, thumbnail }) => {
          thumbnailMap[playlistId] = thumbnail;
        });
        setPlaylistThumbnails(thumbnailMap);
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
        type: 'user' // Explicitly set type as user playlist
      };

      const response = await playlistService.createPlaylist(playlistData);
      if (response && response.data) {
        setPlaylists(prev => [response.data, ...prev]);
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
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
                <div className="relative aspect-video bg-gray-900 overflow-hidden">
                  {playlist.videos && playlist.videos.length > 0 ? (
                    <div className="relative w-full h-full">
                      {/* Main thumbnail - show actual first video thumbnail */}
                      <div className="absolute inset-0">
                        {playlistThumbnails[playlist._id] ? (
                          <img 
                            src={playlistThumbnails[playlist._id]} 
                            alt={`${playlist.name} thumbnail`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback gradient background */}
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center" style={{display: playlistThumbnails[playlist._id] ? 'none' : 'flex'}}>
                          <div className="bg-red-600 rounded-full p-3 shadow-lg">
                            <Play className="w-6 h-6 text-white fill-current" />
                          </div>
                        </div>
                        
                        {/* Overlay gradient for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/60"></div>
                      </div>
                      
                      {/* Sidebar showing video count */}
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-black/80 flex flex-col justify-center items-center text-white">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{playlist.videos?.length || 0}</div>
                          <div className="text-xs opacity-80">
                            {(playlist.videos?.length || 0) === 1 ? 'video' : 'videos'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 relative">
                      {/* Empty playlist design */}
                      <div className="text-center text-gray-400">
                        <List className="w-12 h-12 mx-auto mb-2" />
                        <div className="text-xs">No videos</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Count Overlay (bottom right) */}
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-2 py-0.5 rounded flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    {playlist.videos?.length || 0}
                  </div>



                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full font-medium flex items-center shadow-lg transform scale-95 hover:scale-100 transition-transform">
                      <Play className="w-4 h-4 mr-2" />
                      Play all
                    </div>
                  </div>
                  
                  {/* Options Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add dropdown logic here if needed
                      }}
                      className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-sm"
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
