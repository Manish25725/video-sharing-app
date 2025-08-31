import { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard.jsx";
import { Bell, BellOff } from "lucide-react";
import { subscriptionService } from "../services/subscriptionService.js";
import { videoService, transformVideosArray } from "../services/videoService.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const Subscriptions = ({ onVideoSelect }) => {
  const { user, isLoggedIn: isAuthenticated } = useAuth();
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [subscriptionVideos, setSubscriptionVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscribed channels when component mounts
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
        console.log('Subscribed channels response:', response);
        
        if (response.success !== false && response.data) {
          // Transform backend data to frontend format
          const transformedChannels = response.data.map(channel => ({
            id: channel._id,
            name: channel.fullName || channel.userName,
            avatar: channel.avatar,
            subscribers: channel.subscribersCount || 0,
            isNotificationOn: true // Default to true, can be made dynamic later
          }));
          
          setSubscribedChannels(transformedChannels);
          
          // Fetch videos from subscribed channels
          await fetchSubscriptionVideos(response.data);
        } else {
          setSubscribedChannels([]);
          setSubscriptionVideos([]);
        }
      } catch (err) {
        console.error('Error fetching subscribed channels:', err);
        setError('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribedChannels();
  }, [isAuthenticated, user]);

  // Fetch videos from subscribed channels
  const fetchSubscriptionVideos = async (channels) => {
    if (!channels || channels.length === 0) {
      setSubscriptionVideos([]);
      return;
    }

    try {
      let allVideos = [];
      
      // Fetch videos from each subscribed channel
      for (const channel of channels) {
        const response = await videoService.getAllVideos(
          1, // page
          5, // limit per channel to avoid too many videos
          '', // no search query
          'createdAt',
          'desc',
          channel._id // fetch videos by this user/channel
        );
        
        if (response.success !== false && response.data) {
          const transformedVideos = transformVideosArray(response.data);
          allVideos = [...allVideos, ...transformedVideos];
        }
      }
      
      // Sort all videos by creation date (newest first)
      allVideos.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
      
      // Limit to 15 most recent videos
      setSubscriptionVideos(allVideos.slice(0, 15));
    } catch (err) {
      console.error('Error fetching subscription videos:', err);
      setError('Failed to load subscription videos');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscriptions</h1>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      )}

      {/* Not Authenticated */}
      {!isAuthenticated && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sign in to see your subscriptions</h2>
          <p className="text-gray-600">You need to be logged in to view your subscribed channels and videos.</p>
        </div>
      )}

      {/* Show content when not loading and authenticated */}
      {!loading && isAuthenticated && (
        <>
          {/* Subscribed Channels */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscribed Channels</h2>
            {subscribedChannels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">You haven't subscribed to any channels yet.</p>
                <p className="text-gray-500 text-sm mt-2">Explore videos and subscribe to channels you like!</p>
              </div>
            ) : (
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {subscribedChannels.map((channel) => (
                  <div key={channel.id} className="flex flex-col items-center min-w-0 flex-shrink-0">
                    <div className="relative">
                      <img
                        src={channel.avatar || `https://picsum.photos/48/48?random=${channel.id}`}
                        alt={channel.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-red-500"
                      />
                      <button className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
                        {channel.isNotificationOn ? (
                          <Bell className="w-3 h-3 text-gray-600" />
                        ) : (
                          <BellOff className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-2 text-center max-w-20 truncate">
                      {channel.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {channel.subscribers === 1 ? '1 subscriber' : `${channel.subscribers} subscribers`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Videos from Subscriptions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Latest Videos</h2>
            {subscriptionVideos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No recent videos from your subscriptions.</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for new content!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptionVideos.map((video) => (
                  <VideoCard key={video.id} video={video} onVideoSelect={onVideoSelect} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Subscriptions
