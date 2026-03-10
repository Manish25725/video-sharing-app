import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { useAuth } from './AuthContext.jsx';

const translations = {
  en: {
    // Header / profile menu
    language: 'Language',
    location: 'Location',
    help: 'Help',
    sendFeedback: 'Send feedback',
    signOut: 'Sign out',
    switchAccount: 'Switch account',
    addAccount: 'Add account',
    yourChannel: 'Your channel',
    settings: 'Settings',
    // Language names
    english: 'English',
    hindi: 'हिंदी',
    // Sidebar
    home: 'Home',
    trending: 'Trending',
    subscriptions: 'Subscriptions',
    library: 'Library',
    history: 'History',
    watchLater: 'Watch Later',
    likedVideos: 'Liked Videos',
    playlists: 'Playlists',
    // Common
    search: 'Search',
    upload: 'Upload',
    noResults: 'No results found',
    loading: 'Loading...',
    subscribe: 'Subscribe',
    subscribed: 'Subscribed',
    views: 'views',
    // Settings
    account: 'Account',
    notifications: 'Notifications',
    privacy: 'Privacy',
    playback: 'Playback',
    saveChanges: 'Save Changes',
  },
  hi: {
    // Header / profile menu
    language: 'भाषा',
    location: 'स्थान',
    help: 'सहायता',
    sendFeedback: 'प्रतिक्रिया भेजें',
    signOut: 'साइन आउट',
    switchAccount: 'खाता बदलें',
    addAccount: 'खाता जोड़ें',
    yourChannel: 'आपका चैनल',
    settings: 'सेटिंग्स',
    // Language names
    english: 'English',
    hindi: 'हिंदी',
    // Sidebar
    home: 'होम',
    trending: 'ट्रेंडिंग',
    subscriptions: 'सदस्यताएं',
    library: 'लाइब्रेरी',
    history: 'इतिहास',
    watchLater: 'बाद में देखें',
    likedVideos: 'पसंद किए गए वीडियो',
    playlists: 'प्लेलिस्ट',
    // Common
    search: 'खोजें',
    upload: 'अपलोड',
    noResults: 'कोई परिणाम नहीं मिला',
    loading: 'लोड हो रहा है...',
    subscribe: 'सदस्यता लें',
    subscribed: 'सदस्यता ली',
    views: 'बार देखा गया',
    // Settings
    account: 'खाता',
    notifications: 'सूचनाएं',
    privacy: 'गोपनीयता',
    playback: 'प्लेबैक',
    saveChanges: 'बदलाव सहेजें',
  },
};

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState('en');

  // Sync with user preference on login/user change
  useEffect(() => {
    if (user?.language && ['en', 'hi'].includes(user.language)) {
      setLanguageState(user.language);
    }
  }, [user?.language]);

  const setLanguage = async (lang) => {
    if (!['en', 'hi'].includes(lang)) return;
    setLanguageState(lang);
    try {
      await authService.updateLanguage(lang);
    } catch {
      // Non-critical — UI already updated
    }
  };

  const t = (key) => translations[language]?.[key] ?? translations['en'][key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
