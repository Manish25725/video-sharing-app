import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Shuffle, Heart, MoreHorizontal, Clock, ListVideo } from 'lucide-react';
import { playlistService } from '../services/playlistService';
import { videoService } from '../services/videoService';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const PlaylistDetail = ({ onVideoSelect }) => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (playlistId && isLoggedIn) {
      fetchPlaylistDetails();
    }
  }, [playlistId, isLoggedIn]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      const response = await playlistService.getPlaylistById(playlistId);
      
      if (response && response.data) {
        setPlaylist(response.data);
        
        // Fetch videos that are in this playlist
        if (response.data.videos && response.data.videos.length > 0) {
          await fetchPlaylistVideos(response.data.videos);
        } else {
          setVideos([]);
        }
      } else {
        showToast('Playlist not found', 'error');
        navigate('/playlists');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      showToast('Failed to load playlist', 'error');
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistVideos = async (videoIds) => {
    try {
      setVideosLoading(true);
      // Fetch details for each video in the playlist
      const videoPromises = videoIds.map(async (videoId) => {
        try {
          const videoResponse = await videoService.getVideoById(videoId);
          return videoResponse.data;
        } catch (error) {
          console.error(`Error fetching video ${videoId}:`, error);
          return null;
        }
      });

      const videoResults = await Promise.all(videoPromises);
      // Filter out any null results (videos that failed to load)
      const validVideos = videoResults.filter(video => video !== null);
      setVideos(validVideos);
    } catch (error) {
      console.error('Error fetching playlist videos:', error);
      showToast('Failed to load playlist videos', 'error');
    } finally {
      setVideosLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (videos.length > 0) {
      // Navigate to first video with playlist context
      navigate(`/video/${videos[0]._id}?list=${playlistId}&index=0`);
    }
  };

  const handleVideoClick = (video, index) => {
    setCurrentVideoIndex(index);
    navigate(`/video/${video._id}?list=${playlistId}&index=${index}`);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const totalSeconds = Math.floor(Number(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const uploadDate = new Date(date);
    const diffTime = Math.abs(now - uploadDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Sign in to view playlists</h2>
          <button
            onClick={() => navigate('/auth')}
            className="text-white px-6 py-2 rounded-xl font-bold"
            style={{ background: '#ec5b13' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 w-full bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Playlist not found" />
      </div>
    );
  };

export default PlaylistDetail;
