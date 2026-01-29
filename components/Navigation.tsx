import React from 'react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isDarkMode: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, isDarkMode }) => {
  const tabs = [
    { 
      id: AppTab.PLANNER, 
      label: 'Plan', 
      icon: (color: string) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10"></path><path d="M3 10h18"></path><path d="M8 2v4"></path><path d="M16 2v4"></path><path d="m22 22-3-3"></path><path d="M15 19a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"></path></svg>
      )
    },
    { 
      id: AppTab.FEED, 
      label: 'Discover', 
      icon: (color: string) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
      )
    },
    { 
      id: AppTab.SOCIAL, 
      label: 'Circle', 
      icon: (color: string) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      )
    },
    { 
      id: AppTab.PROFILE, 
      label: 'Profile', 
      icon: (color: string) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 border-t safe-bottom z-50 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-500 backdrop-blur-xl' : 'bg-white/80 border-slate-100 text-slate-400 backdrop-blur-xl'}`}>
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const color = isActive ? (isDarkMode ? '#10b981' : '#059669') : (isDarkMode ? '#475569' : '#cbd5e1');
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-90"
            >
              <div className={`mb-1.5 transition-transform duration-300 ${isActive ? 'scale-110 translate-y-[-2px]' : ''}`}>
                {tab.icon(color)}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? (isDarkMode ? 'text-emerald-500' : 'text-emerald-600') : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;