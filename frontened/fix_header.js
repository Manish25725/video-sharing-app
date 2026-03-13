const fs = require('fs');

let code = fs.readFileSync('D:/video_sharing_app/frontened/src/components/HeaderNew.jsx', 'utf8');

if (!code.includes('const [mobileSearchOpen, setMobileSearchOpen]')) {
    code = code.replace('const [searchQuery, setSearchQuery] = useState(', 'const [mobileSearchOpen, setMobileSearchOpen] = useState(false);\n  const [searchQuery, setSearchQuery] = useState(');
}

const leftLogoMarker = '{/* ── Left: hamburger + logo ── */}';
const mobileSearchUI = `
      {mobileSearchOpen ? (
        <div className="flex items-center px-4 h-16 w-full gap-3 md:hidden">
          <button onClick={() => setMobileSearchOpen(false)} className="text-slate-400 p-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center h-10 rounded-full px-4" style={{background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)"}}>
            <input 
              type="text" 
              autoFocus 
              className="flex-1 bg-transparent text-white outline-none text-sm placeholder-slate-400" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              onKeyDown={handleSearchKeyDown} 
            />
            <button onClick={() => { handleSearch(); setMobileSearchOpen(false); }}>
              <Search className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      ) : (
        <>
        {/* ── Left: hamburger + logo ── */}`;

if (code.includes(leftLogoMarker) && !code.includes('mobileSearchOpen ?')) {
    code = code.replace(leftLogoMarker, mobileSearchUI);
}

const oldLink = `{/* Mobile search icon */}
          <Link
            to="/search"
            title="Search"
            className="w-9 h-9 md:hidden flex items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,91,19,0.14)"; e.currentTarget.style.color = "#ec5b13"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
          >
            <Search className="w-5 h-5" />
          </Link>`;

const newBtn = `{/* Mobile search icon */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            title="Search"
            className="w-9 h-9 md:hidden flex items-center justify-center rounded-xl transition-all duration-200"
            style={{ color: "#64748b" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,91,19,0.14)"; e.currentTarget.style.color = "#ec5b13"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
          >
            <Search className="w-5 h-5" />
          </button>`;

code = code.replace(oldLink, newBtn);

const theEndMarker = '</div>\n    </header>';
const newEndMarker = '</div>\n        </>\n      )}\n    </header>';
if (code.includes(theEndMarker) && !code.includes('</>\n      )}\n    </header>')) {
  code = code.replace(theEndMarker, newEndMarker);
}

fs.writeFileSync('D:/video_sharing_app/frontened/src/components/HeaderNew.jsx', code);
console.log('Fixed HeaderNew.jsx');
