import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import Header from "./components/HeaderNew"
import Sidebar from "./components/Sidebar"
import Home from "./pages/Home"
import VideoPlayer from "./pages/VideoPlayer"
import MyChannel from "./pages/MyChannel"
import Subscriptions from "./pages/Subscriptions"
import LikedVideos from "./pages/LikedVideos"
import Downloads from "./pages/Downloads"
import Tweets from "./pages/Tweets"
import TrendingVideos from "./pages/TrendingVideos"
import Settings from "./pages/Settings"
import Profile from "./pages/Profile"
import Search from "./components/Search"
import AuthPage from "./components/AuthPage"
import { AuthProvider, useAuth } from "./contexts/AuthContext"

function AppContent() {
  const { isLoggedIn, loading, user } = useAuth();
  const navigate = useNavigate();
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
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">PV</span>
          </div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!isLoggedIn) {
    return <AuthPage />;
  }

  // Main layout with sidebar and routing
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuClick={toggleSidebar}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        showSubscriptionMenu={showSubscriptionMenu}
        setShowSubscriptionMenu={setShowSubscriptionMenu}
      />

      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
          <Routes>
            <Route path="/" element={<Home onVideoSelect={handleVideoSelect} />} />
            <Route path="/search" element={<Search />} />
            <Route path="/trending" element={<TrendingVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/subscriptions" element={<Subscriptions onVideoSelect={handleVideoSelect} />} />
            <Route path="/tweets" element={<Tweets />} />
            <Route path="/liked-videos" element={<LikedVideos onVideoSelect={handleVideoSelect} />} />
            <Route path="/downloads" element={<Downloads onVideoSelect={handleVideoSelect} />} />
            <Route path="/profile/:userId" element={<Profile onVideoSelect={handleVideoSelect} />} />
            <Route path="/profile" element={<Profile onVideoSelect={handleVideoSelect} />} />
            <Route path="/video/:videoId" element={<VideoPlayer />} />
            <Route path="/settings" element={<Settings />} />
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
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
