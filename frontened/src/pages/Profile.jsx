import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { videoService, transformVideosArray } from "../services/videoService";
import { subscriptionService } from "../services/subscriptionService";
import { authService } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import VideoCard from "../components/VideoCard";

const Profile = ({ onVideoSelect }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
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
            // Fetch playlists (placeholder for now)
            setPlaylists([]);
            break;
            
          case "tweets":
            // Fetch tweets (placeholder for now)
            setTweets([]);
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
    <div className="p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        {/* Cover Image */}
        <div 
          className="h-48 w-full rounded-t-lg bg-gray-200 bg-cover bg-center"
          style={{ 
            backgroundImage: profileUser.coverImage 
              ? `url(${profileUser.coverImage})` 
              : "linear-gradient(to right, #4f46e5, #7c3aed)"
          }}
        />
        
        {/* Profile Info */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-end relative">
          {/* Avatar */}
          <div className="absolute md:relative -top-12 left-6 md:left-0 md:-top-16">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
              {profileUser.avatar ? (
                <img 
                  src={profileUser.avatar} 
                  alt={`${profileUser.fullName || profileUser.userName} avatar`}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-bold">
                  {(profileUser.fullName || profileUser.userName || "U").charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-12 md:mt-0 md:ml-6 flex-grow">
            <h1 className="text-2xl font-bold">
              {profileUser.fullName || profileUser.userName}
            </h1>
            <div className="text-gray-600 mb-2">@{profileUser.userName}</div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <strong>{subscriberCount}</strong> subscribers
              </span>
              <span className="text-sm text-gray-600">
                <strong>{videos.length}</strong> videos
              </span>
            </div>
          </div>
          
          {/* Action buttons */}
          {!isOwnProfile && isLoggedIn && (
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleSubscribe}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isSubscribed
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab("videos")}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === "videos"
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setActiveTab("playlists")}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === "playlists"
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveTab("tweets")}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === "tweets"
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tweets
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        ) : (
          <>
            {/* Videos Tab */}
            {activeTab === "videos" && (
              <>
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <VideoCard key={video.id} video={video} onVideoSelect={onVideoSelect} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No videos yet</h3>
                    {isOwnProfile && (
                      <p className="text-gray-600">
                        Upload your first video to get started!
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Playlists Tab */}
            {activeTab === "playlists" && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Playlists feature coming soon</h3>
                <p className="text-gray-600">
                  We're working on bringing playlists to the platform. Stay tuned!
                </p>
              </div>
            )}

            {/* Tweets Tab */}
            {activeTab === "tweets" && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Tweets feature coming soon</h3>
                <p className="text-gray-600">
                  We're working on bringing tweets to the platform. Stay tuned!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
