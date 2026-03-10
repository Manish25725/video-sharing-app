import { Search, Menu, Video, Bell, User, Users, Globe, HelpCircle, MessageSquare, LogOut, UserPlus, RotateCcw, X, ChevronLeft, ChevronRight, Check, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import VoiceSearch from "./VoiceSearch";

const Header = ({ 
  onMenuClick, 
  showProfileMenu, 
  setShowProfileMenu,
  showSubscriptionMenu,
  setShowSubscriptionMenu 
}) => {
  const { user, logout, savedAccounts, switchAccount, addAccount, removeAccount } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Language panel state
  const [showLanguagePanel, setShowLanguagePanel] = useState(false);
  
  // Switch account panel state
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [addAccountIdentifier, setAddAccountIdentifier] = useState("");
  const [addAccountPassword, setAddAccountPassword] = useState("");
  const [addAccountError, setAddAccountError] = useState("");
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [switchingId, setSwitchingId] = useState(null);

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setAddAccountError("");
    setAddAccountLoading(true);
    try {
      const result = await addAccount(addAccountIdentifier, addAccountPassword);
      if (result?.success) {
        setAddAccountIdentifier("");
        setAddAccountPassword("");
        setShowAddAccountForm(false);
      } else {
        setAddAccountError(result?.error || "Failed to add account");
      }
    } catch (err) {
      setAddAccountError(err.message || "Failed to add account");
    } finally {
      setAddAccountLoading(false);
    }
  };

  const handleSwitchAccount = async (targetUserId) => {
    setSwitchError("");
    setSwitchingId(targetUserId);
    try {
      const result = await switchAccount(targetUserId);
      if (result?.success) {
        setShowSwitchPanel(false);
        setShowProfileMenu(false);
        // Full reload handled inside switchAccount via window.location.href
      } else {
        setSwitchError(result?.error || "Failed to switch account");
      }
    } catch (err) {
      setSwitchError(err.message || "Failed to switch account");
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemoveAccount = async (accountId, e) => {
    e.stopPropagation();
    await removeAccount(accountId);
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(location.search).get('q') || ''
  );
  const profileMenuRef = useRef(null);
  const subscriptionMenuRef = useRef(null);

  // Keep input in sync with URL (clears when navigating away from /search)
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

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

  const handleVoiceResult = (text) => {
    setSearchQuery(text);
    navigate(`/search?q=${encodeURIComponent(text)}`);
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
        setShowSwitchPanel(false);
        setShowAddAccountForm(false);
        setShowLanguagePanel(false);
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
        <div className="flex-1 max-w-2xl mx-6">
          <div className="flex items-center h-10 rounded-full shadow-sm ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-200 bg-white overflow-visible">
            {/* Text input */}
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 h-full pl-5 pr-2 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
            {/* Voice search */}
            <div className="px-2 flex-shrink-0">
              <VoiceSearch onResult={handleVoiceResult} />
            </div>
            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
            {/* Search submit */}
            <button
              onClick={handleSearch}
              className="h-full px-4 flex items-center justify-center rounded-r-full hover:bg-gray-50 transition-colors focus:outline-none"
              title="Search"
            >
              <Search className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {user && (
            <Link to="/go-live" title="Go Live"
              className="p-2 hover:bg-red-50 rounded-full transition-colors group">
              <Video className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors" />
            </Link>
          )}
          
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

          <NotificationBell />
          
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
                  <div 
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{t('yourChannel')}</span>
                  </div>
                  <div
                    onClick={() => { setShowSwitchPanel(true); setSwitchError(""); setShowAddAccountForm(false); }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <RotateCcw className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{t('switchAccount')}</span>
                    </div>
                    {savedAccounts.filter(a => a._id !== user?._id).length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                        {savedAccounts.filter(a => a._id !== user?._id).length}
                      </span>
                    )}
                  </div>

                  {/* Switch Account Panel (inline inside dropdown) */}
                  {showSwitchPanel && (
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="px-4 py-2 flex items-center space-x-2">
                        <button
                          onClick={() => { setShowSwitchPanel(false); setShowAddAccountForm(false); }}
                          className="p-1 hover:bg-gray-200 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-700">{t('switchAccount')}</span>
                      </div>

                      {switchError && (
                        <p className="px-4 pb-2 text-xs text-red-600">{switchError}</p>
                      )}

                      {/* Saved accounts list */}
                      <div className="max-h-48 overflow-y-auto">
                        {savedAccounts.filter(a => a._id !== user?._id).length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-500">No other saved accounts</p>
                        ) : (
                          savedAccounts
                            .filter(a => a._id !== user?._id)
                            .map(account => (
                              <div
                                key={account._id}
                                className="flex items-center px-4 py-2 hover:bg-gray-100 group"
                              >
                                <button
                                  onClick={() => handleSwitchAccount(account._id)}
                                  disabled={switchingId === account._id}
                                  className="flex items-center space-x-3 flex-1 text-left disabled:opacity-60"
                                >
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex-shrink-0">
                                    {account.avatar ? (
                                      <img src={account.avatar} alt={account.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                        {(account.fullName || account.userName || 'U')[0].toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{account.fullName}</p>
                                    <p className="text-xs text-gray-500 truncate">@{account.userName}</p>
                                  </div>
                                  {switchingId === account._id && (
                                    <span className="ml-2 text-xs text-blue-600">Switching...</span>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleRemoveAccount(account._id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity ml-2"
                                  title="Remove account"
                                >
                                  <X className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            ))
                        )}
                      </div>

                      {/* Add account */}
                      {!showAddAccountForm ? (
                        <button
                          onClick={() => { setShowAddAccountForm(true); setAddAccountError(""); }}
                          className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center space-x-2 border-t border-gray-200"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>{t('addAccount')}</span>
                        </button>
                      ) : (
                        <form onSubmit={handleAddAccountSubmit} className="px-4 py-3 border-t border-gray-200 space-y-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Sign in to another account</p>
                          {addAccountError && <p className="text-xs text-red-600">{addAccountError}</p>}
                          <input
                            type="text"
                            placeholder="Email or username"
                            value={addAccountIdentifier}
                            onChange={e => setAddAccountIdentifier(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={addAccountPassword}
                            onChange={e => setAddAccountPassword(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              disabled={addAccountLoading}
                              className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                            >
                              {addAccountLoading ? 'Adding...' : 'Add'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddAccountForm(false); setAddAccountError(""); }}
                              className="flex-1 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                  <div
                    onClick={() => {
                      navigate('/profile-settings');
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">Account Settings</span>
                  </div>
                  <div 
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{t('signOut')}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 py-2">
                  {/* Language selector */}
                  {!showLanguagePanel ? (
                    <div
                      onClick={() => setShowLanguagePanel(true)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">{t('language')}:</p>
                          <p className="text-sm text-gray-900">
                            {language === 'hi' ? t('hindi') : t('english')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="bg-gray-50">
                      <div className="px-4 py-2 flex items-center space-x-2 border-b border-gray-100">
                        <button
                          onClick={() => setShowLanguagePanel(false)}
                          className="p-1 hover:bg-gray-200 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-700">{t('language')}</span>
                      </div>
                      <div
                        onClick={() => { setLanguage('en'); setShowLanguagePanel(false); }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-900">English</span>
                        {language === 'en' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div
                        onClick={() => { setLanguage('hi'); setShowLanguagePanel(false); }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-900">हिंदी</span>
                        {language === 'hi' && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>
                  )}
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-600 mb-1">{t('location')}:</p>
                    <span className="text-sm text-gray-900">India</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 py-2">
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{t('help')}</span>
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{t('sendFeedback')}</span>
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
