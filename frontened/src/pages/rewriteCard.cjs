
const fs = require('fs');
let code = fs.readFileSync('ScheduledStreams.jsx', 'utf8');

const regex = /const StreamCard =.*?return \(\s*<>\s*<div.*?\/>\s*\n\s*\}\)\}\s*<\/div>/s;

// We will just do a standard file read and replace but use index manually for precision.

