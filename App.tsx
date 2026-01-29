import React, { useState, useEffect } from 'react';
import { AppTab } from './types';
import Navigation from './components/Navigation';
import DiscoveryFeed from './components/DiscoveryFeed';
import EventPlanner from './components/EventPlanner';
import SocialDashboard from './components/SocialDashboard';
import ProfilePage from './components/ProfilePage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PLANNER);
  const [isAuth, setIsAuth] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (!isAuth) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#FDFCFB] text-slate-900'} flex flex-col items-center justify-center p-6 transition-colors duration-300`}>
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-emerald-600 rounded-[1.5rem] mx-auto flex items-center justify-center shadow-xl mb-6">
              <svg viewBox="0 0 100 100" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
                <path d="M30 20 V80" />
                <path d="M30 50 L70 20" />
                <path d="M45 50 Q60 65 70 80" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Knect</h1>
            <p className="text-slate-500 font-medium">Plan smarter. Connect deeper.</p>
          </div>

          <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#F3F4F6] border-transparent'} p-8 rounded-[2.5rem] shadow-sm border space-y-6 transition-colors`}>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                className={`w-full p-4 rounded-2xl outline-none transition-all ${isDarkMode ? 'bg-slate-800 focus:ring-emerald-500' : 'bg-white focus:ring-emerald-600'}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className={`w-full p-4 rounded-2xl outline-none transition-all ${isDarkMode ? 'bg-slate-800 focus:ring-emerald-500' : 'bg-white focus:ring-emerald-600'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={() => setIsAuth(true)}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#FDFCFB] text-slate-900'}`}>
      <main className="max-w-md mx-auto min-h-screen relative animate-in fade-in duration-500 pb-20">
        {activeTab === AppTab.PLANNER && <EventPlanner isDarkMode={isDarkMode} />}
        {activeTab === AppTab.FEED && <DiscoveryFeed isDarkMode={isDarkMode} />}
        {activeTab === AppTab.SOCIAL && <SocialDashboard isDarkMode={isDarkMode} />}
        {activeTab === AppTab.PROFILE && <ProfilePage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onLogout={() => setIsAuth(false)} />}
      </main>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />
    </div>
  );
};

export default App;