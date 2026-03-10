import { Link } from "react-router-dom";
import { Users, Radio } from "lucide-react";

const LiveStreamCard = ({ stream }) => {
  const { streamKey, title, thumbnailUrl, viewerCount, streamerId } = stream;

  const streamerName =
    streamerId?.fullName || streamerId?.userName || "Streamer";
  const avatar = streamerId?.avatar;

  return (
    <Link
      to={`/live/${streamKey}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900">
            <Radio className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>

        {/* Viewer count overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          <Users className="w-3 h-3" />
          <span>{viewerCount?.toLocaleString() ?? 0} watching</span>
        </div>
      </div>

      {/* Meta */}
      <div className="p-3 flex gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={streamerName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-indigo-700 font-bold text-sm">
              {streamerName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-1">{streamerName}</p>
        </div>
      </div>
    </Link>
  );
};

export default LiveStreamCard;
