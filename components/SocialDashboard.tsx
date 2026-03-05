import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, Alert, Modal, ScrollView } from 'react-native';
import Svg, { Polyline, Path, Circle } from 'react-native-svg';
import { Conversation, Message, Friend, DiscoveryItem } from '../types';
import { ChatService } from '../services/ChatService';
import StatusComposer from './StatusComposer';
import { MOCK_FRIENDS, CURRENT_USER } from '../constants';

interface Props { 
    isDarkMode: boolean;
    onChatOpen?: () => void;
    onChatClose?: () => void;
    onPlanActivity?: (item: DiscoveryItem | null, participants?: string[]) => void;
}

import DraggableVoteList from './DraggableVoteList';

interface VoteMessageProps {
    message: Message;
    isDarkMode: boolean;
    currentUserId: string;
    onVote: (msgId: string, optionId: string, rankedOrder?: string[]) => void;
}

const VoteMessage: React.FC<VoteMessageProps> = ({ message, isDarkMode, currentUserId, onVote }) => {
    const { question, options, mode, context, rankedVotes } = message.voteDetails!;
    const isRanked = mode === 'ranked';
    const styles = getStyles(isDarkMode);

    // Local state for ranked voting order
    const [localOrder, setLocalOrder] = useState<string[]>(options.map(o => o.id));
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Check if user has already voted
    const userVote = isRanked 
        ? rankedVotes?.find(v => v.userId === currentUserId)
        : options.find(o => o.votes.includes(currentUserId));
    
    const hasVoted = !!userVote;

    // Calculate results
    const totalVotes = isRanked 
        ? (rankedVotes?.length || 0)
        : options.reduce((acc, opt) => acc + opt.votes.length, 0);

    const getRankedResults = () => {
        if (!rankedVotes || rankedVotes.length === 0) return [];
        
        // Simple Borda Count or just first choice count for now
        // Let's do first choice count for simplicity in this view
        const scores: Record<string, number> = {};
        options.forEach(o => scores[o.id] = 0);
        
        rankedVotes.forEach(v => {
            v.order.forEach((optId, idx) => {
                // Weighted score: 1st place = options.length, last place = 1
                scores[optId] += (options.length - idx);
            });
        });

        return Object.entries(scores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2) // Top 2
            .map(([id]) => options.find(o => o.id === id));
    };

    const handleRankedSubmit = () => {
        onVote(message.id, '', localOrder);
        setHasSubmitted(true);
    };

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    if (isRanked) {
        const top2 = hasVoted ? getRankedResults() : [];

        // Sort options based on localOrder
        const sortedOptions = localOrder.map(id => options.find(o => o.id === id)!);

        return (
            <View style={[styles.msgRow, { justifyContent: 'center', marginVertical: 12 }]}>
                <View style={[styles.voteCard, { backgroundColor: isDarkMode ? '#2c2c2e' : 'white' }]}>
                    <View style={styles.voteHeader}>
                        <Text style={styles.voteQuestion}>{question}</Text>
                        <Text style={styles.voteType}>RANKED VOTE</Text>
                        {context && <Text style={styles.voteContext}>Linked to: {context.field === 'time' ? 'Time' : 'Activity'}</Text>}
                    </View>

                    {!hasVoted ? (
                        <View>
                            <Text style={{color: isDarkMode ? '#ccc' : '#666', marginBottom: 12, fontSize: 12}}>
                                Drag options to reorder
                            </Text>
                            <View style={styles.voteOptions}>
                                <DraggableVoteList 
                                    options={sortedOptions.map(o => ({ id: o.id, text: o.text }))}
                                    onReorder={(newOrder) => setLocalOrder(newOrder)}
                                    isDarkMode={isDarkMode}
                                />
                            </View>
                            <TouchableOpacity style={styles.createVoteBtn} onPress={handleRankedSubmit}>
                                <Text style={styles.createVoteText}>Submit Vote</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text style={{color: isDarkMode ? '#ccc' : '#666', marginBottom: 12, fontSize: 12, fontStyle: 'italic'}}>
                                Top 2 Results (Current)
                            </Text>
                            <View style={styles.voteOptions}>
                                {top2.map((opt, idx) => {
                                    if (!opt) return null;
                                    const isWinner = idx === 0;
                                    return (
                                        <View 
                                            key={opt.id} 
                                            style={[
                                                styles.voteOption, 
                                                isWinner && styles.voteOptionSelected,
                                                { position: 'relative', overflow: 'hidden', height: 50, justifyContent: 'center' }
                                            ]}
                                        >
                                            {/* Progress Bar Background - Full width for winner, maybe less for 2nd? 
                                                For now, let's just give the winner a full green background opacity and 2nd place a neutral one.
                                            */}
                                            <View style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '100%',
                                                backgroundColor: isWinner ? 'rgba(16, 185, 129, 0.2)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                                                zIndex: 0
                                            }} />

                                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 1}}>
                                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                    <Text style={[styles.voteOptionText, isWinner && {fontWeight: 'bold', color: '#10b981'}]}>
                                                        #{idx + 1} {opt.text}
                                                    </Text>
                                                </View>
                                                {isWinner && (
                                                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><Path d="M20 6L9 17l-5-5"/></Svg>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                            <TouchableOpacity style={{marginTop: 12}} onPress={() => showToast('Full results breakdown coming soon!')}>
                                <Text style={{color: '#10b981', textAlign: 'center', fontSize: 12}}>View Full Results</Text>
                            </TouchableOpacity>
                            
                            {/* Toast inside VoteMessage? No, better to have it at screen level, but for now let's put a local absolute one or pass a handler. 
                                Actually, the user asked for a "fading pop-up". A local absolute view works if the card is big enough, but screen level is better.
                                However, to avoid prop drilling too much right now, I'll put a small absolute toast inside this view or just use a local state for a temporary text.
                            */}
                            {toastMessage && (
                                <View style={{
                                    position: 'absolute', 
                                    bottom: 40, 
                                    left: 20, 
                                    right: 20, 
                                    backgroundColor: 'rgba(0,0,0,0.8)', 
                                    padding: 8, 
                                    borderRadius: 12, 
                                    alignItems: 'center',
                                    zIndex: 100
                                }}>
                                    <Text style={{color: 'white', fontSize: 12}}>{toastMessage}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    }

    // Normal Vote
    return (
        <View style={[styles.msgRow, { justifyContent: 'center', marginVertical: 12 }]}>
            <View style={[styles.voteCard, { backgroundColor: isDarkMode ? '#2c2c2e' : 'white' }]}>
                <View style={styles.voteHeader}>
                    <Text style={styles.voteQuestion}>{question}</Text>
                    {context && <Text style={styles.voteContext}>Linked to: {context.field === 'time' ? 'Time' : 'Activity'}</Text>}
                </View>
                
                <View style={styles.voteOptions}>
                    {options.map((opt, idx) => {
                        const voteCount = opt.votes.length;
                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                        const isSelected = opt.votes.includes(currentUserId);
                        
                        return (
                            <TouchableOpacity 
                                key={opt.id} 
                                style={[
                                    styles.voteOption, 
                                    isSelected && styles.voteOptionSelected,
                                    { position: 'relative', overflow: 'hidden', height: 50, justifyContent: 'center' }
                                ]}
                                onPress={() => onVote(message.id, opt.id)}
                                disabled={hasVoted}
                            >
                                {/* Progress Bar Background */}
                                {(hasVoted || totalVotes > 0) && (
                                    <View style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${percentage}%`,
                                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                        zIndex: 0
                                    }} />
                                )}

                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 1}}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Text style={[styles.voteOptionText, isSelected && {fontWeight: 'bold', color: '#10b981'}]}>{opt.text}</Text>
                                        <Text style={{fontSize: 12, color: '#999', marginLeft: 8}}>{voteCount > 0 ? voteCount : ''}</Text>
                                    </View>
                                    {(hasVoted || totalVotes > 0) && (
                                        <Text style={{fontSize: 14, fontWeight: '600', color: isSelected ? '#10b981' : (isDarkMode ? '#ccc' : '#666')}}>{percentage}%</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View style={{marginTop: 12, alignItems: 'center'}}>
                    <Text style={{fontSize: 12, color: '#999'}}>{totalVotes} votes</Text>
                </View>
            </View>
        </View>
    );
};

const SocialDashboard: React.FC<Props> = ({ isDarkMode, onChatOpen, onChatClose, onPlanActivity }) => {
  const styles = getStyles(isDarkMode);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatDetails, setShowChatDetails] = useState(false);

  const [showFeaturesHub, setShowFeaturesHub] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo.id);
      onChatOpen?.();
    } else {
      onChatClose?.();
    }
  }, [selectedConvo]);

  const loadConversations = () => {
    const data = ChatService.getConversations();
    setConversations(data);
  };

  const loadMessages = (chatId: string) => {
    const msgs = ChatService.getMessages(chatId);
    // Reverse messages so newest is at index 0 (bottom of inverted list)
    setMessages(msgs.reverse());
  };

  const sendMessage = () => {
    if (!input.trim() || !selectedConvo) return;
    
    ChatService.sendMessage(selectedConvo.id, input);
    
    // Refresh UI
    loadMessages(selectedConvo.id);
    loadConversations();
    setInput('');
  };

  const handleDeleteMessage = (msgId: string) => {
      Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message?',
          [
              { text: 'Cancel', style: 'cancel' },
              { 
                  text: 'Delete', 
                  style: 'destructive', 
                  onPress: () => {
                      if (selectedConvo) {
                          ChatService.deleteMessage(selectedConvo.id, msgId);
                          loadMessages(selectedConvo.id);
                      }
                  }
              }
          ]
      );
  };

  const handleDeleteConversation = () => {
      Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation? This cannot be undone.',
          [
              { text: 'Cancel', style: 'cancel' },
              { 
                  text: 'Delete', 
                  style: 'destructive', 
                  onPress: () => {
                      if (selectedConvo) {
                          ChatService.deleteConversation(selectedConvo.id);
                          setSelectedConvo(null);
                          loadConversations();
                          setShowChatDetails(false);
                      }
                  }
              }
          ]
      );
  };

  const [showEventMenu, setShowEventMenu] = useState(false);
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<{msgId: string, eventDetails: any} | null>(null);

  const handleEventMenu = (msgId: string, eventDetails: any) => {
      setSelectedEventForMenu({ msgId, eventDetails });
      setShowEventMenu(true);
  };

  const renderEventMenu = () => (
      <Modal
          visible={showEventMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEventMenu(false)}
      >
          <TouchableOpacity 
              style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}
              activeOpacity={1}
              onPress={() => setShowEventMenu(false)}
          >
              <View style={{backgroundColor: isDarkMode ? '#1c1c1e' : 'white', width: '80%', maxWidth: 320, borderRadius: 24, padding: 20, position: 'relative'}}>
                  {/* Close Button */}
                  <TouchableOpacity 
                      style={{position: 'absolute', top: 16, left: 16, zIndex: 10}}
                      onPress={() => setShowEventMenu(false)}
                  >
                      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M18 6L6 18M6 6l12 12" />
                      </Svg>
                  </TouchableOpacity>

                  <Text style={{fontSize: 20, fontWeight: 'bold', color: isDarkMode ? 'white' : 'black', textAlign: 'center', marginBottom: 24, marginTop: 8}}>Manage Event</Text>
                  
                  <View style={{gap: 12}}>
                      <TouchableOpacity 
                          style={{
                              backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', 
                              padding: 16, 
                              borderRadius: 16, 
                              borderWidth: 1, 
                              borderColor: '#10b981',
                              alignItems: 'center'
                          }}
                          onPress={() => {
                              setShowEventMenu(false);
                              if (selectedEventForMenu) {
                                  setVoteMode('normal');
                                  setVoteContext({ 
                                      eventId: selectedEventForMenu.msgId, 
                                      field: 'time', 
                                      initialValue: new Date(selectedEventForMenu.eventDetails.time).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}) 
                                  });
                                  setShowVoteCreator(true);
                              }
                          }}
                      >
                          <Text style={{fontSize: 16, fontWeight: '600', color: '#10b981'}}>Propose Time Change</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                          style={{
                              backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', 
                              padding: 16, 
                              borderRadius: 16, 
                              borderWidth: 1, 
                              borderColor: '#10b981',
                              alignItems: 'center'
                          }}
                          onPress={() => {
                              setShowEventMenu(false);
                              if (selectedEventForMenu) {
                                  setVoteMode('normal');
                                  setVoteContext({ 
                                      eventId: selectedEventForMenu.msgId, 
                                      field: 'location', 
                                      initialValue: selectedEventForMenu.eventDetails.title 
                                  });
                                  setShowVoteCreator(true);
                              }
                          }}
                      >
                          <Text style={{fontSize: 16, fontWeight: '600', color: '#10b981'}}>Propose Activity Change</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </TouchableOpacity>
      </Modal>
  );

  const handleViewDetails = (eventDetails: any) => {
      Alert.alert(
          eventDetails.title,
          `Location: ${eventDetails.location}\nTime: ${new Date(eventDetails.time).toLocaleString()}`,
          [{ text: 'OK' }]
      );
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleSaveTitle = () => {
      if (selectedConvo && newTitle.trim()) {
          ChatService.updateConversationTitle(selectedConvo.id, newTitle);
          const updatedConvo = {...selectedConvo, title: newTitle};
          setSelectedConvo(updatedConvo);
          setConversations(prev => prev.map(c => c.id === selectedConvo.id ? updatedConvo : c));
          setIsEditingTitle(false);
      }
  };

  const handleVote = (msgId: string, status: 'going' | 'not_going') => {
      if (!selectedConvo) return;
      const updatedMsg = ChatService.updateMessageRSVP(selectedConvo.id, msgId, CURRENT_USER.id, status);
      if (updatedMsg) {
          setMessages(prev => prev.map(m => m.id === msgId ? updatedMsg : m));
      }
  };

  const handleProposeChange = () => {
      Alert.alert('Propose Change', 'Suggest a new time or location');
  };

  const createNewProposal = (voteMsg: Message, currentMessages: Message[]) => {
      const { options, rankedVotes, mode, context } = voteMsg.voteDetails!;
      let winnerText = '';
      
      if (mode === 'ranked') {
          const scores: Record<string, number> = {};
          options.forEach(o => scores[o.id] = 0);
          rankedVotes?.forEach(v => {
              v.order.forEach((optId, idx) => {
                  scores[optId] += (options.length - idx);
              });
          });
          const winnerEntry = Object.entries(scores).sort(([,a], [,b]) => b - a)[0];
          if (winnerEntry) {
              winnerText = options.find(o => o.id === winnerEntry[0])?.text || '';
          }
      } else {
          const winner = [...options].sort((a, b) => b.votes.length - a.votes.length)[0];
          winnerText = winner?.text || '';
      }

      if (!winnerText) return;

      const originalEventMsg = currentMessages.find(m => m.id === context!.eventId);
      if (!originalEventMsg || !originalEventMsg.eventDetails) return;

      const newEventDetails = { ...originalEventMsg.eventDetails };
      
      if (context!.field === 'time') {
          const originalDate = new Date(newEventDetails.time);
          const timeString = winnerText; 
          // Try to parse "8:00 AM"
          try {
              const [time, period] = timeString.split(' ');
              if (time && period) {
                  let [hours, minutes] = time.split(':').map(Number);
                  if (period === 'PM' && hours !== 12) hours += 12;
                  if (period === 'AM' && hours === 12) hours = 0;
                  
                  if (!isNaN(hours) && !isNaN(minutes)) {
                      originalDate.setHours(hours);
                      originalDate.setMinutes(minutes);
                      newEventDetails.time = originalDate.getTime();
                  }
              }
          } catch (e) {
              console.log('Error parsing time', e);
          }
      } else if (context!.field === 'location') {
          newEventDetails.title = winnerText;
      }

      // Reset RSVPs for new proposal
      newEventDetails.rsvps = {};
      newEventDetails.rsvps[CURRENT_USER.id] = 'going'; // Proposer goes by default?

      const newProposal: Message = {
          id: Date.now().toString(),
          text: `Vote passed! New proposal created: ${winnerText}`,
          senderId: 'me',
          timestamp: Date.now(),
          type: 'event-proposal',
          eventDetails: newEventDetails
      };

      setMessages(prev => [newProposal, ...prev]);
  };

  const checkVoteCompletion = (voteMsg: Message, convo: Conversation | null, currentMessages: Message[]) => {
      if (!voteMsg.voteDetails?.context || !convo) return;
      
      const { options, rankedVotes, mode } = voteMsg.voteDetails;
      const participants = convo.participants; 
      const allParticipants = [CURRENT_USER.id, ...participants];
      
      let uniqueVoters = new Set<string>();
      if (mode === 'ranked') {
          rankedVotes?.forEach(v => uniqueVoters.add(v.userId));
      } else {
          options.forEach(o => o.votes.forEach(v => uniqueVoters.add(v)));
      }

      if (uniqueVoters.size >= allParticipants.length) {
          setTimeout(() => {
             createNewProposal(voteMsg, currentMessages);
          }, 1500);
      }
  };

  const handleCastVote = (msgId: string, optionId: string, rankedOrder?: string[]) => {
      setMessages(prev => {
          let updatedMsg: Message | null = null;
          const newMessages = prev.map(msg => {
              if (msg.id !== msgId || !msg.voteDetails) return msg;

              const { mode, options, rankedVotes } = msg.voteDetails;
              const isRanked = mode === 'ranked';
              let newVoteDetails = { ...msg.voteDetails };

              if (isRanked) {
                  // Handle ranked vote
                  const newRankedVotes = rankedVotes ? [...rankedVotes] : [];
                  const userVoteIndex = newRankedVotes.findIndex(v => v.userId === CURRENT_USER.id);
                  
                  if (userVoteIndex >= 0) {
                      newRankedVotes[userVoteIndex] = { userId: CURRENT_USER.id, order: rankedOrder! };
                  } else {
                      newRankedVotes.push({ userId: CURRENT_USER.id, order: rankedOrder! });
                  }
                  newVoteDetails.rankedVotes = newRankedVotes;
              } else {
                  // Handle normal vote
                  const newOptions = options.map(opt => {
                      if (opt.id === optionId) {
                          if (!opt.votes.includes(CURRENT_USER.id)) {
                              return { ...opt, votes: [...opt.votes, CURRENT_USER.id] };
                          }
                      }
                      return opt;
                  });
                  newVoteDetails.options = newOptions;
              }
              
              updatedMsg = { ...msg, voteDetails: newVoteDetails };
              return updatedMsg;
          });

          if (updatedMsg && selectedConvo) {
              checkVoteCompletion(updatedMsg, selectedConvo, newMessages);
          }

          return newMessages;
      });
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
      const isMe = item.senderId === 'me';
      const prevMsg = messages[index + 1];
      const isSameSender = prevMsg && prevMsg.senderId === item.senderId;
      
      // Avatar logic for group chats
      let senderAvatar = '';
      let senderName = '';
      if (!isMe && selectedConvo?.isGroup) {
          const friend = MOCK_FRIENDS.find(f => f.id === item.senderId);
          senderAvatar = friend?.avatar || 'https://via.placeholder.com/40';
          senderName = friend?.name || 'Unknown';
      }

      if (item.type === 'vote' && item.voteDetails) {
          return (
              <VoteMessage 
                  message={item} 
                  isDarkMode={isDarkMode} 
                  currentUserId={CURRENT_USER.id} 
                  onVote={handleCastVote} 
              />
          );
      }

      if (item.type === 'event-proposal' && item.eventDetails) {
          const { title, time, proposerId, participants, rsvps } = item.eventDetails;
          
          // Resolve proposer name
          let proposerName = 'Unknown';
          if (proposerId === CURRENT_USER.id) proposerName = 'You';
          else {
              const friend = MOCK_FRIENDS.find(f => f.id === proposerId);
              if (friend) proposerName = friend.name;
          }

          return (
              <View style={[styles.msgRow, { justifyContent: 'center', marginVertical: 12 }]}>
                  <View style={[styles.eventCard, { backgroundColor: item.eventDetails.color || '#10b981' }]}>
                      {/* Header with Menu */}
                      <View style={styles.eventHeader}>
                          <View style={{flex: 1}}>
                              <Text style={styles.eventProposer}>PROPOSED BY {proposerName.toUpperCase()}</Text>
                              <Text style={styles.eventTitle}>{title}</Text>
                              <Text style={styles.eventTime}>
                                  {new Date(time).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})} @ {new Date(time).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                              </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleEventMenu(item.id, item.eventDetails)} style={styles.eventMenuBtn}>
                              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                  <Path d="M3 12h18M3 6h18M3 18h18" />
                              </Svg>
                          </TouchableOpacity>
                      </View>

                      {/* Participants with Status Icons */}
                      <View style={styles.eventParticipants}>
                          <Text style={styles.invitedLabel}>INVITED</Text>
                          <View style={styles.avatarRow}>
                              {participants?.map(pid => {
                                  let pName = 'Unknown';
                                  let pAvatar = '';
                                  
                                  if (pid === CURRENT_USER.id) {
                                      pName = 'Me';
                                      pAvatar = CURRENT_USER.avatar;
                                  } else {
                                      const f = MOCK_FRIENDS.find(fr => fr.id === pid);
                                      if (f) {
                                          pName = f.name.split(' ')[0];
                                          pAvatar = f.avatar;
                                      }
                                  }

                                  const status = rsvps?.[pid] || 'pending';

                                  return (
                                      <View key={pid} style={styles.avatarContainer}>
                                          <View style={{position: 'relative'}}>
                                              <Image source={{uri: pAvatar}} style={styles.participantAvatar} />
                                              {status === 'going' && (
                                                  <View style={styles.statusBadgeGreen}>
                                                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><Path d="M20 6L9 17l-5-5"/></Svg>
                                                  </View>
                                              )}
                                              {status === 'not_going' && (
                                                  <View style={styles.statusBadgeRed}>
                                                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><Path d="M18 6L6 18M6 6l12 12"/></Svg>
                                                  </View>
                                              )}
                                          </View>
                                          <Text style={styles.participantName}>{pName}</Text>
                                      </View>
                                  );
                              })}
                          </View>
                      </View>

                      {/* Floating Action Buttons */}
                      <View style={styles.eventActions}>
                          <TouchableOpacity 
                              style={[styles.actionBtn, rsvps?.[CURRENT_USER.id] === 'going' ? styles.actionBtnGoing : styles.actionBtnInactive]}
                              onPress={() => handleVote(item.id, 'going')}
                          >
                              {rsvps?.[CURRENT_USER.id] === 'going' && <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><Path d="M20 6L9 17l-5-5"/></Svg>}
                              <Text style={[styles.actionBtnText, rsvps?.[CURRENT_USER.id] === 'going' ? {color:'black'} : {color:'white'}]}>GOING</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                              style={[styles.actionBtn, rsvps?.[CURRENT_USER.id] === 'not_going' ? styles.actionBtnNotGoing : styles.actionBtnInactive]}
                              onPress={() => handleVote(item.id, 'not_going')}
                          >
                              {rsvps?.[CURRENT_USER.id] === 'not_going' && <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><Path d="M18 6L6 18M6 6l12 12"/></Svg>}
                              <Text style={[styles.actionBtnText, rsvps?.[CURRENT_USER.id] === 'not_going' ? {color:'white'} : {color:'white'}]}>NO</Text>
                          </TouchableOpacity>
                      </View>

                      {/* Propose Change for Not Going */}
                      {rsvps?.[CURRENT_USER.id] === 'not_going' && (
                          <View style={{marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 12, paddingBottom: 24}}>
                              <Text style={{color: 'white', textAlign: 'center', marginBottom: 8, fontSize: 12, opacity: 0.8}}>
                                  Can't make it? Propose a change instead!
                              </Text>
                              <TouchableOpacity 
                                  style={{
                                      backgroundColor: 'rgba(255,255,255,0.2)', 
                                      paddingVertical: 10, 
                                      paddingHorizontal: 20, 
                                      borderRadius: 24,
                                      alignSelf: 'center'
                                  }}
                                  onPress={() => handleEventMenu(item.id, item.eventDetails)}
                              >
                                  <Text style={{color: 'white', fontWeight: '600', fontSize: 14}}>Propose Change</Text>
                              </TouchableOpacity>
                          </View>
                      )}
                  </View>
              </View>
          );
      }

      return (
        <TouchableOpacity 
            activeOpacity={0.8}
            onLongPress={() => handleDeleteMessage(item.id)}
            style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther, isSameSender && { marginTop: 2 }]}
        >
           {!isMe && selectedConvo?.isGroup && !isSameSender && (
               <Image source={{ uri: senderAvatar }} style={styles.msgAvatar} />
           )}
           {!isMe && selectedConvo?.isGroup && isSameSender && (
               <View style={styles.msgAvatarPlaceholder} />
           )}
           <View style={[
               styles.msgBubble, 
               isMe ? styles.msgMe : styles.msgOther,
               isSameSender && isMe && { borderBottomRightRadius: 4, borderTopRightRadius: 4 },
               isSameSender && !isMe && { borderBottomLeftRadius: 4, borderTopLeftRadius: 4 }
           ]}>
              {!isMe && selectedConvo?.isGroup && !isSameSender && (
                  <Text style={styles.senderName}>{senderName}</Text>
              )}
              <Text style={[styles.msgText, isMe && {color:'white'}]}>{item.text}</Text>
           </View>
        </TouchableOpacity>
      );
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroupAvatar = (participants: string[]) => {
      // Get up to 3 avatars
      const avatars = participants.slice(0, 3).map(pid => {
          if (pid === CURRENT_USER.id) return CURRENT_USER.avatar;
          const f = MOCK_FRIENDS.find(fr => fr.id === pid);
          return f?.avatar || 'https://via.placeholder.com/40';
      });

      if (avatars.length === 1) {
          return <Image source={{ uri: avatars[0] }} style={styles.avatar} />;
      }

      // Floating bubbles style
      return (
          <View style={{width: 44, height: 44, position: 'relative'}}>
              {avatars.map((uri, idx) => {
                  // Calculate positions for overlapping circles
                  let style = {};
                  if (avatars.length === 2) {
                      style = idx === 0 ? { top: 0, left: 0 } : { bottom: 0, right: 0 };
                  } else {
                      // Triangle formation for 3
                      if (idx === 0) style = { top: 0, left: 10 }; // Top center
                      else if (idx === 1) style = { bottom: 0, left: 0 }; // Bottom left
                      else style = { bottom: 0, right: 0 }; // Bottom right
                  }
                  
                  return (
                      <Image key={idx} source={{ uri }} style={[
                          { 
                              width: 28, 
                              height: 28, 
                              borderRadius: 14, 
                              borderWidth: 2, 
                              borderColor: isDarkMode ? '#121212' : 'white',
                              position: 'absolute',
                              zIndex: avatars.length - idx
                          },
                          style
                      ]} />
                  );
              })}
          </View>
      );
  };

  const [showVoteCreator, setShowVoteCreator] = useState(false);
  const [voteMode, setVoteMode] = useState<'normal' | 'ranked'>('normal');
  const [voteContext, setVoteContext] = useState<{eventId?: string, field?: 'time' | 'location', initialValue?: string} | null>(null);
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    if (showVoteCreator) {
        // Reset options based on mode
        if (voteMode === 'ranked') setVoteOptions(['', '', '']);
        else setVoteOptions(['', '']);
        
        if (voteContext?.initialValue) {
             setVoteOptions(prev => {
                 const newOpts = [...prev];
                 newOpts[0] = voteContext.initialValue!;
                 return newOpts;
             });
             if (voteContext.field === 'time') setVoteQuestion('Vote on Time');
             else if (voteContext.field === 'location') setVoteQuestion('Vote on Activity');
        } else {
            setVoteQuestion('');
        }
    }
  }, [showVoteCreator, voteMode, voteContext]);

  const handleOptionChange = (text: string, index: number) => {
      const newOptions = [...voteOptions];
      newOptions[index] = text;
      setVoteOptions(newOptions);
  };

  const addOption = () => {
      setVoteOptions([...voteOptions, '']);
  };

  const submitVote = (mode: 'normal' | 'ranked') => {
      const validOptions = voteOptions.filter(o => o.trim().length > 0);
      
      if (selectedConvo) {
          // Mock sending vote message
          const voteMsg = {
              id: Date.now().toString(),
              text: 'Vote Created',
              senderId: 'me',
              timestamp: Date.now(),
              type: 'vote',
              voteDetails: {
                  question: voteQuestion,
                  options: validOptions.map((opt, i) => ({ id: i.toString(), text: opt, votes: [] })),
                  mode: mode,
                  context: voteContext,
                  rankedVotes: []
              }
          };
          // In real app: ChatService.sendVote(selectedConvo.id, voteMsg);
          setMessages(prev => [voteMsg as any, ...prev]); 
          setShowVoteCreator(false);
      }
  };

  const handleCreateVote = () => {
      // Validate
      const validOptions = voteOptions.filter(o => o.trim().length > 0);
      const minOptions = voteMode === 'ranked' ? 3 : 2;
      
      if (validOptions.length < minOptions) {
          Alert.alert('Invalid Vote', `Please provide at least ${minOptions} options.`);
          return;
      }
      
      if (!voteQuestion.trim()) {
          Alert.alert('Invalid Vote', 'Please provide a question.');
          return;
      }

      if (validOptions.length >= 3 && voteMode === 'normal') {
          Alert.alert(
              'Suggestion',
              'You have 3 or more options. Would you like to make this a Ranked Vote?',
              [
                  { text: 'No, keep Normal', onPress: () => submitVote('normal') },
                  { text: 'Yes, make Ranked', onPress: () => submitVote('ranked') }
              ]
          );
          return;
      }

      submitVote(voteMode);
  };

  const handlePlanActivity = () => {
      if (selectedConvo && onPlanActivity) {
          onPlanActivity(null, selectedConvo.participants); 
          setShowFeaturesHub(false);
      }
  };

  const renderVoteCreator = () => (
      <Modal
        visible={showVoteCreator}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoteCreator(false)}
      >
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20}}>
              <View style={[styles.voteCard, { backgroundColor: isDarkMode ? '#1c1c1e' : 'white', width: '100%', maxWidth: 340, padding: 0, borderRadius: 24, overflow: 'hidden' }]}>
                  {/* Colorful Header */}
                  <View style={{backgroundColor: '#10b981', padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={[styles.modalTitle, {color: 'white', fontSize: 22}]}>Create Vote</Text>
                      <TouchableOpacity onPress={() => setShowVoteCreator(false)} style={{backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20}}>
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><Path d="M18 6L6 18M6 6l12 12"/></Svg>
                      </TouchableOpacity>
                  </View>

                  <ScrollView style={{maxHeight: 400, padding: 24}}>
                      {/* Mode Selector */}
                      <View style={{flexDirection: 'row', backgroundColor: isDarkMode ? '#333' : '#f0f0f5', borderRadius: 12, padding: 4, marginBottom: 20}}>
                          <TouchableOpacity 
                              style={{flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: voteMode === 'normal' ? (isDarkMode ? '#555' : 'white') : 'transparent', shadowColor: voteMode === 'normal' ? "#000" : "transparent", shadowOpacity: 0.1, shadowRadius: 2}}
                              onPress={() => setVoteMode('normal')}
                          >
                              <Text style={{fontWeight: '600', color: isDarkMode ? 'white' : 'black'}}>Normal</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                              style={{flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: voteMode === 'ranked' ? (isDarkMode ? '#555' : 'white') : 'transparent', shadowColor: voteMode === 'ranked' ? "#000" : "transparent", shadowOpacity: 0.1, shadowRadius: 2}}
                              onPress={() => setVoteMode('ranked')}
                          >
                              <Text style={{fontWeight: '600', color: isDarkMode ? 'white' : 'black'}}>Ranked</Text>
                          </TouchableOpacity>
                      </View>

                      <Text style={styles.label}>Question</Text>
                      <TextInput
                          style={[styles.voteInput, {backgroundColor: isDarkMode ? '#2c2c2e' : 'white'}]}
                          value={voteQuestion}
                          onChangeText={setVoteQuestion}
                          placeholder="What are we voting on?"
                          placeholderTextColor="#999"
                      />
                      
                      <Text style={styles.label}>Options</Text>
                      {voteOptions.map((opt, idx) => (
                          <TextInput
                              key={idx}
                              style={[styles.voteInput, {backgroundColor: isDarkMode ? '#2c2c2e' : 'white'}]}
                              value={opt}
                              onChangeText={(text) => handleOptionChange(text, idx)}
                              placeholder={`Option ${idx + 1}`}
                              placeholderTextColor="#999"
                              autoFocus={idx === voteOptions.length - 1 && idx > 1}
                          />
                      ))}
                      
                      {/* Ghost Option */}
                      <TouchableOpacity 
                          style={[styles.voteInput, {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed', borderColor: '#10b981', borderWidth: 1, backgroundColor: 'transparent'}]}
                          onPress={addOption}
                      >
                          <Text style={{color: '#10b981', fontWeight: '600'}}>Add Option</Text>
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><Path d="M12 5v14M5 12h14"/></Svg>
                      </TouchableOpacity>

                      {voteOptions.filter(o => o.trim()).length >= 3 && voteMode === 'normal' && (
                          <TouchableOpacity onPress={() => setVoteMode('ranked')} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5', borderRadius: 12, marginBottom: 10}}>
                              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{marginRight: 6}}><Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></Svg>
                              <Text style={{color: '#10b981', fontSize: 12, fontWeight: '600'}}>Tip: Try Ranked Vote for 3+ options!</Text>
                          </TouchableOpacity>
                      )}
                  </ScrollView>
                  
                  <View style={{padding: 24, paddingTop: 0}}>
                      <TouchableOpacity style={styles.createVoteBtn} onPress={handleCreateVote}>
                          <Text style={styles.createVoteText}>Post Vote</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
  );

  const renderFeaturesHub = () => (
    <Modal
        visible={showFeaturesHub}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeaturesHub(false)}
    >
        <TouchableOpacity 
            style={styles.hubOverlay} 
            activeOpacity={1} 
            onPress={() => setShowFeaturesHub(false)}
        >
            <View style={[styles.hubContent, { backgroundColor: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                <View style={{paddingHorizontal: 10, gap: 16}}>
                    <TouchableOpacity style={styles.hubItemVertical} onPress={() => { setShowFeaturesHub(false); setVoteMode('normal'); setVoteContext(null); setShowVoteCreator(true); }}>
                        <View style={[styles.hubIcon, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#fff' : '#000'}]}>
                             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2"><Path d="M9 11l3 3L22 4"/><Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>
                        </View>
                        <Text style={[styles.hubLabelVertical, { color: isDarkMode ? 'white' : 'black' }]}>Vote</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hubItemVertical} onPress={() => { setShowFeaturesHub(false); setVoteMode('ranked'); setVoteContext(null); setShowVoteCreator(true); }}>
                        <View style={[styles.hubIcon, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#fff' : '#000'}]}>
                             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2"><Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>
                        </View>
                        <Text style={[styles.hubLabelVertical, { color: isDarkMode ? 'white' : 'black' }]}>Ranked Vote</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hubItemVertical} onPress={handlePlanActivity}>
                        <View style={[styles.hubIcon, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#fff' : '#000'}]}>
                             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2"><Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><Path d="M16 2v4"/><Path d="M8 2v4"/><Path d="M3 10h18"/></Svg>
                        </View>
                        <Text style={[styles.hubLabelVertical, { color: isDarkMode ? 'white' : 'black' }]}>Plan Activity</Text>
                    </TouchableOpacity>
                    
                    {/* Disabled Items */}
                    <TouchableOpacity style={[styles.hubItemVertical, {opacity: 0.5}]} disabled>
                        <View style={[styles.hubIcon, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#fff' : '#000'}]}>
                             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><Circle cx="12" cy="13" r="4"/></Svg>
                        </View>
                        <Text style={[styles.hubLabelVertical, { color: isDarkMode ? 'white' : 'black' }]}>Photos</Text>
                    </TouchableOpacity>
                     <TouchableOpacity style={[styles.hubItemVertical, {opacity: 0.5}]} disabled>
                        <View style={[styles.hubIcon, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#fff' : '#000'}]}>
                             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2"><Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><Polyline points="14 2 14 8 20 8"/></Svg>
                        </View>
                        <Text style={[styles.hubLabelVertical, { color: isDarkMode ? 'white' : 'black' }]}>GIFs</Text>
                    </TouchableOpacity>
                     <TouchableOpacity style={[styles.hubItemVertical, {opacity: 0.5}]} disabled>
                        <View style={[styles.hubIcon, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#fff' : '#000'}]}>
                             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2"><Path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><Polyline points="13 2 13 9 20 9"/></Svg>
                        </View>
                        <Text style={[styles.hubLabelVertical, { color: isDarkMode ? 'white' : 'black' }]}>Files</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    </Modal>
  );

  if (selectedConvo) {
    return (
      <View style={styles.container}>
        {renderFeaturesHub()}
        {renderVoteCreator()}
        {renderEventMenu()}
        <View style={styles.chatHeader}>
           <TouchableOpacity onPress={() => setSelectedConvo(null)} style={{marginRight: 10, padding: 8}}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode?'white':'black'} strokeWidth="2.5"><Path d="M19 12H5M12 19l-7-7 7-7"/></Svg>
           </TouchableOpacity>
           
           <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', marginRight: 40}} onPress={() => {
               setNewTitle(selectedConvo.title);
               setShowChatDetails(true);
           }}>
               <View style={{alignItems: 'center'}}>
                   {selectedConvo.isGroup ? (
                       <View style={{width: 40 + ((Math.min(selectedConvo.participants.length, 3)-1)*24), height: 40, marginBottom: 4, transform: [{scale: 0.7}]}}>
                           {renderGroupAvatar(selectedConvo.participants)}
                       </View>
                   ) : (
                       <Image source={{ uri: selectedConvo.image }} style={{width: 30, height: 30, borderRadius: 15, marginBottom: 4}} />
                   )}
                   <Text style={{fontSize: 14, fontWeight: '700', color: isDarkMode ? 'white' : 'black'}}>{selectedConvo.title}</Text>
               </View>
           </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
           <FlatList
             data={messages}
             keyExtractor={(item, index) => item.id || index.toString()}
             contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
             renderItem={renderMessage}
             inverted // Standard chat behavior
           />
           <View style={styles.inputArea}>
             <TouchableOpacity 
                style={styles.attachBtn}
                onPress={() => setShowFeaturesHub(true)}
             >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "#999" : "#666"} strokeWidth="2">
                    <Path d="M12 5v14M5 12h14" />
                </Svg>
             </TouchableOpacity>
             <TextInput 
               style={styles.input} 
               value={input} 
               onChangeText={setInput} 
               placeholder="Message..." 
               placeholderTextColor="#999"
             />
             {input.length > 0 && (
                 <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                   <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></Svg>
                 </TouchableOpacity>
             )}
           </View>
        </KeyboardAvoidingView>

        {/* Chat Details Modal */}
        <Modal visible={showChatDetails} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowChatDetails(false)}>
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Details</Text>
                    <TouchableOpacity onPress={() => setShowChatDetails(false)}>
                        <Text style={styles.closeText}>Done</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{padding: 24}}>
                    <View style={{alignItems: 'center', marginBottom: 32}}>
                        {selectedConvo.isGroup ? renderGroupAvatar(selectedConvo.participants) : (
                            <Image source={{ uri: selectedConvo.image }} style={{width: 80, height: 80, borderRadius: 40}} />
                        )}
                        
                        {isEditingTitle ? (
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 16}}>
                                <TextInput 
                                    style={{fontSize: 24, fontWeight: 'bold', color: isDarkMode ? 'white' : 'black', borderBottomWidth: 1, borderColor: '#10b981', minWidth: 150, textAlign: 'center'}}
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                    autoFocus
                                />
                                <TouchableOpacity onPress={handleSaveTitle} style={{marginLeft: 8}}>
                                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><Path d="M20 6L9 17l-5-5"/></Svg>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setIsEditingTitle(true)} style={{flexDirection: 'row', alignItems: 'center', marginTop: 16}}>
                                <Text style={[styles.chatTitle, {fontSize: 24}]}>{selectedConvo.title}</Text>
                                {selectedConvo.isGroup && (
                                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{marginLeft: 8}}>
                                        <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </Svg>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <Text style={styles.sectionHeader}>MEMBERS</Text>
                    <View style={{backgroundColor: isDarkMode ? '#1E1E1E' : 'white', borderRadius: 12, overflow: 'hidden'}}>
                        {selectedConvo.participants.map((pid, idx) => {
                            const isMe = pid === CURRENT_USER.id;
                            const friend = isMe ? CURRENT_USER : MOCK_FRIENDS.find(f => f.id === pid);
                            if (!friend) return null;
                            
                            return (
                                <View key={pid} style={[styles.memberRow, idx === selectedConvo.participants.length - 1 && {borderBottomWidth: 0}]}>
                                    <Image source={{ uri: friend.avatar }} style={styles.memberAvatar} />
                                    <Text style={styles.memberName}>{isMe ? 'You' : friend.name}</Text>
                                </View>
                            );
                        })}
                    </View>

                    <TouchableOpacity 
                        style={{marginTop: 32, backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center'}}
                        onPress={handleDeleteConversation}
                    >
                        <Text style={{color: '#ef4444', fontWeight: 'bold', fontSize: 16}}>Delete Conversation</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Circle</Text>
      </View>
      
      {/* Status Composer */}
      <StatusComposer isDarkMode={isDarkMode} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#999' : '#999'} strokeWidth="2" style={{marginRight: 8}}>
              <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </Svg>
          <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
          />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ListEmptyComponent={
            <View style={{alignItems:'center', marginTop: 40}}>
                <Text style={{color: isDarkMode ? '#666' : '#999', fontFamily:'Inter'}}>No conversations found.</Text>
            </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.convoItem} onPress={() => setSelectedConvo(item)}>
            {item.isGroup ? renderGroupAvatar(item.participants) : (
                <Image source={{ uri: item.image }} style={styles.avatar} />
            )}
            <View style={{marginLeft: 12, flex: 1, justifyContent: 'center'}}>
               <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 2}}>
                   <Text style={styles.convoName}>{item.title}</Text>
                   <Text style={styles.convoTime}>
                       {new Date(item.lastMessageTimestamp).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                   </Text>
               </View>
               <View style={{flexDirection: 'row', alignItems: 'center'}}>
                   <Text style={[styles.convoMsg, item.lastMessage.startsWith('📅') ? {color: isDarkMode ? 'white' : 'black'} : {}]} numberOfLines={2}>
                       {item.lastMessage.startsWith('📅') ? 'Event Proposal' : item.lastMessage}
                   </Text>
                   <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#666' : '#ccc'} strokeWidth="2" style={{marginLeft: 'auto'}}>
                       <Polyline points="9 18 15 12 9 6" />
                   </Svg>
               </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#000' : '#fff' },
  header: { padding: 16, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#10b981', fontFamily: 'Inter' },
  headerSubtitle: { fontSize: 10, fontWeight: '900', color: '#71717a', letterSpacing: 2, fontFamily: 'Inter', marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7', marginHorizontal: 16, padding: 10, borderRadius: 10, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter' },

  convoItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: isDark ? '#333' : '#c6c6c8' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  groupAvatarContainer: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' },
  groupAvatarPart: { resizeMode: 'cover' },
  
  convoName: { fontSize: 16, fontWeight: '600', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  convoMsg: { fontSize: 15, color: isDark ? '#8e8e93' : '#8e8e93', fontFamily: 'Inter', flex: 1, marginRight: 8 },
  convoTime: { fontSize: 14, color: isDark ? '#8e8e93' : '#8e8e93' },
  
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingTop: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: isDark ? '#333' : '#b2b2b2', backgroundColor: isDark ? '#1E1E1E' : 'rgba(249,249,249,0.94)' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  chatTitle: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  chatSubtitle: { fontSize: 12, color: '#71717a', fontFamily: 'Inter' },
  
  msgRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 4 },
  msgAvatarPlaceholder: { width: 28, marginRight: 8 },
  
  msgBubble: { padding: 10, paddingHorizontal: 14, borderRadius: 22, maxWidth: '75%' },
  msgMe: { backgroundColor: '#10b981' },
  msgOther: { backgroundColor: isDark ? '#26262a' : '#e9e9eb' },
  msgText: { fontSize: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  senderName: { fontSize: 10, color: '#999', marginBottom: 2, marginLeft: 4 },
  
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: 30, backgroundColor: isDark ? '#1E1E1E' : '#f9f9f9', borderTopWidth: StyleSheet.hairlineWidth, borderColor: isDark ? '#333' : '#b2b2b2' },
  input: { flex: 1, height: 36, backgroundColor: isDark ? '#000' : 'white', borderRadius: 18, paddingHorizontal: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter', marginHorizontal: 8, borderWidth: 1, borderColor: isDark ? '#333' : '#c6c6c8' },
  sendBtn: { width: 32, height: 32, backgroundColor: '#10b981', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  attachBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: isDark ? '#000' : '#f2f2f7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', backgroundColor: isDark ? '#1c1c1e' : 'white' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: isDark ? 'white' : 'black' },
  closeText: { color: '#10b981', fontSize: 17, fontWeight: '600' },
  sectionHeader: { fontSize: 13, color: '#6d6d72', marginBottom: 8, marginLeft: 16, textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: isDark ? '#333' : '#c6c6c8', backgroundColor: isDark ? '#1c1c1e' : 'white' },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  memberName: { fontSize: 16, fontWeight: '400', color: isDark ? 'white' : 'black' },

  // New Event Widget Styles
  eventCard: { width: '85%', borderRadius: 28, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  eventHeader: { padding: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  eventProposer: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  eventTitle: { color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  eventTime: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  eventMenuBtn: { padding: 4 },
  
  eventParticipants: { paddingHorizontal: 20, paddingBottom: 20 },
  invitedLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 12, letterSpacing: 0.5, textAlign: 'center' },
  avatarRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  avatarContainer: { alignItems: 'center' },
  participantAvatar: { width: 40, height: 40, borderRadius: 20, marginBottom: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  participantName: { color: 'white', fontSize: 11, fontWeight: '600' },
  statusBadgeGreen: { position: 'absolute', bottom: 16, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4ade80', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'white' },
  statusBadgeRed: { position: 'absolute', bottom: 16, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'white' },

  eventActions: { flexDirection: 'row', padding: 12, gap: 12, backgroundColor: 'rgba(0,0,0,0.1)' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  actionBtnGoing: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  actionBtnNotGoing: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  actionBtnInactive: { backgroundColor: 'transparent' },
  actionBtnText: { fontWeight: 'bold', fontSize: 13 },

  // Vote Styles
  voteCard: { width: '85%', borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  voteHeader: { marginBottom: 20 },
  voteQuestion: { fontSize: 20, fontWeight: 'bold', color: isDark ? 'white' : 'black', marginBottom: 4 },
  voteType: { fontSize: 10, fontWeight: '900', color: '#10b981', letterSpacing: 1, textTransform: 'uppercase' },
  voteContext: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
  voteOptions: { gap: 12 },
  voteOption: { borderRadius: 12, backgroundColor: isDark ? '#1c1c1e' : '#f3f4f6', borderWidth: 1, borderColor: 'transparent' },
  voteOptionSelected: { borderColor: '#10b981', borderWidth: 2, backgroundColor: 'transparent' },
  voteOptionText: { fontSize: 15, color: isDark ? 'white' : 'black', fontWeight: '500' },
  voteAddOption: { marginTop: 16, alignItems: 'center', padding: 10 },
  
  // Vote Creator Modal
  label: { fontSize: 14, fontWeight: '600', color: isDark ? '#ccc' : '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  voteInput: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter', marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  createVoteBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  createVoteText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Hub Styles
  hubOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  hubContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  hubTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center' },
  hubItem: { alignItems: 'center', width: 80 },
  hubItemVertical: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' },
  hubIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  hubLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  hubLabelVertical: { fontSize: 16, fontWeight: '600' }
});

export default SocialDashboard;