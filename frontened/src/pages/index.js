const fs = require('fs');
let code = fs.readFileSync('ScheduledStreams.jsx', 'utf8');

const sIdx = code.indexOf('<div className="flex flex-col gap-2 mt-2">');
const eIdx = code.indexOf('{streamKey && (', sIdx);

if (sIdx !== -1 && eIdx !== -1) {
  const newStr = \              <div className="flex flex-col gap-3 mt-2 mb-1">
                <span className="flex items-center gap-1 font-medium text-xs text-gray-400 whitespace-nowrap bg-[#1a1a1a] self-start px-2 py-1 rounded-md border border-gray-800">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  {new Date(stream.scheduledAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {isOwn && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onCancel(stream._id); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-500 rounded-lg text-xs font-semibold transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      {!streamKey ? (
                        <button onClick={handleGetKey} disabled={isLoadingKey}
                          className="flex-1 min-w-[max-content] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                          <Radio className="w-3.5 h-3.5" /> {isLoadingKey ? "Preparing..." : "Get Stream Key"}
                        </button>
                      ) : null}
                    </>
                  )}
                  {!isOwn && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                      <Play className="w-3 h-3 fill-current" /> Tap to view
                    </span>
                  )}
                </div>
              </div>

                \;

  // We are replacing from '<div className="flex flex-col gap-2 mt-2">' up to {streamKey && ( 
  // Need to make sure we keep the end boundary
  let before = code.substring(0, sIdx);
  let after = '{streamKey && (' + code.substring(eIdx + 15);
  fs.writeFileSync('ScheduledStreams.jsx', before + newStr + after);
} else {
}
