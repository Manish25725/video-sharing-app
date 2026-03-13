const fs = require('fs');
let code = fs.readFileSync('LiveStream.jsx', 'utf8');
const replacement = "const handleSaveRecording = async () => {\n" +
"    setIsSaving(true);\n" +
"    try {\n" +
"        const { data } = await streamService.saveRecording(streamKey);\n" +
"        setSavedVideoId(data.videoId);\n" +
"    } catch (err) {\n" +
"        console.error(err);\n" +
"        alert('Failed to save recording.');\n" +
"    } finally {\n" +
"        setIsSaving(false);\n" +
"    }\n" +
"};\n\nconst handleEndStream = async () => {";
code = code.replace("const handleEndStream = async () => {", replacement);
fs.writeFileSync('LiveStream.jsx', code);
