import { useState, useEffect } from "react"
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Monitor, 
  Volume2, 
  Smartphone,
  Wifi,
  HardDrive
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api.js"

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState("account")
  const [notifSaving, setNotifSaving] = useState(null)
  const [settings, setSettings] = useState({
    notifications: {
      subscriptions: false,
      recommendations: false,
      comments: false,
      mentions: false,
      email: false
    },
    privacy: {
      watchHistory: true,
      searchHistory: true,
      subscriptionList: false,
      savedPlaylists: true
    },
    playback: {
      autoplay: true,
      quality: "1080p",
      volume: 75,
      subtitles: false,
      annotations: true
    }
  })

  // Sync notification settings from the logged-in user's profile
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          subscriptions: user.notifyOnVideo || false,
          recommendations: user.notifyOnPost || false,
          comments: user.notifyOnComment || false,
          mentions: user.notifyOnMention || false,
          email: user.notifyOnEmail || false,
        }
      }))
    }
  }, [user])

  const handleToggle = async (category, setting) => {
    if (category === 'notifications') {
      // Map UI keys to backend endpoints
      const endpointMap = {
        subscriptions: '/users/toggle-notify-video',
        recommendations: '/users/toggle-notify-post',
        comments: '/users/toggle-notify-comment',
        mentions: '/users/toggle-notify-mention',
        email: '/users/toggle-notify-email',
      }
      const endpoint = endpointMap[setting]
      if (endpoint) {
        setNotifSaving(setting)
        try {
          const response = await api.post(endpoint)
          if (response?.data?.data) {
            // Update auth context user so other components stay in sync
            updateUser(response.data.data)
          }
          setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [setting]: !prev.notifications[setting] }
          }))
        } catch (err) {
          console.error('Failed to update notification setting:', err)
        } finally {
          setNotifSaving(null)
        }
        return
      }
    }
    // Local-only toggle for settings with no backend counterpart
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }))
  }

  const handleSliderChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
  }

  const renderAccountSettings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
      
      <div className="space-y-6">
        <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{user?.fullName || 'User'}</h3>
            <p className="text-gray-500">{user?.email || ''}</p>
            <p className="text-sm text-gray-400">@{user?.userName || ''}</p>
          </div>
          <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
            Edit Profile
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              defaultValue={user?.fullName || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel Description
            </label>
            <textarea
              rows={3}
              defaultValue="Welcome to my channel! I create content about technology, coding, and digital creativity."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country/Region
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h3>
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => {
              const isSaving = notifSaving === key
              const descriptions = {
                subscriptions: 'Get notified when channels you subscribe to upload new videos',
                recommendations: 'Get notified when subscribed channels post new tweets',
                comments: 'Get notified about comments on your videos',
                mentions: 'Get notified when someone mentions you',
                email: 'Receive email notifications',
              }
              return (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="text-sm text-gray-500">{descriptions[key]}</p>
                  </div>
                  <button
                    onClick={() => handleToggle('notifications', key)}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-200'
                    } ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
          <div className="space-y-4">
            {Object.entries(settings.privacy).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {key === 'watchHistory' && 'Keep track of videos you\'ve watched'}
                    {key === 'searchHistory' && 'Save your search queries for better recommendations'}
                    {key === 'subscriptionList' && 'Make your subscription list public'}
                    {key === 'savedPlaylists' && 'Make your saved playlists public'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('privacy', key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPlaybackSettings = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Playback Settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Autoplay</p>
              <p className="text-sm text-gray-500">Automatically play the next video</p>
            </div>
            <button
              onClick={() => handleToggle('playback', 'autoplay')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.playback.autoplay ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.playback.autoplay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Default Video Quality</p>
              <span className="text-sm text-gray-500">{settings.playback.quality}</span>
            </div>
            <select 
              value={settings.playback.quality}
              onChange={(e) => handleSliderChange('playback', 'quality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="144p">144p</option>
              <option value="240p">240p</option>
              <option value="360p">360p</option>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="1440p">1440p</option>
              <option value="2160p">4K</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Default Volume</p>
              <span className="text-sm text-gray-500">{settings.playback.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.playback.volume}
              onChange={(e) => handleSliderChange('playback', 'volume', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Subtitles</p>
              <p className="text-sm text-gray-500">Show subtitles by default</p>
            </div>
            <button
              onClick={() => handleToggle('playback', 'subtitles')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.playback.subtitles ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.playback.subtitles ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'playback', label: 'Playback', icon: Monitor },
  ]

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "account" && renderAccountSettings()}
      {activeTab === "notifications" && renderNotificationSettings()}
      {activeTab === "privacy" && renderPrivacySettings()}
      {activeTab === "playback" && renderPlaybackSettings()}
    </div>
  )
}

export default Settings
