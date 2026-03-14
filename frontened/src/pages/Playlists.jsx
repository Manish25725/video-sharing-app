import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Play, Trash2, List, PlusCircle, Grid3X3, Rows3, Clock3, Heart, Shuffle, SkipBack, SkipForward, Repeat, Volume2, Maximize2, Music4 } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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

  const filteredPlaylists = playlists.filter((playlist) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      playlist.name?.toLowerCase().includes(term) ||
      playlist.description?.toLowerCase().includes(term)
    );
  });

  const recentTracks = playlists.slice(0, 5).map((playlist, index) => ({
    id: playlist._id,
    order: index + 1,
    title: playlist.name,
    artist: user?.fullName || user?.userName || 'PlayVibe',
    album: playlist.description || 'Your playlist collection',
    dateAdded: playlist.updatedAt ? new Date(playlist.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently updated',
    duration: `${Math.max(1, playlist.videos?.length || 0)}:${String(((playlist.videos?.length || 0) * 7) % 60).padStart(2, '0')}`,
    thumbnail: playlistThumbnails[playlist._id],
  }));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Loading your playlists…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-slate-100">Playlists</h2>
              <p className="mt-1" style={{ color: '#94a3b8' }}>
                Organize your mood with {filteredPlaylists.length} active collection{filteredPlaylists.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: 'rgba(236,91,19,0.1)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 rounded-md shadow-sm transition-colors"
                style={viewMode === 'grid' ? { background: 'rgba(236,91,19,0.2)', color: '#ec5b13' } : { color: '#94a3b8' }}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-md transition-colors"
                style={viewMode === 'list' ? { background: 'rgba(236,91,19,0.2)', color: '#ec5b13' } : { color: '#94a3b8' }}
              >
                <Rows3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredPlaylists.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(236,91,19,0.12)' }}>
                <List className="w-10 h-10" style={{ color: '#ec5b13' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{search ? 'No playlists found' : 'No playlists yet'}</h3>
              <p className="mb-8" style={{ color: '#94a3b8' }}>
                {search ? `No playlists match "${search}".` : 'Create your first playlist to organize your favorite videos.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#ec5b13', boxShadow: '0 8px 24px rgba(236,91,19,0.35)' }}
              >
                Create Your First Playlist
              </button>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                {filteredPlaylists.map((playlist, index) => (
                  <div
                    key={playlist._id}
                    className="playlist-card group cursor-pointer"
                    onClick={() => handlePlaylistClick(playlist._id)}
                  >
                    <div
                      className={`${viewMode === 'grid' ? 'aspect-square' : 'aspect-[16/9]'} relative rounded-2xl overflow-hidden mb-4 transition-all duration-300 group-hover:-translate-y-2`}
                      style={{
                        background: 'rgba(30,17,10,0.7)',
                        boxShadow: '0 0 0 1px rgba(236,91,19,0.08)',
                      }}
                    >
                      {playlistThumbnails[playlist._id] ? (
                        <img
                          src={playlistThumbnails[playlist._id]}
                          alt={playlist.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(236,91,19,0.12), rgba(59,130,246,0.08))' }}>
                          <Music4 className="w-12 h-12" style={{ color: 'rgba(236,91,19,0.45)' }} />
                        </div>
                      )}
                      <div className="play-overlay absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity duration-300">
                        <div className="bg-[#ec5b13] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <Play className="w-7 h-7 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        <span className="bg-black/60 backdrop-blur-md text-[10px] px-2 py-1 rounded text-white font-bold uppercase tracking-wider">
                          {playlist.videos?.length > 40 ? 'MEGA MIX' : playlist.videos?.length > 15 ? 'ENERGY' : 'CHILL'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: 'rgba(0,0,0,0.65)' }}>
                          {playlist.videos?.length || 0} tracks
                        </span>
                        <button
                          className="p-2 rounded-full transition-colors"
                          style={{ background: 'rgba(0,0,0,0.55)', color: '#f8fafc' }}
                          onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist._id); }}
                          title="Delete playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg transition-colors text-slate-100 group-hover:text-[#ec5b13]">{playlist.name}</h3>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                      {playlist.videos?.length || 0} Tracks • {index === 0 ? 'Updated today' : index === 1 ? '2 hours ago' : index < 4 ? '3 days ago' : 'Last month'}
                    </p>
                  </div>
                ))}

                <div className="group cursor-pointer" onClick={() => setShowCreateModal(true)}>
                  <div className={`${viewMode === 'grid' ? 'aspect-square' : 'aspect-[16/9]'} relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center mb-4 transition-all duration-300`} style={{ borderColor: 'rgba(236,91,19,0.2)', background: 'rgba(236,91,19,0.05)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(236,91,19,0.1)', color: '#ec5b13' }}>
                      <Plus className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-center transition-colors text-slate-100 group-hover:text-[#ec5b13]">New Playlist</h3>
                </div>
              </div>

              <div className="mt-20">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-100">
                  <Clock3 className="w-6 h-6" style={{ color: '#ec5b13' }} />
                  Recently Played
                </h3>
                <div className="rounded-3xl p-6 overflow-x-auto" style={{ background: 'rgba(236, 91, 19, 0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(236, 91, 19, 0.1)' }}>
                  <table className="w-full text-left min-w-[720px]">
                    <thead>
                      <tr className="text-sm border-b" style={{ color: '#94a3b8', borderColor: 'rgba(236,91,19,0.1)' }}>
                        <th className="pb-4 font-medium pl-4">#</th>
                        <th className="pb-4 font-medium">Title</th>
                        <th className="pb-4 font-medium">Album</th>
                        <th className="pb-4 font-medium">Date Added</th>
                        <th className="pb-4 font-medium text-right pr-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTracks.map((track) => (
                        <tr key={track.id} className="group transition-colors cursor-pointer" onClick={() => handlePlaylistClick(track.id)}>
                          <td className="py-4 pl-4 group-hover:text-[#ec5b13]" style={{ color: '#94a3b8' }}>{track.order}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                {track.thumbnail ? (
                                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Music4 className="w-4 h-4" style={{ color: '#ec5b13' }} /></div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-100">{track.title}</p>
                                <p className="text-xs" style={{ color: '#94a3b8' }}>{track.artist}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-sm" style={{ color: '#94a3b8' }}>{track.album}</td>
                          <td className="py-4 text-sm" style={{ color: '#94a3b8' }}>{track.dateAdded}</td>
                          <td className="py-4 text-sm text-right pr-4" style={{ color: '#94a3b8' }}>{track.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {filteredPlaylists.length > 0 && (
          <footer className="mt-auto px-4 md:px-8 py-4 flex items-center justify-between sticky bottom-0" style={{ background: 'rgba(236, 91, 19, 0.05)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(236, 91, 19, 0.1)' }}>
            <div className="flex items-center gap-4 w-1/3 min-w-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {playlistThumbnails[filteredPlaylists[0]._id] ? (
                  <img src={playlistThumbnails[filteredPlaylists[0]._id]} alt={filteredPlaylists[0].name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music4 className="w-5 h-5" style={{ color: '#ec5b13' }} /></div>
                )}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="font-bold text-sm text-slate-100 truncate">{filteredPlaylists[0].name}</p>
                <p className="text-xs font-medium truncate" style={{ color: '#ec5b13' }}>Featured Playlist</p>
              </div>
              <button className="text-slate-400 hover:text-[#ec5b13] transition-colors"><Heart className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-[#ec5b13]"><Shuffle className="w-4 h-4" /></button>
                <button className="text-slate-400 hover:text-[#ec5b13]"><SkipBack className="w-4 h-4" /></button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform" style={{ background: '#ec5b13', boxShadow: '0 8px 24px rgba(236,91,19,0.3)' }}>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
                <button className="text-slate-400 hover:text-[#ec5b13]"><SkipForward className="w-4 h-4" /></button>
                <button className="text-slate-400 hover:text-[#ec5b13]"><Repeat className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-3 w-full max-w-md">
                <span className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>1:24</span>
                <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                  <div className="h-full w-1/3 rounded-full relative" style={{ background: '#ec5b13' }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2" style={{ borderColor: '#ec5b13' }}></div>
                  </div>
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>3:45</span>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
              <Volume2 className="w-4 h-4" style={{ color: '#94a3b8' }} />
              <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                <div className="h-full w-3/4 rounded-full" style={{ background: '#64748b' }}></div>
              </div>
              <List className="w-4 h-4" style={{ color: '#94a3b8' }} />
              <Maximize2 className="w-4 h-4" style={{ color: '#94a3b8' }} />
            </div>
          </footer>
        )}
      </main>

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

