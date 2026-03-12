import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import AdminDashboard from "./pages/AdminDashboard"
import AdminLogin from "./pages/AdminLogin"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import UploadAvatar from "./pages/UploadAvatar"
import UploadCover from "./pages/UploadCover"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import VerifyEmail from "./pages/VerifyEmail"
import VerifySignupEmail from "./pages/VerifySignupEmail"
import ProfileSettings from "./pages/ProfileSettings"
import LiveStreams from "./pages/LiveStreams"
import LiveStream from "./pages/LiveStream"
import GoLive from "./pages/GoLive"
import ScheduledStreams from "./pages/ScheduledStreams"
import Header from "./components/HeaderNew"
import Sidebar from "./components/Sidebar"
import AppLoader from "./components/AppLoader"
import Home from "./pages/Home"
import VideoPlayer from "./pages/VideoPlayer"
import MyChannel from "./pages/MyChannel"
import Subscriptions from "./pages/Subscriptions"
import LikedVideos from "./pages/LikedVideos"
import WatchLater from "./pages/WatchLater"
import WatchHistory from "./pages/WatchHistory"
import Playlists from "./pages/Playlists"
import PlaylistDetail from "./pages/PlaylistDetail"
import Tweets from "./pages/Tweets"
import TrendingVideos from "./pages/TrendingVideos"
import CategoryVideos from "./pages/CategoryVideos"
import Settings from "./pages/Settings"
import Profile from "./pages/Profile"
import Help from "./pages/Help"
import Feedback from "./pages/Feedback"
import Search from "./components/Search"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { LanguageProvider } from "./contexts/LanguageContext"
import { SignupProvider } from "./contexts/SignupContext"

function AppContent() {
  const { isLoggedIn, loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSubscriptionMenu, setShowSubscriptionMenu] = useState(false);

  const handleVideoSelect = (videoId) => {
    // Navigate to the video player page
    navigate(`/video/${videoId}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading screen
  if (loading) return <AppLoader />;

  // Admin login page — accessible without any login
  if (location.pathname === "/admin-login") {
    return (
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
      </Routes>
    );
  }

  // Not logged in — show auth + signup flow
  if (!isLoggedIn) {
    return (
      <SignupProvider>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/upload-avatar" element={<UploadAvatar />} />
          <Route path="/upload-cover" element={<UploadCover />} />
          <Route path="/verify-signup-email" element={<VerifySignupEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </SignupProvider>
    );
  }

  // Admin dashboard — requires admin auth
  if (location.pathname.startsWith("/admin-dashboard")) {
    return (
      <Routes>
        <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} />
        <Route path="/admin-dashboard/*" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} />
      </Routes>
    );
  }

  // Main layout with sidebar and routing
  return (
    <div className="flex flex-col h-screen bg-[#120a06]">
      <Header
        onMenuClick={toggleSidebar}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        showSubscriptionMenu={showSubscriptionMenu}
        setShowSubscriptionMenu={setShowSubscriptionMenu}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home onVideoSelect={handleVideoSelect} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/trending" element={<TrendingVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/subscriptions" element={<Subscriptions onVideoSelect={handleVideoSelect} />} />
            <Route path="/tweets" element={<Tweets />} />
            
            {/* Category Routes */}
            <Route path="/music" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/movies" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/gaming" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/news" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/sports" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/learning" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/fashion" element={<CategoryVideos onVideoSelect={handleVideoSelect} />} />
            
            <Route path="/liked-videos" element={<LikedVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/watch-later" element={<WatchLater />} />
            <Route path="/watch-history" element={<WatchHistory />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/playlist/:playlistId" element={<PlaylistDetail onVideoSelect={handleVideoSelect} />} />
            <Route path="/profile/:userId" element={<Profile onVideoSelect={handleVideoSelect} />} />
            <Route path="/profile" element={<Profile onVideoSelect={handleVideoSelect} />} />
            <Route path="/video/:videoId" element={<VideoPlayer />} />
            <Route path="/live" element={<LiveStreams />} />
            <Route path="/live/:streamKey" element={<LiveStream />} />
            <Route path="/go-live" element={user ? <GoLive /> : <Navigate to="/" />} />
            <Route path="/scheduled-streams" element={<ScheduledStreams />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/help" element={<Help />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin" element={user ? <MyChannel /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Main App component with AuthProvider and routing
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
