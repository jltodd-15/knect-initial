import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TimeWindow, CalendarEvent } from '../types';
import { getSmartSchedulingSuggestions } from '../services/geminiService';

interface Props { isDarkMode: boolean; }

interface Friend {
  id: string;
  name: string;
  avatar: string;
}

const EventPlanner: React.FC<Props> = ({ isDarkMode }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [suggestions, setSuggestions] = useState<TimeWindow[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow | null>(null);
  
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreate) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    } else {
      // Reset flow when modal closes
      setSuggestions([]);
      setSelectedWindow(null);
    }
  }, [showCreate]);

  const availableFriends: Friend[] = [
    { id: 'sarah', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: 'marcus', name: 'Marcus', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
    { id: 'elena', name: 'Elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
    { id: 'david', name: 'David', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  ];
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Coffee with Mom', date: 13, type: 'coffee', participants: [], location: 'Starbucks' },
    { id: '2', title: 'Work Sync', date: 15, type: 'busy', participants: [] }
  ]);

  const monthDates = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: firstDay }, () => null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, []);

  const weekDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        num: d.getDate(),
        hasEvent: myEvents.some(e => e.date === d.getDate())
      };
    });
  }, [myEvents]);

  const activeEvents = useMemo(() => 
    myEvents.filter(e => e.date === selectedDate),
  [myEvents, selectedDate]);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    setMyEvents(prev => [
      ...prev,
      { id: 'google-1', title: 'Google Sync: Team Lunch', date: 18, type: 'busy', participants: [] },
      { id: 'google-2', title: 'Google Sync: Dentist', date: 20, type: 'busy', participants: [] }
    ]);
    setIsSyncing(false);
  };

  const handleFetchAvailability = async () => {
    if (!title) return;
    setLoading(true);
    try {
      const groupSize = selectedFriends.length + 1;
      const times = await getSmartSchedulingSuggestions(title, 'event', groupSize);
      setSuggestions(times);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSendInvite = () => {
    if (!selectedWindow || !title) return;
    
    // In a real app, we'd use the selectedWindow.start date
    // For this demo, we use the selectedDate from the planner view
    setMyEvents(prev => [...prev, { 
      id: Math.random().toString(), 
      title, 
      date: selectedDate, 
      type: 'event', 
      location: location || 'TBD',
      participants: selectedFriends 
    }]);
    
    setShowCreate(false);
    setTitle('');
    setLocation('');
    setSelectedFriends([]);
    setSuggestions([]);
    setSelectedWindow(null);
  };

  return (
    <div className="pt-4 pb-12 relative min-h-screen">
      {/* Creation Modal */}
      <div className={`fixed inset-0 z-[60] flex flex-col transition-all duration-300 transform ${showCreate ? 'translate-y-0' : 'translate-y-full'} ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#FDFCFB] text-slate-900'}`}>
        <div className={`flex items-center px-6 py-5 sticky top-0 z-10 ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'} backdrop-blur-xl border-b shadow-sm`}>
          <button onClick={() => setShowCreate(false)} className="text-emerald-600 p-1 active:opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 text-center pr-8">
            <h2 className="text-[17px] font-black tracking-tighter uppercase text-slate-900 dark:text-white">New Invitation</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-8 pt-8 pb-32 no-scrollbar px-6">
          {!suggestions.length ? (
            <>
              <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-[2.5rem] overflow-hidden shadow-md border`}>
                <div className="flex px-6 items-center min-h-[64px] border-b border-inherit">
                  <span className="w-24 text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Title</span>
                  <input 
                    ref={titleInputRef}
                    className={`flex-1 text-[17px] bg-transparent outline-none py-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`} 
                    placeholder="What are we doing?" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                  />
                </div>
                <div className="flex px-6 items-center min-h-[64px]">
                  <span className="w-24 text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Location</span>
                  <input 
                    className={`flex-1 text-[17px] bg-transparent outline-none py-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`} 
                    placeholder="Where to?" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ADD PEOPLE TO INVITE</p>
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-[2.5rem] p-6 flex gap-6 overflow-x-auto no-scrollbar shadow-md border`}>
                  {availableFriends.map(friend => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <button key={friend.id} onClick={() => setSelectedFriends(prev => isSelected ? prev.filter(f => f !== friend.id) : [...prev, friend.id])} className="flex flex-col items-center flex-shrink-0 space-y-2">
                        <div className={`relative w-16 h-16 rounded-full p-1 transition-all ${isSelected ? 'bg-emerald-600' : 'bg-transparent'}`}>
                          <img src={friend.avatar} className={`w-full h-full rounded-full object-cover border-4 ${isDarkMode ? 'border-slate-900' : 'border-white'}`} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}>{friend.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center space-y-2">
                 <h3 className="text-xl font-black uppercase tracking-tighter">Golden Windows</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select a time that works best for the group</p>
               </div>
               
               <div className="space-y-3">
                 {suggestions.map((win, idx) => {
                   const start = new Date(win.start);
                   const isSelected = selectedWindow === win;
                   return (
                     <button 
                        key={idx}
                        onClick={() => setSelectedWindow(win)}
                        className={`w-full p-6 rounded-[2rem] border transition-all text-left ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl' : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-100 shadow-sm')}`}
                     >
                       <div className="flex justify-between items-start mb-2">
                         <p className="text-lg font-black uppercase tracking-tight">
                            {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                         </p>
                         <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${isSelected ? 'bg-white/20' : 'bg-emerald-600/10 text-emerald-600'}`}>
                           {Math.round(win.score * 100)}% MATCH
                         </span>
                       </div>
                       <p className={`text-[11px] font-medium leading-relaxed ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{win.reasoning}</p>
                     </button>
                   );
                 })}
               </div>
               
               <button 
                  onClick={() => setSuggestions([])}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-4"
                >
                  Edit Details
                </button>
            </div>
          )}
        </div>

        {/* Bottom Button Fixed */}
        <div className={`p-6 safe-bottom sticky bottom-0 border-t ${isDarkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-100'} backdrop-blur-xl`}>
          {!suggestions.length ? (
            <button 
              onClick={handleFetchAvailability} 
              disabled={loading || !title} 
              className="w-full py-6 bg-emerald-600 text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Analyzing Schedules...' : 'Check Group Availability'}
            </button>
          ) : (
            <button 
              onClick={handleSendInvite} 
              disabled={!selectedWindow} 
              className="w-full py-6 bg-emerald-600 text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Send Invitation
            </button>
          )}
        </div>
      </div>

      <div className="px-6">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-emerald-600">Planner</h1>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-1">MAY 2024</p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="w-14 h-14 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        <div className={`mb-8 p-1.5 rounded-[1.5rem] flex gap-1 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
          <button onClick={() => setViewMode('week')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'week' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}>Week</button>
          <button onClick={() => setViewMode('month')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'month' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}>Month</button>
        </div>

        {viewMode === 'week' ? (
          <div className="flex mb-10 overflow-x-auto py-2 no-scrollbar gap-4">
            {weekDates.map((d, i) => (
              <button key={i} onClick={() => setSelectedDate(d.num)} className="flex flex-col items-center min-w-[54px] space-y-3 outline-none">
                <span className={`text-[9px] font-black uppercase tracking-wider ${selectedDate === d.num ? 'text-emerald-600' : 'text-slate-400'}`}>{d.day}</span>
                <div className={`w-14 h-16 rounded-3xl flex flex-col items-center justify-center transition-all ${selectedDate === d.num ? 'bg-emerald-600 text-white shadow-2xl scale-105' : (isDarkMode ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600')}`}>
                  <span className="text-xl font-black">{d.num}</span>
                  {d.hasEvent && <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${selectedDate === d.num ? 'bg-white' : 'bg-emerald-600'}`}></div>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 mb-10 animate-in fade-in zoom-in-95 duration-300">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[9px] font-black text-slate-300 uppercase mb-1">{day}</div>
            ))}
            {monthDates.map((d, i) => (
              <button 
                key={i} 
                onClick={() => d && setSelectedDate(d)}
                className={`aspect-square flex flex-col items-center justify-center rounded-[1.25rem] transition-all min-h-[56px] ${!d ? 'opacity-0' : (selectedDate === d ? 'bg-emerald-600 text-white shadow-lg' : (isDarkMode ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-slate-100 text-slate-600'))}`}
              >
                <span className="text-lg font-black">{d}</span>
                {d && myEvents.some(e => e.date === d) && (
                   <div className={`w-1 h-1 rounded-full mt-1 ${selectedDate === d ? 'bg-white' : 'bg-emerald-600'}`}></div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">MAY {selectedDate} — AGENDA</h3>
          <div className="space-y-4 min-h-[160px] flex flex-col justify-center">
            {activeEvents.length > 0 ? (
              activeEvents.map(event => (
                <div key={event.id} className={`p-6 rounded-[2.5rem] border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-600/10 rounded-[1.5rem] flex items-center justify-center text-2xl">☕</div>
                    <div>
                      <p className={`font-black text-[15px] uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{event.title}</p>
                      <p className={`text-[11px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{event.location || 'San Francisco, CA'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-300 dark:text-slate-700 text-[13px] font-black italic uppercase tracking-widest">Clear for today.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`w-full py-6 rounded-[2rem] border-2 border-dashed flex items-center justify-center transition-all active:scale-[0.98] ${isDarkMode ? 'border-emerald-600/40 bg-emerald-600/10' : 'border-slate-200 bg-slate-50'}`}
          >
            {isSyncing ? (
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="flex items-center space-x-3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                 <span className={`text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600`}>Sync External Calendars</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPlanner;
