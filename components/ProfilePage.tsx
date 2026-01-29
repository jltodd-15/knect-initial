import React, { useState } from 'react';

interface Props {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<Props> = ({ isDarkMode, toggleDarkMode, onLogout }) => {
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interests, setInterests] = useState(['Hiking', 'Techno', 'Brunch']);
  const [newInterest, setNewInterest] = useState('');

  const addInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest]);
      setNewInterest('');
      setShowInterestModal(false);
    }
  };

  return (
    <div className="p-6 space-y-10 pb-20">
      {showInterestModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className={`w-full sm:max-w-xs rounded-t-[2.5rem] sm:rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-300 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Add Interests</h3>
              <button onClick={() => setShowInterestModal(false)} className="text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="space-y-4">
              <input 
                autoFocus
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                placeholder="WHAT DO YOU LOVE?"
                className={`w-full p-5 rounded-[1.5rem] border-none outline-none text-lg font-bold ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-[#F3F4F6] text-emerald-600'}`}
              />
              <button onClick={addInterest} className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Save Interest</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col items-center text-center mt-12">
        <div className="relative">
          <img src="https://picsum.photos/seed/knect-me/300" className="w-40 h-40 rounded-full object-cover shadow-2xl border-8 border-white dark:border-slate-800" alt="Profile" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800">✨</div>
        </div>
        <h2 className="mt-8 text-4xl font-black tracking-tighter text-emerald-600">Alex Rivera</h2>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Digital Nomad • SF</p>
      </header>

      <div className="space-y-8">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">PRIVACY & APP</h3>
        <div className={`p-1.5 rounded-[2rem] ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900'} shadow-lg`}>
          <div className="flex items-center justify-between p-6 bg-transparent">
            <div className="flex items-center space-x-4">
              <span className="font-black text-[11px] uppercase tracking-widest text-white">Dark Mode Interface</span>
            </div>
            <button onClick={toggleDarkMode} className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-500'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isDarkMode ? 'left-8' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-6">
            <p className={`font-black text-[10px] uppercase tracking-widest text-slate-400`}>Interests</p>
            <button onClick={() => setShowInterestModal(true)} className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.15em]">+ Add New</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {interests.map(i => (
              <span key={i} className="px-6 py-3 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button onClick={onLogout} className="w-full py-6 text-red-500 font-black uppercase tracking-[0.3em] text-[10px] opacity-40 hover:opacity-100 transition-all">Log out of Knect</button>
    </div>
  );
};

export default ProfilePage;