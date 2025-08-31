import { Search, Menu, Video, Bell, User, Users, Globe, HelpCircle, MessageSquare, LogOut, UserPlus, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Header = ({ 
  onMenuClick, 
  showProfileMenu, 
  setShowProfileMenu,
  showSubscriptionMenu,
  setShowSubscriptionMenu 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const profileMenuRef = useRef(null);
  const subscriptionMenuRef = useRef(null);

  // Search handler functions
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const [subscribers] = useState([
    { id: 1, name: "Tech Review Channel", avatar: "TR", subscribers: "1.2M" },
    { id: 2, name: "Coding Tutorials Pro", avatar: "CT", subscribers: "856K" },
    { id: 3, name: "Design Academy", avatar: "DA", subscribers: "423K" },
    { id: 4, name: "Music Producer Hub", avatar: "MP", subscribers: "2.1M" },
    { id: 5, name: "Travel Vlogs", avatar: "TV", subscribers: "634K" },
    { id: 6, name: "Cooking Master", avatar: "CM", subscribers: "987K" },
  ]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (subscriptionMenuRef.current && !subscriptionMenuRef.current.contains(event.target)) {
        setShowSubscriptionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowProfileMenu, setShowSubscriptionMenu]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white font-bold">
              PV
            </div>
            <span className="text-xl font-bold text-gray-900">PlayVibe</span>
          </Link>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative flex">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleSearch}
              className="px-6 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-100 focus:outline-none"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-6 h-6 text-gray-700" />
          </button>
          
          {/* Subscriptions Button */}
          <div className="relative">
            <button 
              onClick={() => setShowSubscriptionMenu(!showSubscriptionMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Users className="w-6 h-6 text-gray-700" />
            </button>
            
            {/* Subscription Menu */}
            {showSubscriptionMenu && (
              <div 
                ref={subscriptionMenuRef}
                className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Subscriptions</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div 
                      key={subscriber.id} 
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer group"
                      onClick={() => {
                        navigate('/'); // Redirect to home page
                        setShowSubscriptionMenu(false);
                      }}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {subscriber.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{subscriber.name}</p>
                        <p className="text-sm text-gray-500">{subscriber.subscribers} subscribers</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Bell className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="w-6 h-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>
          
          {/* Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div 
                ref={profileMenuRef}
                className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.fullName || 'User'}</p>
                      <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                    <UserPlus className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Create a channel</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                    <RotateCcw className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Switch account</span>
                  </div>
                  <div 
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Sign out</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 py-2">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">Language:</p>
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">British English</span>
                    </div>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">Location:</p>
                    <span className="text-sm text-gray-900">India</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 py-2">
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Help</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Send feedback</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
