import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Switch, Image, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useEventCreation } from '../hooks/useEventCreation';
import { Friend, CalendarEvent } from '../types';
import { ChatService } from '../services/ChatService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  isDarkMode: boolean;
  friends: Friend[];
  initialStartTime?: number | null;
  initialEvent?: CalendarEvent | null;
  initialParticipants?: string[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CreateEventModal: React.FC<Props> = ({ visible, onClose, onSave, isDarkMode, friends, initialStartTime, initialEvent, initialParticipants }) => {
  const styles = getStyles(isDarkMode);
  
  // Local state for calendar navigation and accordion
  const [viewingDate, setViewingDate] = useState(new Date());
  const [expandedHour, setExpandedHour] = useState<number | null>(null);
  const [friendSearch, setFriendSearch] = useState('');

  const {
    title, setTitle,
    location, setLocation,
    isAllDay, setIsAllDay,
    selectedFriends, setSelectedFriends,
    pickedStartTime, setPickedStartTime,
    pickedEndTime, setPickedEndTime,
    color, setColor,
    step, setStep,
    selectionMode, setSelectionMode,
    isFriendBusy,
    getConflictingHours
  } = useEventCreation(friends);

  // Initialize with passed start time if available or initialEvent
  useEffect(() => {
    if (visible) {
        setFriendSearch(''); // Reset search
        if (initialEvent) {
            setTitle(initialEvent.title);
            setLocation(initialEvent.location || '');
            setIsAllDay(initialEvent.isAllDay || false);
            setSelectedFriends(initialEvent.participants || []);
            setPickedStartTime(initialEvent.timestamp);
            setPickedEndTime(initialEvent.endTime);
            setColor(initialEvent.color || '#10b981');
            setViewingDate(new Date(initialEvent.timestamp));
        } else if (initialStartTime) {
            // Reset fields for new event
            setTitle('');
            setLocation('');
            setIsAllDay(false);
            setSelectedFriends(initialParticipants || []);
            setColor('#10b981');
            
            setPickedStartTime(initialStartTime);
            setPickedEndTime(initialStartTime + 3600000); // 1 hour default
            setViewingDate(new Date(initialStartTime));
        } else {
            // Reset fields for new event (no time)
            setTitle('');
            setLocation('');
            setIsAllDay(false);
            setSelectedFriends(initialParticipants || []);
            setColor('#10b981');
            setPickedStartTime(null);
            setPickedEndTime(null);
            setViewingDate(new Date());
        }
    }
  }, [visible, initialStartTime, initialEvent, initialParticipants]);

  const handleSave = () => {
    if (!title || !pickedStartTime) return;
    
    const newEvent = {
        id: initialEvent ? initialEvent.id : (Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)),
        title,
        location,
        isAllDay,
        participants: selectedFriends,
        timestamp: pickedStartTime,
        endTime: pickedEndTime || (pickedStartTime + 3600000), // Default 1h
        color,
        status: 'proposed',
        type: selectedFriends.length > 0 ? 'group' : 'solo'
    } as CalendarEvent;
    
    onSave(newEvent);

    // ChatService.sendMessage is now handled by EventPlanner's handleCreateEvent
    
    onClose();
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Select Time';
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Select Date';
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const toggleFriend = (id: string) => {
    if (selectedFriends.includes(id)) {
      setSelectedFriends(selectedFriends.filter(fid => fid !== id));
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  };

  // Calendar Logic
  const changeMonth = (delta: number) => {
    const d = new Date(viewingDate);
    d.setMonth(d.getMonth() + delta);
    setViewingDate(d);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), day);
    
    // Get base date from existing selection or now
    let base = selectionMode === 'start' 
        ? (pickedStartTime ? new Date(pickedStartTime) : new Date())
        : (pickedEndTime ? new Date(pickedEndTime) : new Date());

    // Update YMD
    base.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    
    const timestamp = base.getTime();
    
    if (selectionMode === 'start') setPickedStartTime(timestamp);
    else setPickedEndTime(timestamp);
    
    if (isAllDay) {
        setStep('info');
    } else {
        setStep('hours');
        setExpandedHour(null);
    }
  };

  // Time Logic
  const handleTimeSelect = (hour: number, minute: number) => {
      let base = selectionMode === 'start' 
          ? (pickedStartTime ? new Date(pickedStartTime) : new Date())
          : (pickedEndTime ? new Date(pickedEndTime) : new Date());
      
      base.setHours(hour);
      base.setMinutes(minute);
      base.setSeconds(0);
      base.setMilliseconds(0);

      const timestamp = base.getTime();

      if (selectionMode === 'start') setPickedStartTime(timestamp);
      else setPickedEndTime(timestamp);
      
      setStep('info');
  };

  const toggleHourAccordion = (h: number) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedHour(expandedHour === h ? null : h);
  };

  const renderInfoStep = () => (
    <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
        <TextInput 
            style={styles.titleInput}
            placeholder="Name your plan..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={title}
            onChangeText={setTitle}
            multiline
        />

        <TouchableOpacity style={styles.card} onPress={() => setStep('friends')}>
            <View style={styles.cardRow}>
                <View>
                    <Text style={styles.cardLabel}>PEOPLE</Text>
                    {selectedFriends.length === 0 ? (
                        <Text style={styles.cardValue}>Solo Activity</Text>
                    ) : (
                        <View style={styles.avatarRow}>
                            {selectedFriends.map((id, idx) => {
                                const f = friends.find(friend => friend.id === id);
                                if (!f) return null;
                                return (
                                    <Image key={id} source={{ uri: f.avatar }} style={[styles.avatar, { marginLeft: idx > 0 ? -12 : 0 }]} />
                                );
                            })}
                        </View>
                    )}
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#666' : '#ccc'} strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                </Svg>
            </View>
        </TouchableOpacity>

        <View style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>ALL DAY</Text>
                <Switch 
                    value={isAllDay} 
                    onValueChange={setIsAllDay}
                    trackColor={{ false: isDarkMode ? '#333' : '#e4e4e7', true: color }}
                    thumbColor={'white'}
                />
            </View>
        </View>

        <View style={styles.timeRow}>
            <TouchableOpacity 
                style={[styles.timeCard, { marginRight: 8 }]} 
                onPress={() => {
                    setSelectionMode('start');
                    setStep('calendar');
                }}
            >
                <Text style={styles.cardLabel}>STARTS</Text>
                <Text style={styles.timeValue}>{pickedStartTime ? formatDate(pickedStartTime) : 'TBD'}</Text>
                <Text style={styles.timeSubValue}>{formatTime(pickedStartTime)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.timeCard, { marginLeft: 8 }]}
                onPress={() => {
                    setSelectionMode('end');
                    setStep('calendar');
                }}
            >
                <Text style={styles.cardLabel}>ENDS</Text>
                <Text style={styles.timeValue}>{pickedEndTime ? formatDate(pickedEndTime) : 'TBD'}</Text>
                <Text style={styles.timeSubValue}>{formatTime(pickedEndTime)}</Text>
            </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.cardLabel}>LOCATION</Text>
            <TextInput 
                style={styles.plainInput}
                placeholder="Add location"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={location}
                onChangeText={setLocation}
            />
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={[styles.cardLabel, { marginBottom: 12 }]}>COLOR</Text>
            <View style={styles.colorRow}>
                {COLORS.map(c => (
                    <TouchableOpacity 
                        key={c} 
                        style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
                        onPress={() => setColor(c)}
                    >
                        {color === c && (
                            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                <Path d="M20 6L9 17l-5-5" />
                            </Svg>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    </ScrollView>
  );

  const renderFriendsStep = () => {
    const filteredFriends = friends.filter(f => 
        f.name.toLowerCase().includes(friendSearch.toLowerCase())
    );

    return (
    <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.searchContainer}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#999' : '#666'} strokeWidth="2" style={{marginRight: 12}}>
                <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </Svg>
            <TextInput
                style={styles.searchInput}
                placeholder="Search friends..."
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={friendSearch}
                onChangeText={setFriendSearch}
            />
        </View>

        {filteredFriends.map(friend => {
            const isSelected = selectedFriends.includes(friend.id);
            const isBusy = isFriendBusy(friend.id);
            const hour = pickedStartTime ? new Date(pickedStartTime).getHours() : 0;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            
            // Allow deselecting even if busy, but don't allow selecting if busy
            const isDisabled = isBusy && !isSelected;

            let rowStyle: any = styles.friendRow;
            let textStyle: any = styles.friendName;
            
            if (isSelected) {
                rowStyle = [styles.friendRow, styles.friendRowSelected];
                textStyle = [styles.friendName, { color: 'white' }];
            } else if (isBusy) {
                rowStyle = [styles.friendRow, styles.friendRowBusy];
                textStyle = [styles.friendName, { color: isDarkMode ? '#fca5a5' : '#dc2626' }];
            }

            return (
                <TouchableOpacity 
                    key={friend.id} 
                    style={rowStyle}
                    onPress={() => toggleFriend(friend.id)}
                    disabled={isDisabled}
                    activeOpacity={0.7}
                >
                    <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={textStyle}>{friend.name}</Text>
                        {isBusy && (
                            <Text style={styles.busyLabel}>BUSY AT {hour12} {ampm}</Text>
                        )}
                    </View>
                    
                    {isSelected && (
                        <View style={styles.checkCircle}>
                             <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4">
                                <Path d="M20 6L9 17l-5-5" />
                            </Svg>
                        </View>
                    )}
                </TouchableOpacity>
            );
        })}
    </ScrollView>
    );
  };

  // ... (rest of the component)

  const renderCalendarStep = () => {
    const year = viewingDate.getFullYear();
    const month = viewingDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for(let i=0; i<firstDay; i++) days.push(null);
    for(let i=1; i<=daysInMonth; i++) days.push(i);

    // Get currently selected day to highlight
    const currentSelectionTs = selectionMode === 'start' ? pickedStartTime : pickedEndTime;
    const currentSelectionDate = currentSelectionTs ? new Date(currentSelectionTs) : null;
    
    return (
        <View style={styles.scrollContent}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
                     <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2"><Path d="M15 18l-6-6 6-6" /></Svg>
                </TouchableOpacity>
                <Text style={styles.calMonthTitle}>
                    {viewingDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2"><Path d="M9 18l6-6-6-6" /></Svg>
                </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={styles.weekRow}>
                {['S','M','T','W','T','F','S'].map((d,i) => (
                    <Text key={i} style={styles.weekDayText}>{d}</Text>
                ))}
            </View>

            {/* Grid */}
            <View style={styles.calGrid}>
                {days.map((d, i) => {
                    if (!d) return <View key={i} style={styles.calCell} />;
                    
                    const isSelected = currentSelectionDate 
                        && currentSelectionDate.getDate() === d 
                        && currentSelectionDate.getMonth() === month 
                        && currentSelectionDate.getFullYear() === year;

                    return (
                        <TouchableOpacity 
                            key={i} 
                            style={[styles.calCell, isSelected && styles.calCellSelected, { backgroundColor: isSelected ? color : 'transparent' }]}
                            onPress={() => handleDateSelect(d)}
                        >
                            <Text style={[styles.calDateText, isSelected && { color: 'white' }]}>{d}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
  };

  const renderHoursStep = () => {
    const conflictingHours = getConflictingHours();
    
    return (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
            {HOURS.map(h => {
                const isConflict = conflictingHours.includes(h);
                const isExpanded = expandedHour === h;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const hour12 = h % 12 || 12;

                if (isConflict) {
                     return (
                         <View key={h} style={[styles.hourRow, styles.hourRowConflict]}>
                             <Text style={[styles.hourText, styles.hourTextConflict]}>{hour12} {ampm}</Text>
                             <View style={styles.conflictBadge}>
                                 <Text style={styles.conflictText}>UNAVAILABLE</Text>
                             </View>
                         </View>
                     );
                }

                return (
                    <View key={h}>
                        <TouchableOpacity 
                            style={[styles.hourRow, isExpanded && styles.hourRowExpanded]}
                            onPress={() => toggleHourAccordion(h)}
                        >
                             <Text style={[styles.hourText, isExpanded && { color: 'white' }]}>{hour12} {ampm}</Text>
                             {isExpanded && (
                                 <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                     <Path d="M19 9l-7 7-7-7" />
                                 </Svg>
                             )}
                        </TouchableOpacity>
                        
                        {isExpanded && (
                            <View style={styles.minuteContainer}>
                                {[0, 15, 30, 45].map(m => (
                                    <TouchableOpacity 
                                        key={m} 
                                        style={styles.minuteBtn}
                                        onPress={() => handleTimeSelect(h, m)}
                                    >
                                        <Text style={styles.minuteText}>:{m === 0 ? '00' : m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
  };

  const handleHeaderBack = () => {
      if (step === 'info') onClose();
      else setStep('info');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleHeaderBack} style={styles.closeBtn}>
                   {step === 'info' ? (
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2">
                            <Path d="M18 6L6 18M6 6l12 12" />
                        </Svg>
                   ) : (
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2">
                             <Path d="M15 18l-6-6 6-6" />
                        </Svg>
                   )}
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {step === 'info' ? 'NEW PLAN' : step.toUpperCase()}
                </Text>
                <View style={{ width: 24 }} /> 
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {step === 'info' && renderInfoStep()}
                {step === 'friends' && renderFriendsStep()}
                {step === 'calendar' && renderCalendarStep()}
                {step === 'hours' && renderHoursStep()}
            </View>

            {/* Sticky Save Button (Only on Info Step) */}
            {step === 'info' && (
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: (!title || !pickedStartTime) ? (isDarkMode ? '#333' : '#e4e4e7') : color }]}
                        disabled={!title || !pickedStartTime}
                        onPress={handleSave}
                    >
                        <Text style={[styles.saveText, { color: (!title || !pickedStartTime) ? '#999' : 'white' }]}>
                            {selectedFriends.length > 0 ? 'PROPOSE EVENT' : 'CREATE EVENT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Done Button (Friends only) - Calendar/Hours have their own nav logic */}
            {step === 'friends' && (
                 <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: color }]}
                        onPress={() => setStep('info')}
                    >
                        <Text style={[styles.saveText, { color: 'white' }]}>
                            DONE
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </Modal>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 12, fontWeight: '900', color: isDark ? 'white' : 'black', letterSpacing: 1, fontFamily: 'Inter' },
  
  content: { flex: 1 },
  scrollContent: { padding: 24 },
  
  titleInput: { fontSize: 32, fontWeight: '700', color: isDark ? 'white' : 'black', fontFamily: 'Inter', marginBottom: 32, padding: 0 },
  
  card: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 10, fontWeight: '900', color: '#71717a', letterSpacing: 1, fontFamily: 'Inter', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '600', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  
  avatarRow: { flexDirection: 'row', marginTop: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#1E1E1E' : '#FFFFFF' },

  timeRow: { flexDirection: 'row', marginTop: 16 },
  timeCard: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  timeValue: { fontSize: 16, fontWeight: '600', color: isDark ? 'white' : 'black', fontFamily: 'Inter', marginTop: 4 },
  timeSubValue: { fontSize: 13, color: '#71717a', fontFamily: 'Inter', marginTop: 2 },
  
  plainInput: { fontSize: 16, fontWeight: '600', color: isDark ? 'white' : 'black', fontFamily: 'Inter', padding: 0, marginTop: 4 },
  
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 2, borderColor: isDark ? 'white' : 'black' },
  
  footer: { padding: 24, paddingTop: 12, backgroundColor: isDark ? '#121212' : '#FDFCFB', borderTopWidth: 1, borderColor: isDark ? '#27272a' : '#f4f4f5' },
  saveBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  saveText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, fontFamily: 'Inter' },

  // Friends Step Styles
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E1E1E' : '#f4f4f5', padding: 12, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: isDark ? '#333' : '#e4e4e7' },
  searchInput: { flex: 1, fontSize: 14, color: isDark ? 'white' : 'black', fontFamily: 'Inter', fontWeight: '600' },
  friendRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  friendRowSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  friendRowBusy: { backgroundColor: isDark ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2', borderColor: isDark ? 'rgba(127, 29, 29, 0.4)' : '#fee2e2' },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  friendName: { fontSize: 14, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  busyLabel: { fontSize: 10, fontWeight: '900', color: '#ef4444', marginTop: 4, letterSpacing: 0.5 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },

  // Calendar Styles
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  calMonthTitle: { fontSize: 16, fontWeight: '900', color: isDark ? 'white' : 'black', fontFamily: 'Inter', letterSpacing: 1 },
  calNavBtn: { padding: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 12 },
  weekDayText: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '900', color: '#71717a', fontFamily: 'Inter' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 12 },
  calCellSelected: { backgroundColor: '#10b981' },
  calDateText: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#ccc' : '#333', fontFamily: 'Inter' },

  // Hours Styles
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 8, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  hourRowExpanded: { backgroundColor: '#10b981', borderColor: '#10b981' },
  hourRowConflict: { backgroundColor: isDark ? 'rgba(127, 29, 29, 0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(127, 29, 29, 0.2)' : '#fee2e2', opacity: 0.8 },
  hourText: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  hourTextConflict: { color: isDark ? '#fca5a5' : '#dc2626' },
  conflictBadge: { backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  conflictText: { fontSize: 9, fontWeight: '900', color: '#dc2626' },
  minuteContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
  minuteBtn: { flex: 1, backgroundColor: isDark ? '#27272a' : '#f4f4f5', padding: 12, borderRadius: 12, alignItems: 'center' },
  minuteText: { fontSize: 14, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' }
});

export default CreateEventModal;