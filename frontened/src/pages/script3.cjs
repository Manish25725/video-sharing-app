const fs = require('fs');
let content = fs.readFileSync('ScheduledStreams.jsx', 'utf8');

content = content.replace(
  /fd\.append\("autoSave", String\((?:stream\.)?autoSave(?: === true)?\)\);/g,
  function(match) {
    if (match.includes("stream.autoSave")) {
      return 'fd.append("saveRecording", String(stream.autoSave === true));';
    } else {
      return 'fd.append("autoSave", String(autoSave));'; // Or whatever it originally was, wait let's just do it directly.
    }
  }
);

content = content.replace('fd.append("autoSave", String(stream.autoSave === true));', 'fd.append("saveRecording", String(stream.autoSave === true));');

fs.writeFileSync('ScheduledStreams.jsx', content);
