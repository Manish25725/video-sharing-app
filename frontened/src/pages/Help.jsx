import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare,
  Video, User, Bell, Shield, CreditCard, Wifi, ArrowLeft,
  ExternalLink
} from 'lucide-react';

const faqs = [
  {
    category: 'Account',
    icon: User,
    color: 'text-[#ec5b13] bg-blue-500/10',
    questions: [
      {
        q: 'How do I change my profile picture or cover image?',
        a: 'Go to Profile Settings from your account menu (top right). Under the "Profile" section, click on your avatar or cover image to upload a new one. Images are automatically cropped and saved to your profile.'
      },
      {
        q: 'How do I change my password?',
        a: 'Navigate to Profile Settings → Security tab. Click "Change password", enter your current password followed by your new password and confirm it. You will be prompted to log in again after the change.'
      },
      {
        q: 'Can I have multiple accounts?',
        a: 'Yes. Click your avatar in the top-right corner, then "Add account". You can switch between accounts without logging out using the account switcher in the same menu.'
      },
      {
        q: 'How do I delete my account?',
        a: 'Account deletion is currently handled by our support team to protect against accidental deletion. Please send feedback with category "Account" and include your request. We will process it within 48 hours.'
      },
    ]
  },
  {
    category: 'Videos',
    icon: Video,
    color: 'text-red-400 bg-red-500/10',
    questions: [
      {
        q: 'How do I upload a video?',
        a: 'Click the camera/upload icon in the top header, or navigate to My Channel → Upload. Supported formats include MP4, MOV, AVI and WebM. Maximum file size is 2 GB. Add a title, description, thumbnail and tags before publishing.'
      },
      {
        q: 'Why is my video processing taking so long?',
        a: 'Video processing time depends on the file size and your internet connection. Larger files (1 GB+) can take up to 10 minutes to fully process. The video will show as "Processing" in your channel until it is ready.'
      },
      {
        q: 'How do I add a video to a playlist?',
        a: 'While watching a video, click the "Save" or "Add to playlist" button below the player. You can select an existing playlist or create a new one. You can also manage playlists directly from the Playlists page in the sidebar.'
      },
      {
        q: 'Can I download videos?',
        a: 'Yes. Click the download icon on any video you have in your library. Downloads are available in the Downloads section of the sidebar. Note that downloading is only available for videos the uploader has allowed for download.'
      },
    ]
  },
  {
    category: 'Live Streaming',
    icon: Wifi,
    color: 'text-green-600 bg-green-50',
    questions: [
      {
        q: 'How do I go live?',
        a: 'Click the stream icon in the top header, then "Go Live". Set a title for your stream and click "Start Streaming". You will receive an RTMP URL and stream key to enter into OBS Studio or any compatible streaming software.'
      },
      {
        q: 'How do I schedule a live stream?',
        a: 'From the Go Live page, switch to the "Schedule" tab. Fill in the stream title, description and the date/time you plan to go live. Your subscribers who have notifications enabled will be notified automatically.'
      },
      {
        q: 'What streaming software is supported?',
        a: 'We support any RTMP-compatible streaming software. OBS Studio (free, recommended), Streamlabs OBS, XSplit and similar tools all work. Set your output to Custom RTMP and paste in the provided server URL and stream key.'
      },
    ]
  },
  {
    category: 'Notifications',
    icon: Bell,
    color: 'text-yellow-400 bg-yellow-500/10',
    questions: [
      {
        q: 'How do I turn on notifications for a channel?',
        a: 'Subscribe to the channel (if you haven\'t already), then click the bell icon next to the Subscribe button. You can choose to be notified about videos, tweets, and live streams individually from the notification settings dropdown.'
      },
      {
        q: 'How do I manage my notification preferences?',
        a: 'Go to Settings → Notifications. You can control global toggles for videos, tweets, live streams, comments and mentions. Per-channel notification settings are managed via the bell icon on each channel\'s profile.'
      },
      {
        q: 'Why am I not receiving notifications?',
        a: 'Check that: (1) you are subscribed to the channel, (2) the per-channel bell is enabled, (3) the relevant notification type is enabled in Settings → Notifications, and (4) your browser allows notifications from this site.'
      },
    ]
  },
  {
    category: 'Privacy & Safety',
    icon: Shield,
    color: 'text-purple-400 bg-purple-500/10',
    questions: [
      {
        q: 'How do I report a video or comment?',
        a: 'Click the three-dot (⋯) menu on any video or comment and select "Report". Choose the appropriate reason from the list and optionally add a description. Reports are reviewed by our moderation team within 24 hours.'
      },
      {
        q: 'How do I make my videos private?',
        a: 'When uploading, set the visibility to "Private" or "Unlisted". Private videos are only visible to you. Unlisted videos can be seen by anyone with the direct link but won\'t appear in search results or your channel page.'
      },
      {
        q: 'How is my data used?',
        a: 'Your data is used solely to provide and improve the platform. We do not sell personal data to third parties. Watch history, likes, and subscriptions are stored to personalise your experience. You can clear your watch history at any time from the Settings page.'
      },
    ]
  },
];

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-white/5 last:border-0 transition-colors ${open ? 'bg-white/5' : ''}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`text-sm font-medium leading-relaxed ${open ? 'text-[#ec5b13]' : 'text-white/90'}`}>
          {question}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#ec5b13]/80 flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-white/70 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const Help = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      !search || q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => (activeCategory === 'all' || cat.category === activeCategory) && cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1c120d] to-[#0a0a0a] border-b border-white/5 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#18110D]/20 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">Help Centre</h1>
          </div>
          <p className="text-white/80 mb-8">Find answers to common questions about using the platform.</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for answers…"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white/90 bg-[#18110D] shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-[#ec5b13] text-white'
                : 'bg-[#18110D] border border-white/10 text-white/70 hover:border-indigo-300 hover:text-[#ec5b13]'
            }`}
          >
            All topics
          </button>
          {faqs.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.category
                    ? 'bg-[#ec5b13] text-white'
                    : 'bg-[#18110D] border border-white/10 text-white/70 hover:border-indigo-300 hover:text-[#ec5b13]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.category}
              </button>
            );
          })}
        </div>

        {/* FAQ sections */}
        {filtered.length === 0 ? (
          <div className="bg-[#18110D] rounded-2xl border border-white/5 p-12 text-center">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-white/60 font-medium">No results found for "{search}"</p>
            <p className="text-white/50 text-sm mt-1">Try a different search term or browse all topics.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(cat => {
              const Icon = cat.icon;
              return (
                <div key={cat.category} className="bg-[#18110D] rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="font-semibold text-white">{cat.category}</h2>
                  </div>
                  {cat.questions.map((item, i) => (
                    <FAQItem key={i} question={item.q} answer={item.a} />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Still need help? */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 text-center">
          <MessageSquare className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-semibold text-white mb-1">Still need help?</h3>
          <p className="text-white/60 text-sm mb-4">
            Can't find the answer you're looking for? Send us feedback and we'll get back to you.
          </p>
          <button
            onClick={() => navigate('/feedback')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ec5b13] text-white text-sm font-medium rounded-full hover:bg-[#ec5b13]/80 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;
