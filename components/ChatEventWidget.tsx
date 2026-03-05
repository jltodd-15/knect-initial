import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { EventProposal, PollOption, Vote } from '../types';
import { calculatePickOneResult, calculateRankedChoiceResult } from '../utils/votingLogic';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  proposal: EventProposal;
  currentUserId: string;
  onUpdate: (updates: Partial<EventProposal>) => void;
  isDarkMode: boolean;
}

const ChatEventWidget: React.FC<Props> = ({ proposal, currentUserId, onUpdate, isDarkMode }) => {
  const styles = getStyles(isDarkMode);
  const [showPollModal, setShowPollModal] = useState(false);
  
  // Poll Creation State
  const [pollType, setPollType] = useState<'pick-one' | 'ranked-choice'>('pick-one');
  const [pollQuestion, setPollQuestion] = useState('What time works best?');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);

  // Voting State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [rankedOrder, setRankedOrder] = useState<string[]>([]);

  const handleRSVP = (status: 'yes' | 'no') => {
    const newRsvps = { ...proposal.rsvps, [currentUserId]: status };
    onUpdate({ rsvps: newRsvps });
  };

  const handleCreatePoll = () => {
    const validOptions = newOptions.filter(o => o.trim().length > 0).map((text, index) => ({
      id: `opt_${Date.now()}_${index}`,
      text
    }));

    if (validOptions.length < 2) return;

    onUpdate({
      poll: {
        id: `poll_${Date.now()}`,
        type: pollType,
        question: pollQuestion,
        options: validOptions,
        votes: [],
        status: 'active'
      }
    });
    setShowPollModal(false);
  };

  const handleVote = () => {
    if (!proposal.poll) return;

    const newVote: Vote = {
      userId: currentUserId,
      optionId: pollType === 'pick-one' ? (selectedOption || undefined) : undefined,
      rankedOptionIds: pollType === 'ranked-choice' ? rankedOrder : undefined
    };

    // Remove existing vote from this user
    const otherVotes = proposal.poll.votes.filter(v => v.userId !== currentUserId);
    const updatedVotes = [...otherVotes, newVote];

    // Calculate results immediately (for demo purposes - usually done on server or when poll closes)
    // Here we'll just update the votes. The "Close Poll" action would finalize it.
    
    onUpdate({
      poll: {
        ...proposal.poll,
        votes: updatedVotes
      }
    });
  };

  const handleClosePoll = () => {
    if (!proposal.poll) return;
    
    let result;
    if (proposal.poll.type === 'pick-one') {
      result = calculatePickOneResult(proposal.poll.options, proposal.poll.votes);
    } else {
      result = calculateRankedChoiceResult(proposal.poll.options, proposal.poll.votes);
    }

    onUpdate({
      poll: {
        ...proposal.poll,
        status: 'closed',
        winnerId: result.winnerId,
        isTie: result.isTie
      }
    });
  };

  const renderPollCreation = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Propose Change</Text>
      
      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeBtn, pollType === 'pick-one' && styles.typeBtnActive]}
          onPress={() => setPollType('pick-one')}
        >
          <Text style={[styles.typeBtnText, pollType === 'pick-one' && styles.typeBtnTextActive]}>Pick One</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, pollType === 'ranked-choice' && styles.typeBtnActive]}
          onPress={() => setPollType('ranked-choice')}
        >
          <Text style={[styles.typeBtnText, pollType === 'ranked-choice' && styles.typeBtnTextActive]}>Ranked Choice</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.input}
        value={pollQuestion}
        onChangeText={setPollQuestion}
        placeholder="Question"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Options</Text>
      {newOptions.map((opt, idx) => (
        <TextInput
          key={idx}
          style={styles.input}
          value={opt}
          onChangeText={(text) => {
            const updated = [...newOptions];
            updated[idx] = text;
            setNewOptions(updated);
          }}
          placeholder={`Option ${idx + 1}`}
          placeholderTextColor="#999"
        />
      ))}
      <TouchableOpacity onPress={() => setNewOptions([...newOptions, ''])}>
        <Text style={styles.addOptionText}>+ Add Option</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreatePoll}>
        <Text style={styles.createBtnText}>Start Vote</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPollModal(false)}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVoting = () => {
    if (!proposal.poll) return null;
    const { options, type, votes } = proposal.poll;
    const myVote = votes.find(v => v.userId === currentUserId);
    const hasVoted = !!myVote;

    // If poll is closed, show results
    if (proposal.poll.status === 'closed') {
        const winner = options.find(o => o.id === proposal.poll?.winnerId);
        return (
            <View style={styles.pollContainer}>
                <View style={styles.pollHeader}>
                    <Text style={styles.pollQuestion}>{proposal.poll.question}</Text>
                    <View style={styles.closedBadge}><Text style={styles.closedText}>CLOSED</Text></View>
                </View>
                
                {proposal.poll.isTie && (
                    <View style={styles.tieBanner}>
                        <Text style={styles.tieText}>It was a tie! Random winner selected.</Text>
                    </View>
                )}

                <View style={styles.winnerCard}>
                    <Text style={styles.winnerText}>Winner: {winner?.text}</Text>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><Path d="M22 4L12 14.01l-3-3"/></Svg>
                </View>
            </View>
        );
    }

    // Active Poll
    return (
      <View style={styles.pollContainer}>
        <Text style={styles.pollQuestion}>{proposal.poll.question}</Text>
        <Text style={styles.pollType}>{type === 'pick-one' ? 'Vote for one option' : 'Rank options in order'}</Text>

        {type === 'pick-one' ? (
          options.map(opt => (
            <TouchableOpacity 
              key={opt.id} 
              style={[styles.optionBtn, selectedOption === opt.id && styles.optionBtnSelected]}
              onPress={() => setSelectedOption(opt.id)}
            >
              <Text style={[styles.optionText, selectedOption === opt.id && styles.optionTextSelected]}>{opt.text}</Text>
              {selectedOption === opt.id && <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><Path d="M20 6L9 17l-5-5"/></Svg>}
            </TouchableOpacity>
          ))
        ) : (
          options.map(opt => {
             const rank = rankedOrder.indexOf(opt.id);
             const isSelected = rank !== -1;
             return (
                <TouchableOpacity 
                    key={opt.id}
                    style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                    onPress={() => {
                        if (isSelected) {
                            setRankedOrder(rankedOrder.filter(id => id !== opt.id));
                        } else {
                            setRankedOrder([...rankedOrder, opt.id]);
                        }
                    }}
                >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt.text}</Text>
                    {isSelected && (
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>{rank + 1}</Text>
                        </View>
                    )}
                </TouchableOpacity>
             );
          })
        )}

        <View style={styles.pollActions}>
            <TouchableOpacity style={styles.voteBtn} onPress={handleVote}>
                <Text style={styles.voteBtnText}>{hasVoted ? 'Update Vote' : 'Submit Vote'}</Text>
            </TouchableOpacity>
            {/* In real app, only creator/admin can close */}
            <TouchableOpacity style={styles.closePollBtn} onPress={handleClosePoll}>
                <Text style={styles.closePollText}>End Poll</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateBox}>
            <Text style={styles.month}>{new Date(proposal.timestamp).toLocaleDateString(undefined, {month:'short'}).toUpperCase()}</Text>
            <Text style={styles.day}>{new Date(proposal.timestamp).getDate()}</Text>
        </View>
        <View style={styles.info}>
            <Text style={styles.title}>{proposal.title}</Text>
            <Text style={styles.time}>{new Date(proposal.timestamp).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</Text>
            <Text style={styles.location}>{proposal.location}</Text>
        </View>
      </View>

      {/* Poll Section */}
      {proposal.poll ? renderVoting() : (
          <View style={styles.actions}>
            <View style={styles.rsvpRow}>
                <TouchableOpacity 
                    style={[styles.rsvpBtn, proposal.rsvps[currentUserId] === 'yes' && styles.rsvpBtnYes]}
                    onPress={() => handleRSVP('yes')}
                >
                    <Text style={[styles.rsvpText, proposal.rsvps[currentUserId] === 'yes' && {color:'white'}]}>Going</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.rsvpBtn, proposal.rsvps[currentUserId] === 'no' && styles.rsvpBtnNo]}
                    onPress={() => handleRSVP('no')}
                >
                    <Text style={[styles.rsvpText, proposal.rsvps[currentUserId] === 'no' && {color:'white'}]}>Can't Go</Text>
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={() => setShowPollModal(true)}>
                <Text style={styles.proposeText}>Propose a change?</Text>
            </TouchableOpacity>
          </View>
      )}

      <Modal visible={showPollModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            {renderPollCreation()}
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { backgroundColor: isDark ? '#1E1E1E' : 'white', borderRadius: 16, padding: 16, marginVertical: 8, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4, elevation:2 },
  header: { flexDirection: 'row', marginBottom: 16 },
  dateBox: { backgroundColor: isDark ? '#333' : '#f4f4f5', borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'center', width: 50, height: 50, marginRight: 12 },
  month: { fontSize: 10, fontWeight: '900', color: '#ef4444' },
  day: { fontSize: 18, fontWeight: '900', color: isDark ? 'white' : 'black' },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : 'black' },
  time: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  location: { fontSize: 12, color: '#71717a' },
  
  actions: { alignItems: 'center' },
  rsvpRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  rsvpBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: isDark ? '#27272a' : '#f4f4f5', alignItems: 'center' },
  rsvpBtnYes: { backgroundColor: '#10b981' },
  rsvpBtnNo: { backgroundColor: '#ef4444' },
  rsvpText: { fontWeight: '600', color: isDark ? '#ccc' : '#52525b' },
  proposeText: { fontSize: 12, color: '#3b82f6', textDecorationLine: 'underline' },

  // Poll Styles
  pollContainer: { borderTopWidth: 1, borderColor: isDark ? '#333' : '#eee', paddingTop: 12 },
  pollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pollQuestion: { fontSize: 14, fontWeight: 'bold', color: isDark ? 'white' : 'black', marginBottom: 4 },
  pollType: { fontSize: 10, color: '#71717a', marginBottom: 12, fontStyle: 'italic' },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: isDark ? '#27272a' : '#f4f4f5', marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  optionBtnSelected: { backgroundColor: '#10b981', borderColor: '#059669' },
  optionText: { color: isDark ? '#ccc' : '#333', fontWeight: '500' },
  optionTextSelected: { color: 'white', fontWeight: 'bold' },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  rankText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  
  pollActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  voteBtn: { flex: 1, backgroundColor: '#3b82f6', padding: 10, borderRadius: 8, alignItems: 'center' },
  voteBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  closePollBtn: { padding: 10, borderRadius: 8, backgroundColor: isDark ? '#333' : '#e4e4e7' },
  closePollText: { color: isDark ? '#ccc' : '#52525b', fontSize: 12, fontWeight: '600' },
  
  closedBadge: { backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  closedText: { color: 'white', fontSize: 8, fontWeight: '900' },
  tieBanner: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, marginBottom: 8 },
  tieText: { color: '#d97706', fontSize: 11, textAlign: 'center' },
  winnerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#064e3b' : '#ecfdf5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#10b981' },
  winnerText: { color: '#10b981', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: isDark ? '#1E1E1E' : 'white', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: isDark ? 'white' : 'black', marginBottom: 16, textAlign: 'center' },
  typeSelector: { flexDirection: 'row', marginBottom: 16, backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderRadius: 8, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  typeBtnText: { fontSize: 12, color: '#71717a' },
  typeBtnTextActive: { color: 'black', fontWeight: 'bold' },
  input: { backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderRadius: 8, padding: 12, color: isDark ? 'white' : 'black', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#71717a', marginBottom: 8, marginTop: 8 },
  addOptionText: { color: '#3b82f6', fontSize: 12, fontWeight: '600', marginBottom: 16 },
  createBtn: { backgroundColor: '#10b981', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  createBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#71717a' }
});

export default ChatEventWidget;
