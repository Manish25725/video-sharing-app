const fs = require('fs');
const path = 'd:/video_sharing_app/frontened/src/pages/ProfileSettings.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/bg-white/g, 'bg-[#1a1a1a]');
content = content.replace(/bg-transparent/g, 'bg-transparent');
content = content.replace(/bg-gray-50/g, 'bg-white/5');
content = content.replace(/bg-gray-100/g, 'bg-white/10');
content = content.replace(/bg-gray-200/g, 'bg-white/20');
content = content.replace(/border-gray-50/g, 'border-white/5');
content = content.replace(/border-gray-100/g, 'border-white/5');
content = content.replace(/border-gray-200/g, 'border-white/10');
content = content.replace(/border-gray-300/g, 'border-white/20');
content = content.replace(/text-gray-900/g, 'text-slate-100');
content = content.replace(/text-gray-800/g, 'text-slate-200');
content = content.replace(/text-gray-700/g, 'text-slate-300');
content = content.replace(/text-gray-500/g, 'text-slate-400');
content = content.replace(/text-gray-400/g, 'text-slate-400');
content = content.replace(/text-gray-300/g, 'text-slate-500');

// Indigos to #ec5b13 or related
content = content.replace(/focus:ring-indigo-500\\/20/g, 'focus:ring-[#ec5b13]/20');
content = content.replace(/focus:border-indigo-500/g, 'focus:border-[#ec5b13]');
content = content.replace(/border-indigo-300/g, 'border-[#ec5b13]/50');
content = content.replace(/bg-indigo-50\\/30/g, 'bg-[#ec5b13]/10');
content = content.replace(/text-indigo-400/g, 'text-[#ec5b13]');
content = content.replace(/bg-indigo-100/g, 'bg-[#ec5b13]/20');
content = content.replace(/bg-indigo-600/g, 'bg-[#ec5b13]');
content = content.replace(/hover:bg-indigo-700/g, 'hover:bg-[#d44d0f]');
content = content.replace(/text-indigo-600/g, 'text-[#ec5b13]');
content = content.replace(/bg-indigo-50/g, 'bg-[#ec5b13]/10');
content = content.replace(/text-indigo-500/g, 'text-[#ec5b13]');

// Card
content = content.replace(
  /className="bg-\\[#1a1a1a\\] rounded-2xl border border-white\\/5 shadow-sm overflow-hidden"/g,
  \className="rounded-2xl overflow-hidden" style={{ background: "rgba(20,20,20,1)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}\
);

// Card Header
content = content.replace(
  /className="px-6 py-5 border-b border-white\\/5"/g,
  \className="px-6 py-5 border-b" style={{ borderColor: "rgba(236,91,19,0.1)" }}\
);

// Body background inside ProfileSettings:
content = content.replace(/className="min-h-screen bg-\\[#1a1a1a\\]/g, 'className="min-h-screen bg-[#121212]');

// Fix toast
content = content.replace(
  /className=\\{\\\ixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all(.*?)\[^}]+\\}/g,
  \className={\\\ixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border border-white/10 text-sm font-medium transition-all\\\} style={{ background: type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: type === "success" ? "#6ee7b7" : "#fca5a5" }}\
);

// Fix tabs container
content = content.replace(/className="flex gap-2 p-1.5 bg-\\[\\#1a1a1a\\] border border-white\\/5 rounded-2xl max-w-fit mb-8"/g, 'className="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl max-w-fit mb-8"');

// Fix active tab
content = content.replace(/bg-\\[#1a1a1a\\] text-slate-100 shadow-sm/g, 'bg-[#ec5b13] text-white shadow-sm');
content = content.replace(/text-slate-400 hover:text-slate-100 hover:bg-white\\/5/g, 'text-slate-400 hover:text-slate-200 hover:bg-white/5');

// Update avatar and cover wrappers
content = content.replace(/bg-\\[#1a1a1a\\]\\/20/g, 'bg-black/40');
content = content.replace(/border-white/g, 'border-[#121212]');

fs.writeFileSync(path, content);
console.log("Rewrote ProfileSettings.jsx for dark mode");
