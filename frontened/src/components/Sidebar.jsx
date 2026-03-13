import {
  Home,
  TrendingUp,
  History,
  Clock,
  ThumbsUp,
  Shield,
  List,
  Settings,
  Users,
  MessageSquare,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

/* Reusable nav link — centered when collapsed, labelled when expanded */
const NavLink = ({ icon: Icon, label, path, currentPath, isOpen, onClick }) => {
  const isActive = currentPath === path;
  return (
    <Link
      to={path}
      onClick={onClick}
      title={!isOpen ? label : undefined}
      className={`flex items-center transition-all duration-200 rounded-xl ${
        isOpen ? "px-3 py-2.5 mx-2 gap-3" : "mx-auto w-10 h-10 justify-center"
      } ${isActive ? "mb-0" : "mb-0"}`}
      style={
        isActive
          ? { background: "linear-gradient(135deg,#ec5b13,#ea580c)", color: "#fff", boxShadow: "0 4px 14px rgba(236,91,19,0.35)" }
          : { color: "#94a3b8" }
      }
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(236,91,19,0.1)";
          e.currentTarget.style.color = "#ec5b13";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#94a3b8";
        }
      }}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {isOpen && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </Link>
  );
};

const Sidebar = ({ isOpen, setSidebarOpen }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  
  const handleLinkClick = () => {
    if (window.innerWidth < 768 && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const menuItems = [
    { icon: Home,        label: "Home",     path: "/" },
    { icon: TrendingUp,  label: "Trending",  path: "/trending" },
  ];

  const libraryItems = [
    { icon: History,        label: "History",       path: "/watch-history" },
    { icon: Clock,          label: "Watch Later",   path: "/watch-later" },
    { icon: ThumbsUp,       label: "Liked Videos",  path: "/liked-videos" },
    { icon: List,           label: "Playlists",     path: "/playlists" },
    { icon: Users,          label: "Subscriptions", path: "/subscriptions" },
    { icon: MessageSquare,  label: "Tweets",        path: "/tweets" },
  ];

  const adminItems = [
    { icon: Shield, label: "My Channel", path: "/admin" },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        />
      )}
      <aside
        className={`border-r transition-transform duration-300 flex flex-col flex-shrink-0 fixed md:relative z-50 h-[calc(100vh-64px)] md:h-auto ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-16 w-64"
        }`}
        style={{
          background: "rgba(22,13,8,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "rgba(236,91,19,0.12)",
      }}
    >
      

      {/* ── Scrollable nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 flex flex-col gap-1">

        {/* Discover */}
        <div className={`${isOpen ? "px-2" : "flex flex-col items-center px-0"}`}>
          {isOpen && (
            <p className="px-3 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Discover</p>
          )}
          {menuItems.map((item) => (
            <NavLink key={item.path} {...item} currentPath={currentPath} isOpen={isOpen} onClick={handleLinkClick} />
          ))}
        </div>

        {/* Divider */}
        {isOpen
          ? <div className="mx-4 my-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
          : <div className="w-6 mx-auto my-2 border-t hidden md:block" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
        }

        {/* My Channel (logged-in only) */}
        {user && (
          <>
            <div className={`${isOpen ? "px-2" : "flex flex-col items-center px-0"}`}>
              {isOpen && (
                <p className="px-3 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">My Channel</p>
              )}
              {adminItems.map((item) => (
                <NavLink key={item.path} {...item} currentPath={currentPath} isOpen={isOpen} onClick={handleLinkClick} />
              ))}
            </div>
            {isOpen
              ? <div className="mx-4 my-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
              : <div className="w-6 mx-auto my-2 border-t hidden md:block" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
            }
          </>
        )}

        {/* Library */}
        <div className={`${isOpen ? "px-2" : "flex flex-col items-center px-0"}`}>
          {isOpen && (
            <p className="px-3 mb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Library</p>
          )}
          {libraryItems.map((item) => (
            <NavLink key={item.path} {...item} currentPath={currentPath} isOpen={isOpen} onClick={handleLinkClick} />
          ))}
        </div>
      </div>

      {/* ── Settings footer ── */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <Link
          to="/settings"
          onClick={handleLinkClick}
          title={!isOpen ? "Settings" : undefined}
          className={`flex items-center transition-all duration-200 rounded-xl ${
            isOpen ? "px-3 py-3 mx-2 my-1 gap-3" : "mx-auto w-10 h-10 justify-center my-2 hidden md:flex"
          }`}
          style={
            currentPath === "/settings"
              ? { background: "linear-gradient(135deg,#ec5b13,#ea580c)", color: "#fff", boxShadow: "0 4px 14px rgba(236,91,19,0.35)" }
              : { color: "#94a3b8" }
          }
          onMouseEnter={e => {
            if (currentPath !== "/settings") {
              e.currentTarget.style.background = "rgba(236,91,19,0.1)";
              e.currentTarget.style.color = "#ec5b13";
            }
          }}
          onMouseLeave={e => {
            if (currentPath !== "/settings") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }
          }}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {isOpen && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </aside>
    </>
  );
};

export default Sidebar
