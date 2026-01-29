import React, { useEffect, useState } from 'react';
import { DiscoveryItem } from '../types';
import { getDiscoveryFeed } from '../services/geminiService';

interface Props { isDarkMode: boolean; }

const DiscoveryFeed: React.FC<Props> = ({ isDarkMode }) => {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [groupSize, setGroupSize] = useState('2-4');
  const [cost, setCost] = useState('$$');
  const [type, setType] = useState('Active');

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const data = await getDiscoveryFeed();
        setItems(data);
      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchFeed();
  }, [groupSize, cost, type]);

  return (
    <div className="pb-24">
      {/* Sticky Header and Filters Area */}
      <div className={`sticky top-0 z-30 pt-8 pb-4 px-6 space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/95' : 'bg-[#FDFCFB]/95'} backdrop-blur-md`}>
        <header>
          <h1 className="text-4xl font-black tracking-tighter text-emerald-600">Discover</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Curated local experiences</p>
        </header>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          <div className="relative flex-shrink-0">
            <select 
              value={groupSize} 
              onChange={(e) => setGroupSize(e.target.value)}
              className={`pl-4 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border outline-none appearance-none transition-all active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-emerald-600 shadow-sm'}`}
            >
              <option>2-4 People</option>
              <option>5-8 People</option>
              <option>10+ People</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <select 
              value={cost} 
              onChange={(e) => setCost(e.target.value)}
              className={`pl-4 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border outline-none appearance-none transition-all active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-emerald-600 shadow-sm'}`}
            >
              <option value="$">$ Budget</option>
              <option value="$$">$$ Moderate</option>
              <option value="$$$">$$$ Luxury</option>
              <option value="FREE">Free Only</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className={`pl-4 pr-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border outline-none appearance-none transition-all active:scale-95 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-emerald-600 shadow-sm'}`}
            >
              <option>Active</option>
              <option>Food/Drink</option>
              <option>Wellness</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Feed Area */}
      <div className="px-6 relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-x-0 top-0 pt-20 flex flex-col items-center justify-start z-10 bg-inherit/50 backdrop-blur-[2px] h-full">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-[9px] mt-4">Finding experiences...</p>
          </div>
        )}

        <div className={`space-y-8 mt-4 transition-opacity duration-300 ${loading ? 'opacity-30 pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
          {items.map((item, idx) => {
            const displayCost = cost === 'FREE' ? 'FREE' : (idx % 3 === 0 ? '$$$' : idx % 2 === 0 ? '$$' : '$');
            const isFree = displayCost === 'FREE';

            return (
              <div key={item.id} className={`relative overflow-hidden rounded-[2.5rem] border shadow-xl transform transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="aspect-[3/4] relative">
                  <img src={item.image} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-600/90 backdrop-blur px-3 py-1.5 rounded-xl">
                        {item.category}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur ${isFree ? 'bg-yellow-500 text-black' : 'bg-white/20'}`}>
                        {displayCost}
                      </span>
                      {item.isAd && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600/90 backdrop-blur px-3 py-1.5 rounded-xl">
                          Sponsored
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black mb-2 leading-tight tracking-tight">{item.title}</h3>
                    <p className="text-sm text-slate-300 font-medium line-clamp-2 opacity-90 leading-relaxed mb-6">{item.description}</p>
                    
                    <button className="w-full py-4 bg-white text-black rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-transform flex items-center justify-center space-x-2">
                      <span>View Experience</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryFeed;