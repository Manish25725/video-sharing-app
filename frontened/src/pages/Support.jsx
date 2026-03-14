import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, ShieldAlert, ArrowLeft } from 'lucide-react';

/* Dark glass input style */
const inputStyle = {
  base: {
    height: '48px',
    width: '100%',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(18,10,6,0.5)',
    padding: '0 16px',
    fontSize: '14px',
    color: '#e2e8f0',
    outline: 'none',
    transition: 'all 0.2s',
  },
  textarea: {
    minHeight: '120px',
    width: '100%',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(18,10,6,0.5)',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#e2e8f0',
    outline: 'none',
    transition: 'all 0.2s',
    resize: 'vertical'
  }
};

const DarkInput = ({ hasError, multiline, ...props }) => {
  const baseStyle = multiline ? inputStyle.textarea : inputStyle.base;
  const Component = multiline ? 'textarea' : 'input';
  
  return (
    <Component
      {...props}
      style={{
        ...baseStyle,
        borderColor: hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)',
      }}
      onFocus={e => {
        e.target.style.borderColor = hasError ? 'rgba(239,68,68,0.7)' : 'rgba(236,91,19,0.55)';
        e.target.style.boxShadow = hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(236,91,19,0.1)';
        e.target.style.background = 'rgba(30,15,5,0.8)';
      }}
      onBlur={e => {
        e.target.style.borderColor = hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)';
        e.target.style.boxShadow = 'none';
        e.target.style.background = 'rgba(18,10,6,0.5)';
      }}
    />
  );
};

const Support = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // 'submitting', 'success', 'error'

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus(null), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a', fontFamily: "'Public Sans', sans-serif" }}>
      {/* Page header */}
      <header
        className="flex items-center justify-between px-6 py-4 lg:px-16 sticky top-0 z-50 border-b"
        style={{ background: 'rgba(28,18,13,0.7)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#ec5b13 0%,#8b5cf6 100%)', boxShadow: '0 4px 16px rgba(236,91,19,0.3)' }}
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 48 48"><path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"/></svg>
            </div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ background: 'linear-gradient(90deg,#fff 40%,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              PlayVibe
            </h1>
          </Link>
        </div>
        <Link to="/login" className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: '#ec5b13' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fb923c'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#ec5b13'; }}>
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-6 py-12">
        <div className="w-full max-w-[800px] flex flex-col md:flex-row gap-8">
          
          {/* Informational Section */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Support Center</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Having issues? We are here to help. Reach out to our support team and get back to enjoying your favorite content.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-4 p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(236,91,19,0.1)' }}>
                  <Mail className="w-5 h-5" style={{ color: '#ec5b13' }} />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Email Us</h3>
                  <p className="text-slate-500 text-xs mt-1">support@playvibe.app</p>
                  <p className="text-slate-500 text-xs">We reply within 24 hours.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                  <ShieldAlert className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Report Abuse</h3>
                  <p className="text-slate-500 text-xs mt-1">Found something inappropriate?</p>
                  <p className="text-slate-500 text-xs">Select "Report Abuse" in the subject.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div
            className="flex-1 rounded-2xl border p-8 space-y-6"
            style={{ background: 'rgba(28,18,13,0.7)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}
          >
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Send a message</h2>
              <p className="text-slate-500 mt-1 text-sm">Fill in your details below.</p>
            </div>

            {status === 'success' && (
              <div className="p-3.5 rounded-xl text-sm flex items-center gap-2 border"
                style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                ✓ Message sent successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Name</label>
                <DarkInput
                  type="text" placeholder="Your name" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Email</label>
                <DarkInput
                  type="email" placeholder="name@example.com" required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Subject</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    required
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    style={{
                      ...inputStyle.base,
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(236,91,19,0.55)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(236,91,19,0.1)';
                      e.target.style.background = 'rgba(30,15,5,0.8)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.07)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(18,10,6,0.5)';
                    }}
                  >
                    <option value="" disabled style={{ color: '#64748b' }}>Select a topic</option>
                    <option value="login" style={{ background: '#1c120d' }}>Login / Account Issues</option>
                    <option value="billing" style={{ background: '#1c120d' }}>Billing</option>
                    <option value="tech" style={{ background: '#1c120d' }}>Technical Support</option>
                    <option value="abuse" style={{ background: '#1c120d' }}>Report Abuse</option>
                    <option value="other" style={{ background: '#1c120d' }}>Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }}>
                    ▼
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-slate-300 ml-1">Message</label>
                <DarkInput
                  multiline required
                  placeholder="How can we help?"
                  value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-2 w-full h-12 flex items-center justify-center rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#ec5b13', boxShadow: '0 4px 16px rgba(236,91,19,0.3)' }}
                onMouseEnter={e => { if (status !== 'submitting') e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;