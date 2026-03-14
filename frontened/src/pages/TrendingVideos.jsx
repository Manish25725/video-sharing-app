import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, Flame, Play, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { videoService, transformVideosArray } from '../services/videoService';
import { formatTimeAgo, formatViews, formatDuration } from '../utils/formatters';

const TABS = ['All', 'Music', 'Gaming', 'Movies'];

const TrendingVideos = ({ onVideoSelect }) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchTrendingVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await videoService.getTrendingVideos();
      if (response.success && response.data) {
        setVideos(transformVideosArray(response.data));
      } else {
        setError(response.message || 'Failed to fetch trending videos');
        setVideos([]);
      }
    } catch (err) {
      setError('Failed to load trending videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrendingVideos();
    setRefreshing(false);
  };

  const handleVideoClick = (video) => {
    if (onVideoSelect) {
      onVideoSelect(video.id || video._id);
    } else {
      navigate(`/video/${video.id || video._id}`);
    }
  };

  const handleChannelClick = (e, video) => {
    e.stopPropagation();
    const ownerId = video.owner?._id || video.ownerDetails?._id;
    if (ownerId) navigate(`/profile/${ownerId}`);
  };

  useEffect(() => { fetchTrendingVideos(); }, []);

  // ── Unique creators extracted from videos ──
  const creators = Array.from(
    new Map(
      videos
        .filter(v => v.owner?._id || v.ownerDetails?._id)
        .map(v => {
          const id = v.owner?._id || v.ownerDetails?._id;
          const name = v.owner?.fullName || v.ownerDetails?.fullName || 'Unknown';
          const avatar = v.owner?.avatar || v.ownerDetails?.avatar;
          return [id, { id, name, avatar, views: v.views || 0 }];
        })
    ).values()
  ).slice(0, 6);

  const heroBg = "linear-gradient(135deg, rgba(236,91,19,0.25) 0%, rgba(12,6,2,0.95) 100%)";

  // ──────────── LOADING ────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Trending Now" />
      </div>
    );
  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrendingVideos;
