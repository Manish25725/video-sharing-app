import PageLoader from '../components/PageLoader.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Bug, Lightbulb, FileText, User, Star,
  ArrowLeft, Send, CheckCircle, ChevronDown, Clock
} from 'lucide-react';
import apiClient from '../services/api.js';

const categories = [
  { value: 'bug',     label: 'Bug Report',        icon: Bug,         color: 'text-red-400 bg-red-500/10 border-red-500/20',     desc: 'Something is broken or not working correctly' },
  { value: 'feature', label: 'Feature Request',   icon: Lightbulb,   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Suggest a new feature or improvement' },
  { value: 'content', label: 'Content Issue',     icon: FileText,    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',   desc: 'Problem with a video, tweet or other content' },
  { value: 'account', label: 'Account Help',      icon: User,        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', desc: 'Login, account settings or profile issues' },
  { value: 'general', label: 'General Feedback',  icon: Star,        color: 'text-green-400 bg-green-500/10 border-green-500/20', desc: 'Share your thoughts or general comments' },
];

const myFeedbackStatuses = {
  pending:  { label: 'Pending',  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  reviewed: { label: 'Reviewed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  resolved: { label: 'Resolved', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
};

const catLabel = (value) => categories.find(c => c.value === value)?.label || value;

const Feedback = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('submit'); // 'submit' | 'history'
  const [step, setStep] = useState(1); // 1 = pick category, 2 = write message

  // Form state
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail]   = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  // History state
  const [history, setHistory]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded]   = useState(false);

  const loadHistory = async () => {
    if (historyLoaded) return;
    setHistoryLoading(true);
    try {
      const res = await apiClient.get('/feedback/my');
      setHistory(res.data || []);
      setHistoryLoaded(true);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'history') loadHistory();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!category)           return setError('Please select a category.');
    if (message.trim().length < 10) return setError('Message must be at least 10 characters.');

    try {
      setSubmitting(true);
      await apiClient.post('/feedback/submit', { category, message: message.trim(), email: email.trim() });
      setSubmitted(true);
      // reset for re-use
      setCategory('');
      setMessage('');
      setEmail('');
      setStep(1);
      setHistoryLoaded(false); // force history reload next time
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = categories.find(c => c.value === category);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1c120d] to-[#0a0a0a] border-b border-white/5 text-white">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#18110D]/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">Send Feedback</h1>
          </div>
          <p className="text-white/70 text-sm">
            Your feedback helps us improve. We read every submission.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 pb-12">
        {/* Tabs */}
        <div className="flex bg-[#18110D] rounded-xl border border-white/5 shadow-sm mb-6 p-1">
          {[
            { key: 'submit',  label: 'New Feedback' },
            { key: 'history', label: 'My Submissions' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-[#ec5b13] text-white shadow-sm'
                  : 'text-white/60 hover:text-white/90'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Submit tab ── */}
        {tab === 'submit' && (
          <>
            {submitted ? (
              /* Success state */
              <div className="bg-[#18110D] rounded-2xl border border-white/5 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Thank you!</h2>
                <p className="text-white/60 text-sm mb-6">
                  Your feedback has been submitted. We'll review it and get back to you if needed.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 bg-[#ec5b13] text-white text-sm font-medium rounded-full hover:bg-[#ec5b13]/80 transition-colors"
                  >
                    Submit more feedback
                  </button>
                  <button
                    onClick={() => handleTabChange('history')}
                    className="px-5 py-2.5 bg-gray-100 text-white/80 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
                  >
                    View my submissions
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#18110D] rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                {/* Step indicator */}
                <div className="flex border-b border-white/5">
                  {[{ n: 1, label: 'Category' }, { n: 2, label: 'Message' }].map(s => (
                    <div key={s.n} className={`flex-1 py-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${
                      step === s.n ? 'text-[#ec5b13] border-b-2 border-[#ec5b13]' : 'text-white/50'
                    }`}>
                      <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                        step > s.n ? 'bg-[#ec5b13]/20 text-[#ec5b13]' :
                        step === s.n ? 'bg-[#ec5b13] text-white' :
                        'bg-gray-100 text-white/50'
                      }`}>{s.n}</span>
                      {s.label}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  {/* Step 1: Category */}
                  {step === 1 && (
                    <div>
                      <p className="text-sm font-medium text-white/80 mb-4">What type of feedback are you sending?</p>
                      <div className="space-y-2">
                        {categories.map(cat => {
                          const Icon = cat.icon;
                          const isSelected = category === cat.value;
                          return (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => setCategory(cat.value)}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? `${cat.color} border-current`
                                  : 'border-white/5 bg-[#18110D] hover:border-white/10 hover:bg-[#0a0a0a]'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? cat.color : 'bg-gray-100 text-white/60'
                              }`}>
                                <Icon className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${isSelected ? '' : 'text-white/90'}`}>{cat.label}</p>
                                <p className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-white/50'}`}>{cat.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        disabled={!category}
                        onClick={() => setStep(2)}
                        className="mt-5 w-full py-3 bg-[#ec5b13] text-white text-sm font-medium rounded-xl hover:bg-[#ec5b13]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 2: Message */}
                  {step === 2 && (
                    <div>
                      {/* Selected category badge */}
                      {selectedCat && (
                        <div className="flex items-center justify-between mb-4">
                          <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border ${selectedCat.color}`}>
                            <selectedCat.icon className="w-3.5 h-3.5" />
                            {selectedCat.label}
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs text-white/50 hover:text-[#ec5b13] underline underline-offset-2"
                          >
                            Change
                          </button>
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-white/80 mb-1.5">
                          Your feedback <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          rows={5}
                          maxLength={2000}
                          placeholder="Describe the issue or share your thoughts in detail…"
                          className="w-full px-4 bg-[#111] text-white py-3 border border-white/10 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/30 focus:border-[#ec5b13] transition-colors"
                          autoFocus
                        />
                        <div className="flex justify-between mt-1">
                          {message.trim().length > 0 && message.trim().length < 10 && (
                            <p className="text-xs text-red-500">At least 10 characters required</p>
                          )}
                          <p className="text-xs text-white/50 ml-auto">{message.length}/2000</p>
                        </div>
                      </div>

                      <div className="mb-5">
                        <label className="block text-sm font-medium text-white/80 mb-1.5">
                          Email for follow-up <span className="text-white/50 font-normal">(optional)</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 bg-[#111] text-white py-2.5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec5b13]/30 focus:border-[#ec5b13] transition-colors"
                        />
                        <p className="text-xs text-white/50 mt-1">We'll only use this to follow up on your specific report.</p>
                      </div>

                      {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => { setStep(1); setError(''); }}
                          className="px-4 py-2.5 bg-gray-100 text-white/70 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || message.trim().length < 10}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#ec5b13] text-white text-sm font-medium rounded-xl hover:bg-[#ec5b13]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                            : <><Send className="w-4 h-4" /> Submit feedback</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          <div className="bg-[#18110D] rounded-2xl border border-white/5 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white text-sm">My Submissions</h2>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <PageLoader message="" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-white/60 text-sm">No submissions yet.</p>
                <button
                  onClick={() => setTab('submit')}
                  className="mt-3 text-sm text-[#ec5b13] hover:underline"
                >
                  Send your first feedback
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(item => {
                  const status = myFeedbackStatuses[item.status] || myFeedbackStatuses.pending;
                  return (
                    <div key={item._id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                          {catLabel(item.category)}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{item.message}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Help link */}
        <p className="text-center text-sm text-white/50 mt-6">
          Looking for answers?{' '}
          <button onClick={() => navigate('/help')} className="text-[#ec5b13] hover:underline font-medium">
            Visit the Help Centre
          </button>
        </p>
      </div>
    </div>
  );
};

export default Feedback;
