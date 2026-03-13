const fs = require('fs');
let content = fs.readFileSync('ScheduledStreams.jsx', 'utf8');

const replacement = <div onClick={() => !isOwn && setShowDetail(true)} className={\g-[#121212] rounded-2xl border border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow \\}>
        <div className="flex flex-col">
          {/* Thumbnail row */}
          <div className="relative w-full aspect-video bg-gray-800 max-h-48">;

content = content.replace(
  /<div\s*onClick=\{\(\) => !isOwn && setShowDetail\(true\)\}\s*className=\{g-\[#121212\] rounded-2xl border border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow \$\{!isOwn \? "cursor-pointer" : ""\}\}\s*>\s*<div className="flex gap-0">\s*\{\/\* Thumbnail column \*\/\}\s*<div className="relative w-36 flex-shrink-0 bg-gray-800">/g,
  replacement
);

content = content.replace(
  /\{\/\* Info column \*\/\}\s*<div className="flex-1 min-w-0 p-4 flex flex-col justify-between">/g,
  {/* Info column */}\n          <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
);

fs.writeFileSync('ScheduledStreams.jsx', content);
