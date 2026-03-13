import { Search, Video, Bell, User, Users, Globe, HelpCircle, MessageSquare, LogOut, UserPlus, RotateCcw, X, ChevronLeft, ChevronRight, Check, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import VoiceSearch from "./VoiceSearch";
import { subscriptionService } from "../services/subscriptionService.js";

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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

  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Fetch real subscribed channels when menu opens
  useEffect(() => {
    if (!showSubscriptionMenu || !user) return;
    setSubsLoading(true);
    subscriptionService.getSubscribedChannels(user._id)
      .then((res) => {
        if (res?.data) {
          setSubscribedChannels(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setSubsLoading(false));
  }, [showSubscriptionMenu, user]);

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
    <header
      className="w-full flex-shrink-0 z-40"
      style={{
        background: "rgba(12,6,2,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(236,91,19,0.1)",
        boxShadow: "0 2px 32px rgba(0,0,0,0.5)",
      }}
    >
      {mobileSearchOpen ? (
        <div className="flex items-center px-4 h-16 w-full gap-3 md:hidden">
          <button onClick={() => setMobileSearchOpen(false)} className="text-slate-400 p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center h-10 rounded-full px-4" style={{background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)"}}>
            <input 
              type="text" 
              autoFocus 
              className="flex-1 bg-transparent text-white outline-none text-sm placeholder-slate-400" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              onKeyDown={handleSearchKeyDown} 
            />
            <button onClick={() => { handleSearch(); setMobileSearchOpen(false); }}>
              <Search className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center px-4 h-16 w-full">
        {/* ── Left: hamburger + logo ── */}
        <div className="flex items-center flex-shrink-0 gap-2">
          <button
            onClick={onMenuClick}
            title="Toggle sidebar"
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,91,19,0.14)"; e.currentTarget.style.color = "#ec5b13"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="2" rx="1" fill="currentColor"/>
              <rect y="6" width="14" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="20" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <div
              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg,#ec5b13 0%,#8b5cf6 100%)", boxShadow: "0 4px 12px rgba(236,91,19,0.35)" }}
            >
              <svg className="w-4 h-4" fill="white" viewBox="0 0 48 48"><path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"/></svg>
            </div>
            <span
              className="text-[17px] font-extrabold tracking-tight whitespace-nowrap hidden sm:block"
              style={{ background: "linear-gradient(90deg,#fff 40%,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              PlayVibe
            </span>
          </Link>
        </div>

        {/* ── Center: Search ── */}
        <div className="flex-1 min-w-0 hidden md:flex justify-center px-4">
          <div className="flex items-center w-full max-w-2xl h-11 rounded-full overflow-hidden transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
            onFocusCapture={e => {
              e.currentTarget.style.borderColor = "rgba(236,91,19,0.6)";
              e.currentTarget.style.background = "rgba(30,15,5,0.8)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(236,91,19,0.1)";
            }}
            onBlurCapture={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Input */}
            <input
              type="text"
              placeholder="Search videos, channels, playlists…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 min-w-0 h-full pl-5 pr-3 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
            />
            {/* Voice search */}
            <div className="flex-shrink-0 h-full w-11 flex items-center justify-center border-l"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <VoiceSearch onResult={handleVoiceResult} compact />
            </div>
            {/* Search button — orange pill */}
            <button
              onClick={handleSearch}
              title="Search"
              className="h-full px-5 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 focus:outline-none flex-shrink-0 rounded-r-full"
              style={{ background: "rgba(236,91,19,0.18)", color: "#ec5b13", borderLeft: "1px solid rgba(236,91,19,0.2)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#ec5b13"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(236,91,19,0.18)"; e.currentTarget.style.color = "#ec5b13"; }}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {/* ── Right: actions ── */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          
          {/* Mobile search icon */}
          <Link
            to="/search"
            title="Search"
            className="w-9 h-9 md:hidden flex items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,91,19,0.14)"; e.currentTarget.style.color = "#ec5b13"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
          >
            <Search className="w-5 h-5" />
          </Link>

          {user && (
            <Link
              to="/go-live"
              title="Go Live"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ color: "#64748b" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            >
              <Video className="w-5 h-5" />
            </Link>
          )}
          
          {/* Subscriptions */}
          <div className="relative">
            <button
              onClick={() => setShowSubscriptionMenu(!showSubscriptionMenu)}
              title="Subscriptions"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{ color: "#64748b" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,91,19,0.14)"; e.currentTarget.style.color = "#ec5b13"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            >
              <Users className="w-5 h-5" />
            </button>
            
            {/* Subscription Menu */}
            {showSubscriptionMenu && (
              <div 
                ref={subscriptionMenuRef}
                className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 border"
                style={{
                  background: "rgba(28,18,13,0.95)",
                  backdropFilter: "blur(12px)",
                  borderColor: "rgba(236,91,19,0.15)",
                }}
              >
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="font-semibold text-slate-100">Subscriptions</h3>
                  <Link to="/subscriptions" onClick={() => setShowSubscriptionMenu(false)}
                    className="text-xs font-medium" style={{ color: "#ec5b13" }}>
                    See all
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {subsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="w-5 h-5 border-2 border-slate-700 border-t-[#ec5b13] rounded-full animate-spin" />
                    </div>
                  ) : !user ? (
                    <p className="p-4 text-sm text-slate-500">Sign in to see your subscriptions.</p>
                  ) : subscribedChannels.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">You haven&apos;t subscribed to any channels yet.</p>
                  ) : (
                    subscribedChannels.map((channel) => (
                      <div
                        key={channel._id}
                        className="flex items-center p-3 cursor-pointer gap-3 transition-colors"
                        style={{ color: "#94a3b8" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => {
                          navigate(`/profile/${channel._id}`);
                          setShowSubscriptionMenu(false);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                          style={{ background: "linear-gradient(135deg, #ec5b13, #8b5cf6)" }}>
                          {channel.avatar ? (
                            <img src={channel.avatar} alt={channel.fullName || channel.userName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                              {(channel.fullName || channel.userName || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-100 truncate">{channel.fullName || channel.userName}</p>
                          <p className="text-xs text-slate-500">@{channel.userName} &middot; {channel.subscribersCount ?? 0} subscribers</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <NotificationBell />
          
          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full transition-all duration-200 overflow-hidden ring-2 ring-offset-2 focus:outline-none"
              style={{ ringOffsetColor: "transparent", ringColor: "rgba(236,91,19,0.4)", boxShadow: "0 0 0 2px rgba(236,91,19,0.35)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 2px #ec5b13")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(236,91,19,0.35)")}
            >
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #ec5b13, #8b5cf6)" }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div 
                ref={profileMenuRef}
                className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl z-50 border"
                style={{
                  background: "rgba(28,18,13,0.95)",
                  backdropFilter: "blur(12px)",
                  borderColor: "rgba(236,91,19,0.15)",
                }}
              >
                {/* User Info Section */}
                <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #ec5b13, #8b5cf6)" }}>
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{user?.fullName || 'User'}</p>
                      <p className="text-sm text-slate-500">{user?.email || 'user@example.com'}</p>
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
                    className="px-4 py-2 cursor-pointer flex items-center space-x-3 transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-slate-200">Your Channel</span>
                  </div>
                  <div
                    onClick={() => { setShowSwitchPanel(true); setSwitchError(""); setShowAddAccountForm(false); }}
                    className="px-4 py-2 cursor-pointer flex items-center justify-between transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="flex items-center space-x-3">
                      <RotateCcw className="w-5 h-5" />
                      <span className="text-slate-200">{t('switchAccount')}</span>
                    </div>
                    {savedAccounts.filter(a => a._id !== user?._id).length > 0 && (
                      <span className="text-xs rounded-full px-2 py-0.5 font-medium"
                        style={{ background: "rgba(236,91,19,0.2)", color: "#ec5b13" }}>
                        {savedAccounts.filter(a => a._id !== user?._id).length}
                      </span>
                    )}
                  </div>

                  {/* Switch Account Panel (inline inside dropdown) */}
                  {showSwitchPanel && (
                    <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(18,10,6,0.5)" }}>
                      <div className="px-4 py-2 flex items-center space-x-2">
                        <button
                          onClick={() => { setShowSwitchPanel(false); setShowAddAccountForm(false); }}
                          className="p-1 rounded-full transition-colors"
                          style={{ color: "#94a3b8" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-300">{t('switchAccount')}</span>
                      </div>

                      {switchError && (
                        <p className="px-4 pb-2 text-xs text-red-400">{switchError}</p>
                      )}

                      {/* Saved accounts list */}
                      <div className="max-h-48 overflow-y-auto">
                        {savedAccounts.filter(a => a._id !== user?._id).length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-500">No other saved accounts</p>
                        ) : (
                          savedAccounts
                            .filter(a => a._id !== user?._id)
                            .map(account => (
                              <div
                                key={account._id}
                                className="flex items-center px-4 py-2 group transition-colors"
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <button
                                  onClick={() => handleSwitchAccount(account._id)}
                                  disabled={switchingId === account._id}
                                  className="flex items-center space-x-3 flex-1 text-left disabled:opacity-60"
                                >
                                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                                    style={{ background: "linear-gradient(135deg, #ec5b13, #8b5cf6)" }}>
                                    {account.avatar ? (
                                      <img src={account.avatar} alt={account.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                        {(account.fullName || account.userName || 'U')[0].toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-200 truncate">{account.fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">@{account.userName}</p>
                                  </div>
                                  {switchingId === account._id && (
                                    <span className="ml-2 text-xs" style={{ color: "#ec5b13" }}>Switching...</span>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleRemoveAccount(account._id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity ml-2 text-slate-500 hover:text-slate-300"
                                  title="Remove account"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                        )}
                      </div>

                      {/* Add account */}
                      {!showAddAccountForm ? (
                        <button
                          onClick={() => { setShowAddAccountForm(true); setAddAccountError(""); }}
                          className="w-full px-4 py-2 text-sm flex items-center space-x-2 border-t transition-colors"
                          style={{ color: "#ec5b13", borderColor: "rgba(255,255,255,0.07)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>{t('addAccount')}</span>
                        </button>
                      ) : (
                        <form onSubmit={handleAddAccountSubmit} className="px-4 py-3 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                          <p className="text-xs font-semibold text-slate-400 mb-1">Sign in to another account</p>
                          {addAccountError && <p className="text-xs text-red-400">{addAccountError}</p>}
                          <input
                            type="text"
                            placeholder="Email or username"
                            value={addAccountIdentifier}
                            onChange={e => setAddAccountIdentifier(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                          />
                          <input
                            type="password"
                            placeholder="Password"
                            value={addAccountPassword}
                            onChange={e => setAddAccountPassword(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                          />
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              disabled={addAccountLoading}
                              className="flex-1 py-1.5 text-sm rounded-lg font-bold disabled:opacity-60"
                              style={{ background: "#ec5b13", color: "#fff" }}
                            >
                              {addAccountLoading ? 'Adding...' : 'Add'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddAccountForm(false); setAddAccountError(""); }}
                              className="flex-1 py-1.5 text-sm rounded-lg transition-colors"
                              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}
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
                    className="px-4 py-2 cursor-pointer flex items-center space-x-3 transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-slate-200">Account Settings</span>
                  </div>
                  <div 
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="px-4 py-2 cursor-pointer flex items-center space-x-3 transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-slate-200">{t('signOut')}</span>
                  </div>
                </div>

                <div className="border-t py-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  {/* Language selector */}
                  {!showLanguagePanel ? (
                    <div
                      onClick={() => setShowLanguagePanel(true)}
                      className="px-4 py-2 cursor-pointer flex items-center justify-between transition-colors"
                      style={{ color: "#94a3b8" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium text-slate-400">{t('language')}:</p>
                          <p className="text-sm text-slate-200">
                            {language === 'hi' ? t('hindi') : t('english')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ) : (
                    <div style={{ background: "rgba(18,10,6,0.5)" }}>
                      <div className="px-4 py-2 flex items-center space-x-2 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <button
                          onClick={() => setShowLanguagePanel(false)}
                          className="p-1 rounded-full text-slate-400 transition-colors"
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-300">{t('language')}</span>
                      </div>
                      <div
                        onClick={() => { setLanguage('en'); setShowLanguagePanel(false); }}
                        className="px-4 py-2 cursor-pointer flex items-center justify-between transition-colors"
                        style={{ color: "#94a3b8" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span className="text-sm text-slate-200">English</span>
                        {language === 'en' && <Check className="w-4 h-4" style={{ color: "#ec5b13" }} />}
                      </div>
                      <div
                        onClick={() => { setLanguage('hi'); setShowLanguagePanel(false); }}
                        className="px-4 py-2 cursor-pointer flex items-center justify-between transition-colors"
                        style={{ color: "#94a3b8" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span className="text-sm text-slate-200">हिंदी</span>
                        {language === 'hi' && <Check className="w-4 h-4" style={{ color: "#ec5b13" }} />}
                      </div>
                    </div>
                  )}
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-slate-500 mb-1">{t('location')}:</p>
                    <span className="text-sm text-slate-300">India</span>
                  </div>
                </div>

                <div className="border-t py-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div
                    onClick={() => { navigate('/help'); setShowProfileMenu(false); }}
                    className="px-4 py-2 cursor-pointer flex items-center space-x-3 transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-slate-200">{t('help')}</span>
                  </div>
                  <div
                    onClick={() => { navigate('/feedback'); setShowProfileMenu(false); }}
                    className="px-4 py-2 cursor-pointer flex items-center space-x-3 transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,91,19,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-slate-200">{t('sendFeedback')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </header>
  );
};

export default Header;
