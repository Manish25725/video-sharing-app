import re, sys

with open('ScheduledStreams.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

start_str = '<div className="flex flex-col gap-2 mt-2">'
end_str = '{streamKey && ('

s_idx = code.find(start_str)
e_idx = code.find(end_str, s_idx)

if s_idx != -1 and e_idx != -1:
    new_str = '''              <div className="flex flex-col gap-3 mt-2 mb-1">
                <span className="flex items-center gap-1.5 font-medium text-[11px] text-gray-400 whitespace-nowrap bg-[#1a1a1a] self-start px-2 py-1 rounded-md border border-gray-800">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  {new Date(stream.scheduledAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {isOwn && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onCancel(stream._id); }}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-500 rounded-lg text-xs font-semibold transition-colors">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      {!streamKey ? (
                        <button onClick={handleGetKey} disabled={isLoadingKey}
                          className="flex-[2] min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 border border-indigo-500 shadow-sm">
                          <Radio className="w-3.5 h-3.5" /> {"Get Stream Key"}
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

                '''
    
    before = code[:s_idx]
    after = code[e_idx:]
    with open('ScheduledStreams.jsx', 'w', encoding='utf-8') as f:
        f.write(before + new_str + after)
    print("PATCHED")
else:
    print("NOT FOUND", s_idx, e_idx)
