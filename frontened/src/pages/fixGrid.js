
const fs = require('fs');
let code = fs.readFileSync('ScheduledStreams.jsx', 'utf8');

code = code.replace(/className="space-y-3"/g, 'className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"');
code = code.replace(/className="max-w-2xl mx-auto"/g, 'className="max-w-7xl mx-auto"');

fs.writeFileSync('ScheduledStreams.jsx', code);

