import React, { useState, useMemo } from 'react';
import { Message, Conversation } from '../types';

interface Props { isDarkMode: boolean; }

const SocialDashboard: React.FC<Props> = ({ isDarkMode }) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [statusText, setStatusText] = useState("Down for coffee");
  
  const [conversations] = useState<Conversation[]>([
    { id: 'sarah-dm', title: 'Sarah', participants: ['sarah'], lastMessage: 'See you at the coffee place!', isGroup: false, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: 'group-brunch', title: 'Brunch Squad', participants: ['sarah', 'marcus', 'elena'], lastMessage: 'Elena: 11:30 is perfect!', isGroup: true, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop' },
    { id: 'marcus-dm', title: 'Marcus', participants: ['marcus'], lastMessage: 'Did you check the new hike?', isGroup: false, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  ]);

  const [messagesByConvo, setMessagesByConvo] = useState<Record<string, Message[]>>({
    'sarah-dm': [
      { id: '1', senderId: 'sarah', text: 'Hey, are we still on?', timestamp: new Date() },
      { id: '2', senderId: 'me', text: 'Yes, 5pm!', timestamp: new Date() },
      { id: '3', senderId: 'sarah', text: 'Perfect, see you at the coffee place!', timestamp: new Date() },
    ],
    'group-brunch': [
      { id: 'g1', senderId: 'sarah', text: 'Who is down for brunch this Sunday?', timestamp: new Date() },
      { id: 'g2', senderId: 'marcus', text: 'I am in!', timestamp: new Date() },
      { id: 'g3', senderId: 'elena', text: '11:30 is perfect!', timestamp: new Date() },
    ]
  });

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const sendMessage = () => {
    if (!input.trim() || !selectedConversation) return;
    const newMsg = { id: Date.now().toString(), senderId: 'me', text: input, timestamp: new Date() };
    setMessagesByConvo(prev => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), newMsg]
    }));
    setInput('');
  };

  if (selectedConversation) {
    return (
      <div className={`fixed inset-0 z-[60] flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
        <div className={`flex items-center px-4 py-3 border-b sticky top-0 z-10 backdrop-blur-xl ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100 shadow-sm'}`}>
          <button onClick={() => setSelectedConversation(null)} className="mr-3 p-1 active:opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div className="flex items-center flex-1">
            <img src={selectedConversation.image} className="w-9 h-9 rounded-full mr-3 border border-slate-100 dark:border-slate-800" />
            <div className="flex flex-col">
              <span className="font-bold text-[15px] leading-none">{selectedConversation.title}</span>
              <span className="text-[11px] text-emerald-600 mt-1 uppercase tracking-wider font-black">Online</span>
            </div>
          </div>
          <button className="p-2 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {(messagesByConvo[selectedConversation.id] || []).map(m => (
            <div key={m.id} className={`flex ${m.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-[1.75rem] text-[15px] leading-snug font-medium shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${m.senderId === 'me' ? 'bg-emerald-600 text-white rounded-br-none' : (isDarkMode ? 'bg-slate-800 text-white rounded-bl-none' : 'bg-slate-100 text-slate-800 rounded-bl-none')}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 safe-bottom">
          <div className={`flex items-center space-x-3 border rounded-[2rem] px-5 py-3 shadow-md ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium"
            />
            <button onClick={sendMessage} className={`font-black uppercase text-[11px] tracking-widest text-emerald-600 ${!input.trim() && 'opacity-20'}`}>Send</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-emerald-600">Direct</h1>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">Inbox — {filteredConversations.length} Active</p>
        </div>
        <button className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-emerald-600 text-white shadow-lg active:scale-95 transition-transform">
           <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
      </header>

      {/* Spontaneity & Search Bar */}
      <div className={`mb-10 space-y-4`}>
        <div className={`p-6 rounded-[2.5rem] shadow-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">My Status</p>
              <button onClick={() => setIsAvailable(!isAvailable)} className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all shadow-sm ${isAvailable ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                {isAvailable ? 'Available' : 'Busy'}
              </button>
          </div>
          <div className={`p-4 rounded-2xl flex items-center shadow-inner ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50 border border-slate-100'}`}>
            <input 
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                className="w-full bg-transparent outline-none font-bold text-[15px] text-emerald-600"
                placeholder="What's the plan?"
            />
          </div>
        </div>

        <div className={`p-4 rounded-[2rem] flex items-center border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-transparent'}`}>
          <svg className="w-5 h-5 text-slate-400 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <input 
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 font-bold text-[13px] uppercase tracking-widest placeholder-slate-400"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto no-scrollbar mb-12 pb-2">
         {conversations.map((c, i) => (
           <div key={c.id + 'story'} className="flex flex-col items-center space-y-2 min-w-[72px]">
             <div className="relative">
                <div className={`w-[72px] h-[72px] rounded-full p-[3px] shadow-sm ${i % 2 === 0 ? 'bg-gradient-to-tr from-emerald-400 to-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <img src={c.image} className={`w-full h-full rounded-full border-4 object-cover ${isDarkMode ? 'border-slate-900' : 'border-white'}`} />
                </div>
                {i % 2 === 0 && (
                  <div className={`absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 rounded-full border-4 ${isDarkMode ? 'border-slate-900' : 'border-white'}`}></div>
                )}
             </div>
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{c.title.split(' ')[0]}</span>
           </div>
         ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4 ml-2">MESSAGES</h2>
        {filteredConversations.length > 0 ? filteredConversations.map(convo => (
          <button 
            key={convo.id} 
            onClick={() => setSelectedConversation(convo)}
            className={`w-full flex items-center p-4 rounded-[2.5rem] transition-all active:scale-[0.98] mb-2 border ${isDarkMode ? 'hover:bg-slate-900 border-transparent' : 'bg-white border-slate-50 shadow-sm hover:shadow-md'}`}
          >
            <div className="relative">
              <img src={convo.image} className="w-16 h-16 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800" />
              {convo.isGroup && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm">
                  <span className="text-[10px] font-black">G</span>
                </div>
              )}
            </div>
            <div className="ml-5 text-left flex-1">
              <p className={`font-black text-[15px] uppercase tracking-tight text-emerald-950 dark:text-white`}>{convo.title}</p>
              <p className={`text-[13px] mt-0.5 line-clamp-1 ${convo.id === 'sarah-dm' ? 'text-slate-400 font-medium' : 'text-emerald-600 font-black'}`}>
                {convo.lastMessage}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
               <span className="text-[10px] text-slate-300 font-black tracking-tighter uppercase">48M</span>
               {convo.id !== 'sarah-dm' && (
                 <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/20"></div>
               )}
            </div>
          </button>
        )) : (
          <div className="py-20 text-center space-y-2">
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">No friends found</p>
            <button 
               onClick={() => setSearchQuery('')}
               className="text-emerald-600 text-[10px] font-black uppercase tracking-widest"
            >
               Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialDashboard;
