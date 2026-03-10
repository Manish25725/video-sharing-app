import {
  Home,
  TrendingUp,
  Music,
  Film,
  Gamepad2,
  Newspaper,
  Trophy,
  Lightbulb,
  Shirt,
  History,
  Clock,
  ThumbsUp,
  Users,
  Settings,
  Shield,
  User,
  MessageSquare,
  List
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Users, label: "Subscriptions", path: "/subscriptions" },
    { icon: MessageSquare, label: "Tweets", path: "/tweets" },
    { icon: TrendingUp, label: "Trending", path: "/trending" },
    { icon: Music, label: "Music", path: "/music" },
    { icon: Film, label: "Movies", path: "/movies" },
    { icon: Gamepad2, label: "Gaming", path: "/gaming" },
    { icon: Newspaper, label: "News", path: "/news" },
    { icon: Trophy, label: "Sports", path: "/sports" },
    { icon: Lightbulb, label: "Learning", path: "/learning" },
    { icon: Shirt, label: "Fashion", path: "/fashion" },
  ]

  const libraryItems = [
    { icon: History, label: "History", path: "/watch-history" },
    { icon: Clock, label: "Watch later", path: "/watch-later" },
    { icon: ThumbsUp, label: "Liked videos", path: "/liked-videos" },
    { icon: List, label: "Playlists", path: "/playlists" },
  ]

  const adminItems = [
    { icon: Shield, label: "My Channel", path: "/admin" },
  ]

  return (
    <aside
      className={`fixed left-0 top-16 bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        isOpen ? "w-64" : "w-16"
      } overflow-y-auto`}
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 py-4">
          {/* Main Menu */}
          <div className="mb-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                  currentPath === item.path ? "bg-gray-100" : ""
                }`}
              >
                <item.icon className="w-6 h-6 text-gray-700" />
                {isOpen && <span className="ml-6 text-gray-900">{item.label}</span>}
              </Link>
            ))}
          </div>

          {isOpen && (
            <>
              <hr className="border-gray-200 mx-4 mb-4" />

              {/* My Channel Section - Show for all logged in users for now */}
              {user && (
                <>
                  <div className="mb-6">
                    <h3 className="px-4 mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">My Channel</h3>
                    {adminItems.map((item, index) => (
                      <Link
                        key={index}
                        to={item.path}
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                          currentPath === item.path ? "bg-gray-100" : ""
                        }`}
                      >
                        <item.icon className="w-6 h-6 text-gray-700" />
                        <span className="ml-6 text-gray-900">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                  <hr className="border-gray-200 mx-4 mb-4" />
                </>
              )}

              {/* Library */}
              <div className="mb-6">
                <h3 className="px-4 mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Library</h3>
                {libraryItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                      currentPath === item.path ? "bg-gray-100" : ""
                    }`}
                  >
                    <item.icon className="w-6 h-6 text-gray-700" />
                    <span className="ml-6 text-gray-900">{item.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer: Settings only */}
        <div className="border-t border-gray-200 bg-white">
          <Link
            to="/settings"
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
              currentPath === '/settings' ? 'bg-gray-100' : ''
            }`}
          >
            <Settings className="w-6 h-6 text-gray-700" />
            {isOpen && <span className="ml-6 text-gray-900">Settings</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
