import { useState } from "react";
import {
  Eye, Trash2, CheckCircle, UserX, Search, Filter, ChevronLeft,
  ChevronRight, Flag, AlertTriangle, Clock, XCircle, MoreVertical
} from "lucide-react";



const REASONS = ["All Reasons", "Spam / Misleading", "Violence / Graphic", "Privacy Violation", "Hate Speech", "Misinformation", "Harmful Content", "Copyright", "Sexual Content", "Harassment", "Child Safety"];
const STATUSES = ["All Status", "Pending", "Reviewed", "Removed"];
const PAGE_SIZE = 8;

const StatusBadge = ({ status }) => {
  const map = {
    Pending:  { cls: "bg-amber-100 text-amber-700 border-amber-200",  icon: Clock },
    Reviewed: { cls: "bg-blue-100 text-blue-700 border-blue-200",    icon: CheckCircle },
    Removed:  { cls: "bg-red-100 text-red-700 border-red-200",       icon: XCircle },
  };
  const { cls, icon: Icon } = map[status] || map.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
};

const ReasonBadge = ({ reason }) => {
  const colorMap = {
    "Spam / Misleading": "bg-orange-100 text-orange-700",
    "Violence / Graphic": "bg-red-100 text-red-700",
    "Privacy Violation": "bg-purple-100 text-purple-700",
    "Hate Speech": "bg-rose-100 text-rose-700",
    "Misinformation": "bg-yellow-100 text-yellow-700",
    "Harmful Content": "bg-red-100 text-red-700",
    "Copyright": "bg-indigo-100 text-indigo-700",
    "Sexual Content": "bg-pink-100 text-pink-700",
    "Harassment": "bg-orange-100 text-orange-700",
    "Child Safety": "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[reason] || "bg-gray-100 text-gray-700"}`}>
      {reason}
    </span>
  );
};

const Report = ({ isDark = false }) => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("All Reasons");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);

  const dm = isDark;
  const cardBg = dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textPrimary = dm ? "text-white" : "text-gray-900";
  const textSecondary = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500";
  const rowHover = dm ? "hover:bg-gray-750 bg-gray-800" : "hover:bg-gray-50 bg-white";
  const divider = dm ? "divide-gray-700" : "divide-gray-100";
  const thCls = dm ? "bg-gray-750 text-gray-400 border-gray-700" : "bg-gray-50 text-gray-500 border-gray-200";

  const filtered = reports.filter((r) => {
    const matchSearch =
      !search.trim() ||
      r.videoTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedBy.toLowerCase().includes(search.toLowerCase());
    const matchReason = filterReason === "All Reasons" || r.reason === filterReason;
    const matchStatus = filterStatus === "All Status" || r.status === filterStatus;
    return matchSearch && matchReason && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateStatus = (id, status) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setOpenMenu(null);
  };
  const removeReport = (id) => {
    updateStatus(id, "Removed");
  };

  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const reviewedCount = reports.filter((r) => r.status === "Reviewed").length;
  const removedCount = reports.filter((r) => r.status === "Removed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Reports & Flagged Content</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>Review and moderate user-reported content</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", count: pendingCount, cls: "from-amber-500 to-orange-500", icon: Clock },
          { label: "Reviewed", count: reviewedCount, cls: "from-blue-500 to-indigo-500", icon: CheckCircle },
          { label: "Removed", count: removedCount, cls: "from-red-500 to-rose-600", icon: XCircle },
        ].map(({ label, count, cls, icon: Icon }) => (
          <div key={label} className={`${cardBg} border rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>{label}</p>
                <p className={`text-3xl font-bold mt-1 ${textPrimary}`}>{count}</p>
              </div>
              <div className={`bg-gradient-to-br ${cls} p-3 rounded-xl`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${cardBg} border rounded-2xl p-4 shadow-sm`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
            <input
              type="text"
              placeholder="Search by video title or reporter..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${textSecondary} flex-shrink-0`} />
            <select
              value={filterReason}
              onChange={(e) => { setFilterReason(e.target.value); setPage(1); }}
              className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            >
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className={`border-b ${thCls} border-gray-200`}>
                {["Video", "Report Reason", "Reported By", "Date", "Status", "Actions"].map((h) => (
                  <th key={h} className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${thCls}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-6 py-14 text-center ${textSecondary}`}>
                    <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No reports found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginated.map((report) => (
                  <tr key={report.id} className={`${rowHover} transition-colors`}>
                    {/* Video */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={report.thumbnail}
                            alt={report.videoTitle}
                            className="w-16 h-9 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[6px] border-l-gray-800 border-y-[4px] border-y-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${textPrimary} max-w-[180px] line-clamp-2`}>
                          {report.videoTitle}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-5 py-4">
                      <ReasonBadge reason={report.reason} />
                    </td>

                    {/* Reporter */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {report.reportedByAvatar}
                        </div>
                        <span className={`text-sm ${textPrimary}`}>{report.reportedBy}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className={`px-5 py-4 text-sm ${textSecondary} whitespace-nowrap`}>
                      {new Date(report.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 relative">
                        <button
                          title="View video"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title="Ignore report"
                          onClick={() => updateStatus(report.id, "Reviewed")}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          title="Remove video"
                          onClick={() => removeReport(report.id)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === report.id ? null : report.id)}
                            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${textSecondary}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenu === report.id && (
                            <div className={`absolute right-0 top-8 z-50 w-40 ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-xl shadow-lg py-1`}>
                              <button
                                onClick={() => { setOpenMenu(null); }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${textPrimary} hover:bg-red-50 hover:text-red-600 transition-colors`}
                              >
                                <UserX className="w-4 h-4" /> Ban User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-5 py-4 border-t ${dm ? "border-gray-700" : "border-gray-100"} flex items-center justify-between`}>
            <p className={`text-sm ${textSecondary}`}>
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} reports
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${dm ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-indigo-600 text-white"
                      : dm
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${dm ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
