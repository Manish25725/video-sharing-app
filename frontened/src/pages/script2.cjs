const fs = require('fs');
let content = fs.readFileSync('ScheduledStreams.jsx', 'utf8');

// Inject autoSave state into ScheduleForm
content = content.replace(
  /const \[form, setForm\] = useState\(\{ title: "", description: "", scheduledAt: "" \}\);/g,
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "" });\n  const [autoSave, setAutoSave] = useState(false);
);

// Include autoSave in fd.append in handleSubmit
content = content.replace(
  /fd\.append\("scheduledAt", new Date\(form\.scheduledAt\)\.toISOString\(\)\);/g,
  d.append("scheduledAt", new Date(form.scheduledAt).toISOString());\n      fd.append("autoSave", String(autoSave));
);

// Update ScheduleForm render to include the autoSave checkbox before the submission button
const checkboxHtml = 
          {/* Auto Save Toggle */}
          <div className="mb-6 flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-indigo-300">Save Stream as Video</p>
              <p className="text-xs text-indigo-400/70 mt-0.5">Automatically publish this stream to your channel after it ends</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
;

content = content.replace(
  /<button type="submit" disabled=\{loading\}/g,
  checkboxHtml + '\n          <button type="submit" disabled={loading}'
);

// Now, update handleGetKey to include stream.autoSave
content = content.replace(
  /fd\.append\("description", stream\.description \|\| ""\);/g,
  d.append("description", stream.description || "");\n        fd.append("autoSave", String(stream.autoSave === true));
);

fs.writeFileSync('ScheduledStreams.jsx', content);
