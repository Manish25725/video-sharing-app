const fs = require('fs');
let c = fs.readFileSync('D:/video_sharing_app/frontened/src/components/HeaderNew.jsx', 'utf8');
c = c.replace(/<div className="flex justify-between items-center px-4 md:px-6 h-16 w-full\s+gap-2">\s*\{mobileSearchOpen/, '{mobileSearchOpen');

// find if there's a missing </div> somewhere.
// actually wait, let me just rewrite the end
fs.writeFileSync('D:/video_sharing_app/frontened/src/components/HeaderNew.jsx', c);
console.log('Fixed');
