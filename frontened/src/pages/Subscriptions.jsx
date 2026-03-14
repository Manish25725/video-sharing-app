import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, Play, Search } from "lucide-react";
import { subscriptionService } from "../services/subscriptionService.js";
import { videoService, transformVideosArray } from "../services/videoService.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatViews, formatTimeAgo, formatDuration } from "../utils/formatters.js";
import PageLoader from "../components/PageLoader.jsx";

const Subscriptions = ({ onVideoSelect }) => {
  const { user, isLoggedIn: isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [subscriptionVideos, setSubscriptionVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingNotif, setTogglingNotif] = useState(null);

  useEffect(() => {
    const fetchSubscribedChannels = async () => {
      if (!isAuthenticated || !user) {
        setSubscribedChannels([]);
        setSubscriptionVideos([]);
        setLoading(false);
        return;
      }
      try {
        const response = await subscriptionService.getSubscribedChannels(user._id);
        if (response.success !== false && response.data) {
          const transformedChannels = response.data.map(channel => ({
            id: channel._id,
            name: channel.fullName || channel.userName,
            avatar: channel.avatar,
            subscribers: channel.subscribersCount || 0,
            isNotificationOn: channel.notificationsEnabled !== false,
          }));
          setSubscribedChannels(transformedChannels);
          await fetchSubscriptionVideos(response.data);
        } else {
          setSubscribedChannels([]);
          setSubscriptionVideos([]);
        }
      } catch (err) {
        setError('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribedChannels();
  }, [isAuthenticated, user]);

  const fetchSubscriptionVideos = async (channels) => {
    if (!channels || channels.length === 0) { setSubscriptionVideos([]); return; }
    try {
      let allVideos = [];
      for (const channel of channels) {
        const response = await videoService.getAllVideos(1, 5, '', 'createdAt', 'desc', channel._id);
        if (response.success !== false && response.data) {
          allVideos = [...allVideos, ...transformVideosArray(response.data)];
        }
      }
      allVideos.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      setSubscriptionVideos(allVideos.slice(0, 15));
    } catch (err) {
      setError('Failed to load subscription videos');
    }
  };

  /* â”€â”€ Loading â”€â”€ */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
        <PageLoader message="Loading subscriptions..." />
      </div>
    );
  }

  /* â”€â”€ Not authenticated â”€â”€ */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#141414' }}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(236,91,19,0.1)' }}>
            <Bell className="w-10 h-10" style={{ color: '#ec5b13' }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Sign in to see your subscriptions</h2>
          <p className="text-slate-400 text-sm">You need to be logged in to view your subscribed channels and videos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#141414' }}>

      {/* â”€â”€ Scrollable content â”€â”€ */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* â”€â”€ Subscribed Channels â”€â”€ */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Subscribed Channels</h2>
            <a className="text-sm font-semibold hover:underline transition-colors" style={{ color: '#ec5b13' }} href="#">
              View All
            </a>
          </div>

          {subscribedChannels.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">You haven't subscribed to any channels yet.</p>
              <p className="text-slate-500 text-xs mt-1">Explore videos and subscribe to channels you like!</p>
            </div>
          ) : (
            <div className="flex gap-8 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
              {subscribedChannels.map(channel => (
                <div key={channel.id} className="flex flex-col items-center gap-3 min-w-[80px] group cursor-pointer flex-shrink-0">
                  <div className="relative">
                    {/* Orange gradient ring for active channels, plain for others */}
                    <div
                      className="w-20 h-20 rounded-full p-1"
                      style={{ background: channel.isNotificationOn
                        ? 'linear-gradient(135deg, #ec5b13, #fb923c)'
                        : 'rgba(61,40,29,1)' }}
                    >
                      <div
                        className="w-full h-full rounded-full overflow-hidden border-4"
                        style={{ borderColor: '#141414' }}
                      >
                        {channel.avatar ? (
                          <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                            style={{ background: '#ec5b13' }}>
                            {(channel.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Notification toggle badge */}
                    <button
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-md hover:scale-110 transition-transform disabled:opacity-50"
                      style={{
                        background: channel.isNotificationOn ? '#ec5b13' : 'rgba(15,15,15,1)',
                        borderColor: '#141414',
                      }}
                      title={channel.isNotificationOn ? "Turn off notifications" : "Turn on notifications"}
                      disabled={togglingNotif === channel.id}
                      onClick={async () => {
                        setTogglingNotif(channel.id);
                        try {
                          const res = await subscriptionService.toggleNotification(channel.id);
                          if (res?.data?.notificationsEnabled !== undefined) {
                            setSubscribedChannels(prev =>
                              prev.map(c => c.id === channel.id
                                ? { ...c, isNotificationOn: res.data.notificationsEnabled }
                                : c
                              )
                            );
                          }
                        } finally {
                          setTogglingNotif(null);
                        }
                      }}
                    >
                      {channel.isNotificationOn
                        ? <Bell className="w-3 h-3 text-white" />
                        : <BellOff className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-center text-slate-300 group-hover:text-orange-400 transition-colors truncate w-20">
                    {channel.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* â”€â”€ Latest Videos â”€â”€ */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">Latest Videos</h2>
              <span
                className="px-2 py-0.5 text-[10px] font-bold rounded uppercase"
                style={{ background: 'rgba(236,91,19,0.2)', color: '#ec5b13' }}
              >
                New Today
              </span>
            </div>
          </div>

          {subscriptionVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(236,91,19,0.1)' }}>
                <Play className="w-10 h-10" style={{ color: '#ec5b13' }} />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">No recent videos</h3>
              <p className="text-slate-400 text-sm">Check back later for new content from your subscriptions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {subscriptionVideos.map(video => (
                <VideoCardInline
                  key={video.id}
                  video={video}
                  onClick={() => onVideoSelect ? onVideoSelect(video.id) : navigate(`/video/${video.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/* â”€â”€ Inline video card matching the reference design â”€â”€ */
const VideoCardInline = ({ video, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col gap-3 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden" style={{ background: 'rgba(61,40,29,1)' }}>
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          />
        )}
        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.4)', opacity: hovered ? 1 : 0 }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: '#ec5b13' }}
          >
            <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {/* Duration */}
        <span
          className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-1 rounded-md text-white"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        >
          {formatDuration(video.duration)}
        </span>
      </div>

      {/* Info */}
      <div className="flex gap-3">
        {/* Channel avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1">
          {video.ownerAvatar ? (
            <img src={video.ownerAvatar} alt={video.ownerName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: '#ec5b13' }}>
              {(video.ownerName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <h3
            className="font-bold text-sm leading-snug line-clamp-2 transition-colors"
            style={{ color: hovered ? '#ec5b13' : '#f1f5f9' }}
          >
            {video.title}
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            {video.ownerName}
            {video.views ? <> &bull; {formatViews(video.views)}</> : null}
            {video.uploadTime ? <> &bull; {formatTimeAgo(video.uploadTime)}</> : null}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
