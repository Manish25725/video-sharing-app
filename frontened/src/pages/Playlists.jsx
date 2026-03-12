import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, MoreVertical, Trash2, List, PlusCircle } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#120a06" }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg,#ec5b13,#9333ea)" }}>
            <List className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Sign in to view your playlists</h2>
          <p className="text-slate-400 mb-8">You need to be signed in to create and manage playlists.</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: "#ec5b13", boxShadow: "0 8px 24px rgba(236,91,19,0.35)" }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#120a06" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#ec5b13] animate-spin mx-auto mb-4"
            style={{ borderTopColor: "#ec5b13", borderRightColor: "rgba(236,91,19,0.2)" }} />
          <p className="text-slate-400">Loading your playlists…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#120a06" }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Title & Actions ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight text-white">My Playlists</h2>
            <p className="text-slate-400">Curate and organize your favorite videos</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{ background: "#ec5b13", boxShadow: "0 8px 24px rgba(236,91,19,0.3)" }}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Playlist</span>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-8 mb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <button className="pb-4 px-2 text-sm font-bold border-b-2 transition-colors"
            style={{ borderColor: "#ec5b13", color: "#ec5b13" }}>
            All Playlists
          </button>
          <button className="pb-4 px-2 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors">
            Recently Added
          </button>
          <button className="pb-4 px-2 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-300 transition-colors">
            Shared with me
          </button>
        </div>

        {/* ── Empty State ── */}
        {playlists.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(236,91,19,0.12)" }}>
              <List className="w-10 h-10" style={{ color: "#ec5b13" }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No playlists yet</h3>
            <p className="text-slate-400 mb-8">Create your first playlist to organize your favorite videos</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
              style={{ background: "#ec5b13", boxShadow: "0 8px 24px rgba(236,91,19,0.35)" }}
            >
              Create Your First Playlist
            </button>
          </div>
        ) : (
          /* ── Playlist Grid ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist._id}
                className="group flex flex-col gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: "rgba(30,17,10,0.7)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  backdropFilter: "blur(8px)",
                }}
                onMouseEnter={e => e.currentTarget.style.border = "1px solid rgba(236,91,19,0.25)"}
                onMouseLeave={e => e.currentTarget.style.border = "1px solid rgba(255,255,255,0.05)"}
                onClick={() => handlePlaylistClick(playlist._id)}
              >
                {/* Thumbnail — square */}
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-xl"
                  style={{ background: "rgba(12,6,2,0.8)" }}>
                  {playlistThumbnails[playlist._id] ? (
                    <img
                      src={playlistThumbnails[playlist._id]}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,rgba(236,91,19,0.15),rgba(147,51,234,0.15))" }}>
                      <List className="w-12 h-12 text-slate-600" />
                    </div>
                  )}

                  {/* Hover play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all"
                      style={{ background: "#ec5b13", boxShadow: "0 8px 32px rgba(236,91,19,0.5)" }}
                      onClick={(e) => { e.stopPropagation(); handlePlaylistClick(playlist._id); }}
                    >
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </button>
                  </div>

                  {/* Video count badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
                    {playlist.videos?.length || 0} videos
                  </div>
                </div>

                {/* Info row */}
                <div className="flex justify-between items-start pt-1">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate pr-2 text-sm">{playlist.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {playlist.videos?.length || 0} video{(playlist.videos?.length || 0) !== 1 ? 's' : ''}
                      {playlist.description ? ` • ${playlist.description.slice(0, 30)}${playlist.description.length > 30 ? '…' : ''}` : ''}
                    </p>
                  </div>
                  <button
                    className="text-slate-500 hover:text-[#ec5b13] transition-colors flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist._id); }}
                    title="Delete playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Playlist Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(28,15,8,0.95)", border: "1px solid rgba(236,91,19,0.2)", backdropFilter: "blur(24px)" }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="text-lg font-bold text-white">New Playlist</h2>
              <button
                onClick={() => { setShowCreateModal(false); setNewPlaylistName(''); setNewPlaylistDescription(''); }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePlaylist} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => e.target.style.border = "1px solid rgba(236,91,19,0.5)"}
                  onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
                  placeholder="Enter playlist title"
                  required
                  maxLength={50}
                />
                <div className="text-[10px] text-slate-600 mt-1 text-right">{newPlaylistName.length}/50</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all resize-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => e.target.style.border = "1px solid rgba(236,91,19,0.5)"}
                  onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,0.08)"}
                  placeholder="Tell viewers about your playlist"
                  rows="3"
                  maxLength={200}
                />
                <div className="text-[10px] text-slate-600 mt-1 text-right">{newPlaylistDescription.length}/200</div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewPlaylistName(''); setNewPlaylistDescription(''); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPlaylistName.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#ec5b13", boxShadow: "0 4px 14px rgba(236,91,19,0.35)" }}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
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

