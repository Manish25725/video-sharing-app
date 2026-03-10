import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, Video, Flag, MessageSquare, BarChart3,
  Settings, Bell, Search, ChevronLeft, ChevronRight, Eye, Trash2,
  Edit, Shield, LogOut, Moon, Sun, CheckCircle,
  ArrowUp, ArrowDown, TrendingUp, ThumbsUp,
  RefreshCw, Ban, Upload, AlertTriangle,
} from "lucide-react";
import { videoService, transformVideosArray } from "../services/videoService";
import { dashboardService } from "../services/dashboardService";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Report from "./Report";

/* reusable micro-components */
const Avatar = ({ initials, size = "md", gradient = "from-indigo-500 to-purple-600" }) => {
  const sz = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" }[size];
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const StatusPill = ({ status }) => {
  const map = {
    Active:      "bg-emerald-100 text-emerald-700 border-emerald-200",
    Banned:      "bg-red-100 text-red-700 border-red-200",
    Suspended:   "bg-amber-100 text-amber-700 border-amber-200",
    Pending:     "bg-amber-100 text-amber-700 border-amber-200",
    Approved:    "bg-emerald-100 text-emerald-700 border-emerald-200",
    Flagged:     "bg-orange-100 text-orange-700 border-orange-200",
    Spam:        "bg-red-100 text-red-700 border-red-200",
    Published:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    Unpublished: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${map[status] || map.Pending}`}>
      {status}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle, className = "" }) => (
  <div className={`py-14 text-center ${className}`}>
    <Icon className="w-10 h-10 mx-auto mb-3 opacity-25" />
    <p className="font-medium text-sm">{title}</p>
    {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
  </div>
);

/* main component */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [topSearch, setTopSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [stats, setStats] = useState({
    totalUsers: 0, totalVideos: 0, totalViews: 0, totalReports: 0,
    usersChange: 0, videosChange: 0, viewsChange: 0, reportsChange: 0,
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [statsRes, videosRes] = await Promise.all([
        dashboardService.getChannelStats(),
        videoService.getAllVideos(1, 50, "", "createdAt", "desc"),
      ]);
      if (statsRes?.success && statsRes.data) {
        setStats((p) => ({
          ...p,
          totalViews: statsRes.data.totalViews ?? p.totalViews,
          totalVideos: statsRes.data.totalVideos ?? p.totalVideos,
        }));
      }
      if (videosRes?.success) {
        const t = transformVideosArray(videosRes.data);
        setRecentVideos(t.slice(0, 5));
        setAllVideos(t);
      }
    } catch (_) {}
    setDataLoading(false);
  };

  const d = isDark;
  const bg        = d ? "bg-gray-950" : "bg-slate-50";
  const cardBg    = d ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const sidebarBg = "bg-slate-900";
  const navbarBg  = d ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const tp        = d ? "text-white" : "text-gray-900";
  const ts        = d ? "text-gray-400" : "text-gray-500";
  const inputCls  = d
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-400"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500";
  const divider   = d ? "divide-gray-800" : "divide-gray-100";
  const thBg      = d ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500";
  const rowHover  = d ? "hover:bg-gray-800/60" : "hover:bg-slate-50";

  const navItems = [
    { id: "overview",  icon: LayoutDashboard, label: "Dashboard" },
    { id: "users",     icon: Users,           label: "Users" },
    { id: "videos",    icon: Video,           label: "Videos" },
    { id: "reports",   icon: Flag,            label: "Reports", badge: stats.totalReports },
    { id: "comments",  icon: MessageSquare,   label: "Comments" },
    { id: "analytics", icon: BarChart3,       label: "Analytics" },
    { id: "settings",  icon: Settings,        label: "Settings" },
  ];

  /* sidebar */
  const SidebarNav = () => (
    <aside className={`${sidebarBg} fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
      <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "px-6"} h-16 border-b border-slate-800 flex-shrink-0`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          PV
        </div>
        {!sidebarCollapsed && <span className="ml-3 text-white font-bold text-lg">Admin Panel</span>}
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ id, icon: Icon, label, badge }) => {
          const active = activeSection === id;
          return (
            <button key={id} onClick={() => setActiveSection(id)} title={sidebarCollapsed ? label : undefined}
              className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-0" : "px-5"} py-3 text-sm font-medium transition-all relative ${
                active ? "text-white bg-indigo-600/20 border-r-2 border-indigo-500" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-indigo-400" : ""}`} />
              {!sidebarCollapsed && <span className="ml-3">{label}</span>}
              {!sidebarCollapsed && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-bold">{badge}</span>
              )}
              {sidebarCollapsed && badge > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 py-3">
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "px-5"} py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm`}>
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span className="ml-3">Collapse</span></>}
        </button>
        <button onClick={async () => { await logout(); navigate("/"); }}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "px-5"} py-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors text-sm`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="ml-3">Sign out</span>}
        </button>
      </div>
    </aside>
  );

  /* top navbar - clean, no clutter */
  const TopNavbar = () => (
    <header className={`${navbarBg} border-b fixed top-0 right-0 z-40 flex items-center px-5 h-16 gap-3 transition-all duration-300 ${sidebarCollapsed ? "left-16" : "left-64"}`}>
      <div className="relative flex-1 max-w-md">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${ts}`} />
        <input type="text" placeholder="Search..." value={topSearch} onChange={(e) => setTopSearch(e.target.value)}
          className={`w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`} />
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <button onClick={() => setIsDark(!isDark)}
          className={`p-2 rounded-xl transition-colors ${d ? "text-yellow-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div ref={notifRef} className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-xl transition-colors ${d ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}>
            <Bell className="w-5 h-5" />
          </button>
          {showNotifications && (
            <div className={`absolute right-0 top-12 w-72 ${d ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl shadow-2xl z-50 overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${d ? "border-gray-700" : "border-gray-100"}`}>
                <h3 className={`font-semibold text-sm ${tp}`}>Notifications</h3>
              </div>
              <div className={`px-5 py-8 text-center ${ts}`}>
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm font-medium">No new notifications</p>
              </div>
            </div>
          )}
        </div>
        <div ref={profileRef} className="relative">
          <button onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${d ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.fullName?.slice(0, 2).toUpperCase() || "AD"}
            </div>
            <span className={`text-sm font-semibold hidden sm:block ${tp}`}>{user?.fullName?.split(" ")[0] || "Admin"}</span>
          </button>
          {showProfile && (
            <div className={`absolute right-0 top-12 w-48 ${d ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl shadow-2xl z-50 py-1 overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${d ? "border-gray-700" : "border-gray-100"}`}>
                <p className={`font-semibold text-sm ${tp}`}>{user?.fullName || "Admin User"}</p>
                <p className={`text-xs ${ts}`}>{user?.email || ""}</p>
              </div>
              <button className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${tp} ${rowHover} transition-colors`}>
                <Shield className="w-4 h-4 text-indigo-500" /> Admin Settings
              </button>
              <button onClick={async () => { await logout(); navigate("/"); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 ${rowHover} transition-colors`}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  /* stat card with loading skeleton */
  const StatCard = ({ title, value, change, icon: Icon, gradient }) => (
    <div className={`${cardBg} border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200`}>
      {dataLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className={`h-3 w-24 rounded ${d ? "bg-gray-800" : "bg-gray-100"}`} />
          <div className={`h-8 w-20 rounded ${d ? "bg-gray-800" : "bg-gray-100"}`} />
          <div className={`h-3 w-16 rounded ${d ? "bg-gray-800" : "bg-gray-100"}`} />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${ts} mb-1`}>{title}</p>
              <p className={`text-3xl font-bold ${tp}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
            </div>
            <div className={`${gradient} p-3 rounded-xl shadow-sm`}><Icon className="w-6 h-6 text-white" /></div>
          </div>
          <div className={`flex items-center text-sm font-medium ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {change >= 0 ? <ArrowUp className="w-3.5 h-3.5 mr-1" /> : <ArrowDown className="w-3.5 h-3.5 mr-1" />}
            {Math.abs(change)}%
            <span className={`ml-1 font-normal text-xs ${ts}`}>vs last month</span>
          </div>
        </>
      )}
    </div>
  );

  /* overview */
  const OverviewSection = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${tp}`}>Dashboard Overview</h1>
          <p className={`text-sm ${ts} mt-1`}>Welcome back, {user?.fullName?.split(" ")[0] || "Admin"}.</p>
        </div>
        <button onClick={fetchData}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors flex-shrink-0 ${d ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          <RefreshCw className={`w-4 h-4 ${dataLoading ? "animate-spin" : ""}`} />
          {dataLoading ? "Loading..." : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Users"  value={stats.totalUsers}   change={stats.usersChange}   icon={Users} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard title="Total Videos" value={stats.totalVideos}  change={stats.videosChange}  icon={Video} gradient="bg-gradient-to-br from-violet-500 to-purple-700" />
        <StatCard title="Total Views"  value={stats.totalViews}   change={stats.viewsChange}   icon={Eye}   gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard title="Open Reports" value={stats.totalReports} change={stats.reportsChange} icon={Flag}  gradient="bg-gradient-to-br from-rose-500 to-red-600" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Review Reports",  icon: Flag,          color: "text-red-600 bg-red-50 hover:bg-red-100",            section: "reports" },
          { label: "Manage Videos",   icon: Video,         color: "text-violet-600 bg-violet-50 hover:bg-violet-100",   section: "videos" },
          { label: "User Management", icon: Users,         color: "text-blue-600 bg-blue-50 hover:bg-blue-100",         section: "users" },
          { label: "Mod Comments",    icon: MessageSquare, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100", section: "comments" },
        ].map(({ label, icon: Icon, color, section }) => (
          <button key={label} onClick={() => setActiveSection(section)}
            className={`${color} rounded-2xl p-4 flex items-center gap-3 font-medium text-sm transition-colors shadow-sm hover:shadow`}>
            <Icon className="w-5 h-5 flex-shrink-0" /><span>{label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 ${cardBg} border rounded-2xl shadow-sm`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${d ? "border-gray-800" : "border-gray-100"}`}>
            <h2 className={`font-semibold ${tp}`}>Recent Videos</h2>
            <button onClick={() => setActiveSection("videos")} className="text-xs text-indigo-600 font-medium hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className={`border-b ${d ? "border-gray-800" : "border-gray-100"}`}>
                  {["Video", "Views", "Status", "Date"].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider ${ts}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {dataLoading ? (
                  [1,2,3,4,5].map((i) => (
                    <tr key={i}>
                      {[160, 60, 70, 70].map((w, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className={`h-4 rounded animate-pulse ${d ? "bg-gray-800" : "bg-gray-100"}`} style={{ width: `${w}px` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentVideos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`px-5 py-12 text-center ${ts}`}>
                      <Video className="w-8 h-8 mx-auto mb-2 opacity-25" />
                      <p className="text-sm font-medium">No videos yet</p>
                    </td>
                  </tr>
                ) : recentVideos.map((v, i) => (
                  <tr key={i} className={`${rowHover} transition-colors`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={v.thumbnail} alt="" className="w-14 h-8 object-cover rounded-lg flex-shrink-0" />
                        <span className={`text-sm font-medium ${tp} line-clamp-1 max-w-[140px]`}>{v.title}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-sm ${ts}`}>{(v.views || 0).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusPill status={v.isPublished !== false ? "Published" : "Unpublished"} /></td>
                    <td className={`px-5 py-3 text-sm ${ts}`}>{v.uploadTime ? new Date(v.uploadTime).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={`${cardBg} border rounded-2xl shadow-sm`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${d ? "border-gray-800" : "border-gray-100"}`}>
            <h2 className={`font-semibold ${tp}`}>Recent Reports</h2>
            <button onClick={() => setActiveSection("reports")} className="text-xs text-indigo-600 font-medium hover:underline">View all</button>
          </div>
          <EmptyState icon={Flag} title="No recent reports" subtitle="Reports will appear here" className={ts} />
        </div>
      </div>
    </div>
  );

  /* users */
  const UsersSection = () => {
    const filtered = users.filter((u) => !userSearch.trim() ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()));
    const banUser = (id) => setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "Banned" ? "Active" : "Banned" } : u));
    return (
      <div className="space-y-6">
        <div><h1 className={`text-2xl font-bold ${tp}`}>Users Management</h1><p className={`text-sm ${ts} mt-1`}>{users.length} total users</p></div>
        <div className={`${cardBg} border rounded-2xl shadow-sm`}>
          <div className={`px-5 py-4 border-b ${d ? "border-gray-800" : "border-gray-100"}`}>
            <div className="relative max-w-sm">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${ts}`} />
              <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr className={thBg}>{["User","Role","Videos","Status","Joined","Actions"].map((h) => <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className={`divide-y ${divider}`}>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState icon={Users} title={userSearch ? "No matching users" : "No users yet"}
                      subtitle={userSearch ? "Try a different search term" : "Registered users will appear here"} className={ts} />
                  </td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id} className={`${rowHover} transition-colors`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3"><Avatar initials={u.avatar} /><div><p className={`text-sm font-semibold ${tp}`}>{u.name}</p><p className={`text-xs ${ts}`}>{u.email}</p></div></div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${u.role==="Moderator"?"bg-violet-100 text-violet-700":u.role==="Creator"?"bg-indigo-100 text-indigo-700":"bg-gray-100 text-gray-600"}`}>{u.role}</span>
                    </td>
                    <td className={`px-5 py-4 text-sm ${ts}`}>{u.videos}</td>
                    <td className="px-5 py-4"><StatusPill status={u.status} /></td>
                    <td className={`px-5 py-4 text-sm ${ts}`}>{u.joined}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => banUser(u.id)} className={`p-1.5 rounded-lg transition-colors ${u.status==="Banned"?"text-emerald-500 hover:bg-emerald-50":"text-red-500 hover:bg-red-50"}`} title={u.status==="Banned"?"Unban":"Ban"}>
                          {u.status==="Banned"?<CheckCircle className="w-4 h-4"/>:<Ban className="w-4 h-4"/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* videos */
  const VideosSection = () => {
    const filtered = allVideos.filter((v) => !videoSearch.trim() || v.title?.toLowerCase().includes(videoSearch.toLowerCase()));
    const fmt = (s) => { if (!s) return "—"; const m = Math.floor(s / 60); const sc = Math.round(s % 60); return `${m}:${sc.toString().padStart(2, "0")}`; };
    return (
      <div className="space-y-6">
        <div><h1 className={`text-2xl font-bold ${tp}`}>Videos Management</h1><p className={`text-sm ${ts} mt-1`}>{allVideos.length} videos on platform</p></div>
        <div className={`${cardBg} border rounded-2xl shadow-sm`}>
          <div className={`px-5 py-4 border-b ${d ? "border-gray-800" : "border-gray-100"}`}>
            <div className="relative max-w-sm">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${ts}`} />
              <input type="text" placeholder="Search videos..." value={videoSearch} onChange={(e) => setVideoSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead><tr className={thBg}>{["Video","Duration","Views","Status","Uploaded","Actions"].map((h)=><th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className={`divide-y ${divider}`}>
                {dataLoading ? (
                  [1,2,3,4,5].map((i) => (
                    <tr key={i}>
                      {[200,50,60,70,80,60].map((w, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className={`h-4 rounded animate-pulse ${d ? "bg-gray-800" : "bg-gray-100"}`} style={{ width: `${w}px` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6}>
                    <EmptyState icon={Video} title={videoSearch ? "No matching videos" : "No videos yet"}
                      subtitle={videoSearch ? "Try a different search term" : undefined} className={ts} />
                  </td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} className={`${rowHover} transition-colors`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img src={v.thumbnail} alt="" className="w-20 h-12 object-cover rounded-lg" />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">{fmt(v.duration)}</div>
                        </div>
                        <span className={`text-sm font-medium ${tp} max-w-[180px] line-clamp-2`}>{v.title}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-sm ${ts}`}>{fmt(v.duration)}</td>
                    <td className={`px-5 py-4 text-sm ${ts}`}>{(v.views || 0).toLocaleString()}</td>
                    <td className="px-5 py-4"><StatusPill status={v.isPublished !== false ? "Published" : "Unpublished"} /></td>
                    <td className={`px-5 py-4 text-sm ${ts}`}>{v.uploadTime ? new Date(v.uploadTime).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Eye className="w-4 h-4"/></button>
                        <button className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"><Edit className="w-4 h-4"/></button>
                        <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* comments */
  const CommentsSection = () => (
    <div className="space-y-6">
      <div><h1 className={`text-2xl font-bold ${tp}`}>Comments Moderation</h1><p className={`text-sm ${ts} mt-1`}>Review and moderate user comments</p></div>
      <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead><tr className={thBg}>{["User","Comment","Video","Date","Status","Actions"].map((h)=><th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className={`divide-y ${divider}`}>
              {comments.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={MessageSquare} title="No comments to moderate" subtitle="Flagged comments will appear here" className={ts} />
                </td></tr>
              ) : comments.map((c) => (
                <tr key={c.id} className={`${rowHover} transition-colors`}>
                  <td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar initials={c.avatar} size="sm"/><span className={`text-sm font-medium ${tp}`}>{c.user}</span></div></td>
                  <td className="px-5 py-4"><p className={`text-sm ${tp} max-w-[260px] line-clamp-2`}>{c.comment}</p></td>
                  <td className={`px-5 py-4 text-sm ${ts} max-w-[120px] truncate`}>{c.video}</td>
                  <td className={`px-5 py-4 text-sm ${ts}`}>{c.date}</td>
                  <td className="px-5 py-4"><StatusPill status={c.status}/></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>setComments(p=>p.map(x=>x.id===c.id?{...x,status:"Approved"}:x))} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"><CheckCircle className="w-4 h-4"/></button>
                      <button onClick={()=>setComments(p=>p.filter(x=>x.id!==c.id))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* analytics */
  const AnalyticsSection = () => (
    <div className="space-y-6">
      <div><h1 className={`text-2xl font-bold ${tp}`}>Analytics</h1><p className={`text-sm ${ts} mt-1`}>Platform performance overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Views",  value: stats.totalViews.toLocaleString(),   icon: Eye,        g: "from-sky-500 to-blue-600" },
          { label: "Total Videos", value: stats.totalVideos.toLocaleString(),  icon: Video,      g: "from-violet-500 to-purple-700" },
          { label: "Total Users",  value: stats.totalUsers.toLocaleString(),   icon: Users,      g: "from-emerald-500 to-teal-600" },
          { label: "Reports",      value: stats.totalReports.toLocaleString(), icon: Flag,       g: "from-rose-500 to-pink-600" },
        ].map(({ label, value, icon: Icon, g }) => (
          <div key={label} className={`${cardBg} border rounded-2xl p-5 shadow-sm`}>
            {dataLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className={`h-3 w-20 rounded ${d ? "bg-gray-800" : "bg-gray-100"}`} />
                <div className={`h-6 w-16 rounded ${d ? "bg-gray-800" : "bg-gray-100"}`} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`bg-gradient-to-br ${g} p-2.5 rounded-xl`}><Icon className="w-4 h-4 text-white"/></div>
                <div><p className={`text-xs ${ts}`}>{label}</p><p className={`text-xl font-bold ${tp}`}>{value}</p></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={`${cardBg} border rounded-2xl p-10 shadow-sm text-center ${ts}`}>
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="font-medium text-sm">Detailed analytics coming soon</p>
        <p className="text-xs mt-2 opacity-70">Connect your analytics API to see charts and trends</p>
      </div>
    </div>
  );

  /* settings */
  const SettingsSection = () => {
    const [form, setForm] = useState({ siteName: "PlayVibe", contactEmail: "", maxUploadMb: "2048", allowRegistrations: true, requireEmailVerification: true, autoModerate: false });
    return (
      <div className="space-y-6">
        <div><h1 className={`text-2xl font-bold ${tp}`}>Platform Settings</h1><p className={`text-sm ${ts} mt-1`}>Configure global platform preferences</p></div>
        <div className={`${cardBg} border rounded-2xl p-6 shadow-sm space-y-5`}>
          <h2 className={`font-semibold ${tp} border-b ${d?"border-gray-800":"border-gray-100"} pb-3`}>General</h2>
          {[{ label: "Site Name", key: "siteName", type: "text" }, { label: "Admin Contact Email", key: "contactEmail", type: "email" }, { label: "Max Upload Size (MB)", key: "maxUploadMb", type: "number" }].map(({ label, key, type }) => (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <label className={`text-sm font-medium ${tp}`}>{label}</label>
              <input type={type} value={form[key]} onChange={(e) => setForm(p => ({...p,[key]:e.target.value}))}
                className={`col-span-2 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`} />
            </div>
          ))}
          {[{ label: "Allow New Registrations", key: "allowRegistrations" }, { label: "Require Email Verification", key: "requireEmailVerification" }, { label: "Auto-moderate Comments (AI)", key: "autoModerate" }].map(({ label, key }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <label className={`text-sm font-medium ${tp}`}>{label}</label>
              <button onClick={() => setForm(p => ({...p,[key]:!p[key]}))}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form[key]?"bg-indigo-600":d?"bg-gray-700":"bg-gray-200"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form[key]?"translate-x-5":""}`} />
              </button>
            </div>
          ))}
          <div className="pt-2">
            <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":  return <OverviewSection />;
      case "users":     return <UsersSection />;
      case "videos":    return <VideosSection />;
      case "reports":   return <Report isDark={isDark} />;
      case "comments":  return <CommentsSection />;
      case "analytics": return <AnalyticsSection />;
      case "settings":  return <SettingsSection />;
      default:          return <OverviewSection />;
    }
  };

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      <SidebarNav />
      <TopNavbar />
      <main className={`transition-all duration-300 pt-16 min-h-screen ${sidebarCollapsed ? "pl-16" : "pl-64"}`}>
        <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
