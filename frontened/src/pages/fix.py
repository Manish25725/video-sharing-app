import re, codecs

with open('LiveStream.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = '''    };

    const streamer = streamInfo?.streamerId;
    const streamerName = streamer?.fullName || streamer?.userName || "Streamer";

    return ('''

code = re.sub(r'    \};\s+return \(', replacement, code)

with open('LiveStream.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("patched")
