import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { videoService, transformVideosArray } from "../services/videoService";
import { subscriptionService } from "../services/subscriptionService";
import { authService } from "../services/authService";
import { playlistService } from "../services/playlistService";
import { tweetService, transformTweetsArray } from "../services/tweetService";
import { useAuth } from "../contexts/AuthContext";
import VideoCard from "../components/VideoCard";
import TweetCard from "../components/TweetCard";
import { Play, Folder, MessageSquare, ListVideo, Users, Lock, Search, X } from "lucide-react";

// Component to display playlist thumbnail using first video
const PlaylistThumbnail = ({ playlist }) => {
  const firstVideo = playlist.videos && playlist.videos.length > 0 ? playlist.videos[0] : null;
  const thumbnailUrl = firstVideo && firstVideo.thumbnail ? firstVideo.thumbnail : null;

  return (
    <div className="relative w-full h-full">
      {thumbnailUrl ? (
        <>
          <img
            src={thumbnailUrl}
            alt="Playlist thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-60 rounded-full p-3">
              <Play className="w-6 h-6 text-white" fill="white" />
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Folder className="w-12 h-12 text-purple-400" />
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
        {playlist.videos?.length || 0} videos
      </div>
    </div>
  );
};

const SubscriptionsWithSearch = ({ subscriptions, isOwnProfile, navigate }) => {
  const [query, setQuery] = useState("");

  const filtered = subscriptions.filter(ch => {
    const q = query.toLowerCase();
    return (
      (ch.fullName || "").toLowerCase().includes(q) ||
      (ch.userName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search subscriptions..."
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(channel => (
            <div
              key={channel._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/profile/${channel._id}`)}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                {channel.avatar
                  ? <img src={channel.avatar} alt={channel.fullName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                      {(channel.fullName || channel.userName || "U").charAt(0)}
                    </div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{channel.fullName || channel.userName}</p>
                <p className="text-sm text-gray-500">@{channel.userName}</p>
                {channel.subscribersCount !== undefined && (
                  <p className="text-xs text-gray-400 mt-0.5">{channel.subscribersCount.toLocaleString()} subscribers</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">No subscriptions yet</h3>
          <p className="text-gray-500 text-sm">
            {isOwnProfile ? "You haven't subscribed to any channels yet." : "This user hasn't subscribed to any channels."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">No results for "{query}"</h3>
          <p className="text-gray-500 text-sm">Try a different name or username.</p>
        </div>
      )}
    </div>
  );
};

const Profile = ({ onVideoSelect }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [creatorPlaylists, setCreatorPlaylists] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const isOwnProfile = user && profileUser && user._id === profileUser._id;

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user profile data - use URL param if available, otherwise use logged in user
        const profileId = userId || (user && user._id);
        
        if (!profileId) {
          setError("No profile ID provided");
          setLoading(false);
          return;
        }
        
        console.log("Fetching profile for ID:", profileId);
        const userResponse = await authService.getUserProfile(profileId);
        
        if (userResponse.success && userResponse.data) {
          setProfileUser(userResponse.data);
          
          // Check if current user is subscribed to this profile
          if (isLoggedIn && user && userResponse.data && user._id !== userResponse.data._id) {
            const subResponse = await subscriptionService.getSubscribedChannels(user._id);
            if (subResponse.success) {
              const isSubbed = subResponse.data.some(
                channel => channel._id === userResponse.data._id
              );
              setIsSubscribed(isSubbed);
            }
          }
          
          // Get subscriber count
          const profileUserId = userResponse.data._id;
          if (profileUserId) {
            const subscribersResponse = await subscriptionService.getChannelSubscribers(profileUserId);
            if (subscribersResponse.success) {
              setSubscriberCount(subscribersResponse.data.length);
            }
          }
        } else {
          console.error("Failed to load user profile:", userResponse.message);
          setError(userResponse.message || "Failed to load user profile");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, user, isLoggedIn]);

  // Fetch tab content based on active tab
  useEffect(() => {
    const fetchTabContent = async () => {
      if (!profileUser) return;
      
      setLoading(true);
      
      try {
        switch (activeTab) {
          case "videos":
            const videosResponse = await videoService.getAllVideos(1, 20, "", "createdAt", "desc", profileUser._id);
            if (videosResponse.success) {
              setVideos(transformVideosArray(videosResponse.data));
            }
            break;
            
          case "playlists":
            // Fetch only creator playlists created by this user
            try {
              const creatorResponse = await playlistService.getCreatorPlaylists(profileUser._id);
              
              if (creatorResponse.success) {
                setCreatorPlaylists(creatorResponse.data || []);
              } else {
                setCreatorPlaylists([]);
              }
            } catch (err) {
              console.error("Error fetching creator playlists:", err);
              setCreatorPlaylists([]);
            }
            break;
            
          case "tweets":
            try {
              const tweetsResponse = await tweetService.getTweetsByUser(profileUser._id);
              if (tweetsResponse.success) {
                setTweets(transformTweetsArray(tweetsResponse.data || []));
              } else {
                setTweets([]);
              }
            } catch (err) {
              console.error('Error fetching tweets:', err);
              setTweets([]);
            }
            break;

          case "subscriptions":
            try {
              const subRes = await subscriptionService.getSubscribedChannels(profileUser._id);
              setSubscriptions(subRes.success ? (subRes.data || []) : []);
            } catch {
              setSubscriptions([]);
            }
            break;

          case "savedPlaylists":
            try {
              const spRes = await playlistService.getUserPlaylists(profileUser._id);
              setSavedPlaylists(spRes.success ? (spRes.data || []) : []);
            } catch {
              setSavedPlaylists([]);
            }
            break;
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchTabContent();
  }, [activeTab, profileUser]);

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      // Redirect to login or show login modal
      return;
    }

    try {
      const response = await subscriptionService.toggleSubscription(profileUser._id);
      if (response.success) {
        setIsSubscribed(!isSubscribed);
        setSubscriberCount(prev => isSubscribed ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error("Error toggling subscription:", err);
    }
  };

  if (loading && !profileUser) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error || "User profile not found"}
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f0909' }}>
      {/* Channel Hero Banner */}
      <section className="relative">
        <div 
          className="h-64 md:h-80 w-full bg-cover bg-center relative"
          style={{
            backgroundImage: profileUser.coverImage 
              ? `url('${profileUser.coverImage}')` 
              : 'linear-gradient(135deg, #1a120f 0%, #2a1b15 100%)',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15, 9, 9, 1), rgba(15, 9, 9, 0.2), transparent)' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
            {/* Profile Avatar */}
            <div 
              className="size-32 md:size-44 rounded-full border-4 overflow-hidden shadow-2xl bg-card-dark flex-shrink-0"
              style={{ borderColor: '#0f0909', background: '#1a120f' }}
            >
              {profileUser.avatar ? (
                <img 
                  src={profileUser.avatar} 
                  alt={profileUser?.fullName || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-900 flex items-center justify-center">
                  <Users className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {/* Channel Info */}
            <div className="flex-1 pt-4 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                  {profileUser?.fullName || 'Channel'}
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3" style={{ color: '#94a3b8' }}>
                <span className="font-medium text-sm">@{profileUser?.userName || 'creator'}</span>
                <span className="size-1 rounded-full" style={{ background: '#64748b' }}></span>
                <span className="font-medium text-sm">{subscriberCount.toLocaleString()} Subscribers</span>
                <span className="size-1 rounded-full" style={{ background: '#64748b' }}></span>
                <span className="font-medium text-sm">{videos.length} Videos</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pb-2 w-full md:w-auto justify-center md:justify-start">
              {!isOwnProfile && isLoggedIn && (
                <button 
                  onClick={handleSubscribe}
                  className="px-6 py-2.5 rounded-xl font-bold border transition-all flex-1 md:flex-none"
                  style={{ 
                    background: isSubscribed ? '#1a120f' : '#ec5b13',
                    color: isSubscribed ? '#f1f5f9' : '#fff',
                    border: isSubscribed ? '1px solid rgba(236,91,19,0.2)' : 'none',
                    boxShadow: !isSubscribed ? '0 4px 20px rgba(236,91,19,0.35)' : 'none',
                  }}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Creator Tools Tabs */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-8 w-full">
        <div className="flex border-b" style={{ borderColor: 'rgba(236,91,19,0.1)' }}>
          {[
            { id: "videos", label: "Videos" },
            { id: "playlists", label: "Playlists" },
            { id: "tweets", label: "Community" },
            ...(isOwnProfile || profileUser?.privacy?.subscriptionListPublic
              ? [{ id: "subscriptions", label: "Subscriptions" }]
              : []),
            ...(isOwnProfile || profileUser?.privacy?.savedPlaylistsPublic
              ? [{ id: "savedPlaylists", label: "Saved Playlists" }]
              : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-4 px-4 font-bold whitespace-nowrap transition-all relative"
              style={{
                color: activeTab === tab.id ? '#ec5b13' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #ec5b13' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="py-6">
          {/* Tab Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-lg" style={{ color: '#94a3b8' }}>Loading...</div>
            </div>
          ) : (
            <>
              {/* Videos Tab */}
              {activeTab === "videos" && (
                <>
                  {videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                      <style>{`
                        .profile-video-card {
                          background: rgba(45, 30, 22, 0.6) !important;
                          border-radius: 0.75rem;
                          overflow: hidden;
                          border: 1px solid rgba(236, 91, 19, 0.1);
                        }
                        .profile-video-card .bg-white {
                          background: transparent !important;
                        }
                        .profile-video-card h3 {
                          color: #f1f5f9 !important;
                        }
                        .profile-video-card h3:hover {
                          color: #ec5b13 !important;
                        }
                        .profile-video-card p {
                          color: #94a3b8 !important;
                        }
                        .profile-video-card .text-gray-500,
                        .profile-video-card .text-gray-600 {
                          color: #64748b !important;
                        }
                        .profile-video-card button:hover {
                          background: rgba(236, 91, 19, 0.2) !important;
                        }
                        .profile-video-card .bg-gray-100,
                        .profile-video-card .hover\\:bg-gray-100:hover {
                          background: rgba(236, 91, 19, 0.1) !important;
                        }
                      `}</style>
                      {videos.map((video) => (
                        <div key={video.id} className="profile-video-card">
                          <VideoCard
                            video={video.owner ? video : { ...video, owner: profileUser }}
                            onVideoSelect={onVideoSelect}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(45,30,22,0.4)' }}>
                      <h3 className="text-lg font-medium text-white mb-2">No videos yet</h3>
                      {!isOwnProfile && (
                        <p style={{ color: '#94a3b8' }}>This creator hasn't uploaded any videos yet.</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Playlists Tab */}
              {activeTab === "playlists" && (
                <div>
                  {creatorPlaylists.length > 0 ? (
                    <>
                      <style>{`
                        .profile-playlist-card {
                          background: rgba(45, 30, 22, 0.6) !important;
                          border-radius: 0.75rem;
                          overflow: hidden;
                          border: 1px solid rgba(236, 91, 19, 0.1);
                        }
                        .profile-playlist-card h4 {
                          color: #f1f5f9 !important;
                        }
                        .profile-playlist-card p {
                          color: #94a3b8 !important;
                        }
                      `}</style>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {creatorPlaylists.map((playlist) => (
                          <div 
                            key={playlist._id}
                            className="profile-playlist-card cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/playlist/${playlist._id}`)}
                          >
                            <div className="aspect-video bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center overflow-hidden">
                              <PlaylistThumbnail playlist={playlist} />
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-white truncate">{playlist.name}</h4>
                              {playlist.description && (
                                <p className="text-sm mt-1 line-clamp-2">{playlist.description}</p>
                              )}
                              <div className="flex items-center mt-2 text-xs" style={{ color: '#64748b' }}>
                                <Folder className="w-3 h-3 mr-1" />
                                Playlist • {playlist.videos?.length || 0} videos
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(45,30,22,0.4)' }}>
                      <Folder className="w-12 h-12 mx-auto mb-4" style={{ color: '#64748b' }} />
                      <h3 className="text-lg font-medium text-white mb-2">No playlists yet</h3>
                      <p style={{ color: '#94a3b8' }}>
                        {isOwnProfile 
                          ? "Create your first playlist to organize your videos!" 
                          : "This creator hasn't created any playlists."
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tweets Tab */}
              {activeTab === "tweets" && (
                <div>
                  {tweets.length > 0 ? (
                    <div className="max-w-2xl mx-auto space-y-4">
                      {tweets.map(tweet => (
                        <TweetCard
                          key={tweet.id}
                          tweet={tweet}
                          currentUser={user}
                          onDeleted={(id) => setTweets(prev => prev.filter(t => t.id !== id))}
                          onUpdated={(updated) => setTweets(prev => prev.map(t => t.id === updated.id ? updated : t))}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(45,30,22,0.4)' }}>
                      <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: '#64748b' }} />
                      <h3 className="text-lg font-medium text-white mb-1">No tweets yet</h3>
                      <p style={{ color: '#94a3b8' }}>
                        {isOwnProfile
                          ? "Post your first tweet!"
                          : "This creator hasn't posted any tweets yet."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subscriptions Tab */}
              {activeTab === "subscriptions" && (
                <div>
                  {!isOwnProfile && !profileUser?.privacy?.subscriptionListPublic ? (
                    <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(45,30,22,0.4)' }}>
                      <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: '#64748b' }} />
                      <h3 className="text-lg font-medium text-white mb-1">Private</h3>
                      <p style={{ color: '#94a3b8' }}>This creator's subscription list is private.</p>
                    </div>
                  ) : (
                    <SubscriptionsWithSearch
                      subscriptions={subscriptions}
                      isOwnProfile={isOwnProfile}
                      navigate={navigate}
                    />
                  )}
                </div>
              )}

              {/* Saved Playlists Tab */}
              {activeTab === "savedPlaylists" && (
                <div>
                  {!isOwnProfile && !profileUser?.privacy?.savedPlaylistsPublic ? (
                    <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(45,30,22,0.4)' }}>
                      <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: '#64748b' }} />
                      <h3 className="text-lg font-medium text-white mb-1">Private</h3>
                      <p style={{ color: '#94a3b8' }}>This creator's saved playlists are private.</p>
                    </div>
                  ) : savedPlaylists.length > 0 ? (
                    <>
                      <style>{`
                        .profile-saved-playlist {
                          background: rgba(45, 30, 22, 0.6) !important;
                          border-radius: 0.75rem;
                          overflow: hidden;
                          border: 1px solid rgba(236, 91, 19, 0.1);
                        }
                        .profile-saved-playlist h4 {
                          color: #f1f5f9 !important;
                        }
                        .profile-saved-playlist p {
                          color: #94a3b8 !important;
                        }
                      `}</style>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedPlaylists.map(playlist => (
                          <div
                            key={playlist._id}
                            className="profile-saved-playlist cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/playlist/${playlist._id}`)}
                          >
                            <div className="aspect-video bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
                              <PlaylistThumbnail playlist={playlist} />
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-white truncate">{playlist.name}</h4>
                              {playlist.description && (
                                <p className="text-sm mt-1 line-clamp-2">{playlist.description}</p>
                              )}
                              <div className="flex items-center mt-2 text-xs gap-1" style={{ color: '#64748b' }}>
                                <ListVideo className="w-3 h-3" />
                                {playlist.videos?.length || 0} videos
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg p-8 text-center" style={{ background: 'rgba(45,30,22,0.4)' }}>
                      <ListVideo className="w-12 h-12 mx-auto mb-3" style={{ color: '#64748b' }} />
                      <h3 className="text-lg font-medium text-white mb-1">No saved playlists</h3>
                      <p style={{ color: '#94a3b8' }}>
                        {isOwnProfile ? "You haven't saved any playlists yet." : "This creator hasn't saved any playlists."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
