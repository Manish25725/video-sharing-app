const fs = require('fs');
let content = fs.readFileSync('ForgotPassword.jsx', 'utf8');

const handleResendInjection = 
  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/users/forgot-password", { email });
      if (res?.resetUrl) setDevResetUrl(res.resetUrl);
      alert("Reset link resent to your email.");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSent(false); // go back to form to show error properly if needed
    } finally {
      setLoading(false);
    }
  };
;

content = content.replace(
  /const handleSubmit = async \(e\) => \{/,
  handleResendInjection + '\n  const handleSubmit = async (e) => {'
);

const tryAgainButtonRegex = /<button\s+onClick=\{\(\) => \{\s*setSent\(false\);\s*setError\(""\);\s*\}\}\s+className="text-indigo-600 hover:underline font-medium"\s*>\s*try again\s*<\/button>/g;

content = content.replace(
  tryAgainButtonRegex,
  <button\n                  onClick={handleResend}\n                  disabled={loading}\n                  className="text-indigo-600 hover:underline font-medium disabled:opacity-50"\n                >\n                  {loading ? "sending..." : "resend link"}\n                </button>
);

fs.writeFileSync('ForgotPassword.jsx', content);
