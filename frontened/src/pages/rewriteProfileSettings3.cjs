const fs = require('fs');
const path = 'd:/video_sharing_app/frontened/src/pages/ProfileSettings.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix text area remaining indigo
content = content.replace(/border-white\/10 rounded-xl text-sm text-slate-100 bg-black\/20 focus:bg-black\/40 focus:outline-none focus:ring-2 focus:ring-indigo-500\/30 focus:border-\[#ec5b13\] transition-all resize-none/g, 'border-white/10 rounded-xl text-sm text-slate-100 bg-black/20 focus:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/30 focus:border-[#ec5b13] transition-all resize-none');

content = content.replace(/border-\[#202020\]\/10/g, 'border-white/10');
content = content.replace(/bg-\[#1a1a1a\]\/5/g, 'bg-black/20');
content = content.replace(/focus:bg-\[#1a1a1a\]/g, 'focus:bg-black/40');
content = content.replace(/focus:ring-indigo-500\/30/g, 'focus:ring-[#ec5b13]/30');

// Fix buttons
content = content.replace(/bg-gradient-to-r\s+from-indigo-600\s+to-indigo-700\s+hover:from-indigo-700\s+hover:to-indigo-800/g, 'bg-[#ec5b13] hover:bg-[#d44d0f]');
content = content.replace(/bg-gradient-to-r\s+from-red-600\s+to-red-700\s+hover:from-red-700\s+hover:to-red-800/g, 'bg-red-600 hover:bg-red-700');

content = content.replace(/border-t-indigo-500/g, 'border-t-white');

// Fix sidebar menu item
content = content.replace(/text-indigo-700\s+border-l-2\s+border-l-indigo-600/g, 'text-[#ec5b13] border-l-2 border-l-[#ec5b13]');
content = content.replace(/hover:text-slate-100\s+hover:bg-black\/20/g, 'hover:text-slate-100 hover:bg-white/5');

// Find and fix other classes
content = content.replace(/border-white\/5\s+shadow-sm\s+overflow-hidden"/g, 'border-white/5 overflow-hidden"');

fs.writeFileSync(path, content);
console.log("Rewrite 3 done!");