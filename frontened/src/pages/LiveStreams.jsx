import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import streamService from "../services/streamService.js";
import LiveStreamCard from "../components/LiveStreamCard.jsx";
import { Radio, RefreshCw, Calendar } from "lucide-react";

const LiveStreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStreams = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await streamService.getLiveStreams();
      setStreams(data || []);
    } catch {
      setStreams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStreams(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Radio className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Live Now</h1>
            <p className="text-xs text-gray-400">
              {streams.length} stream{streams.length !== 1 ? "s" : ""} live
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/scheduled-streams"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Calendar className="w-3.5 h-3.5" /> Upcoming
          </Link>
          <button onClick={() => fetchStreams(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl bg-gray-100 animate-pulse aspect-video" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Radio className="w-14 h-14 text-gray-200 mb-4" />
          <p className="text-gray-600 font-semibold text-lg">No streams live right now</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon, or browse scheduled streams.</p>
          <Link to="/scheduled-streams"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Calendar className="w-4 h-4" /> View Upcoming Streams
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {streams.map((stream) => (
            <LiveStreamCard key={stream._id || stream.streamKey} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveStreams;
