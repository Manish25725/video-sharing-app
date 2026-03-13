const fs = require('fs');
let code = fs.readFileSync('LiveStream.jsx', 'utf8');
const replacement = const handleSaveRecording = async () => {
    setIsSaving(true);
    try {
        const { data } = await streamService.saveRecording(streamKey);
        setSavedVideoId(data.videoId);
    } catch (err) {
        console.error(err);
        alert('Failed to save recording.');
    } finally {
        setIsSaving(false);
    }
};

const handleEndStream = async () => {;
code = code.replace('const handleEndStream = async () => {', replacement);
fs.writeFileSync('LiveStream.jsx', code);
