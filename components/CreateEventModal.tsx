import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Switch, Image, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useEventCreation } from '../hooks/useEventCreation';
import { Friend, CalendarEvent } from '../types';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import { eventColors } from '../theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  friends: Friend[];
  initialStartTime?: number | null;
  initialEvent?: CalendarEvent | null;
  initialParticipants?: string[];
}

// A new event starts on the first of the event colors.
const DEFAULT_EVENT_COLOR = eventColors[0].base;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CreateEventModal: React.FC<Props> = ({ visible, onClose, onSave, friends, initialStartTime, initialEvent, initialParticipants }) => {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);
  
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
            setColor(initialEvent.color || DEFAULT_EVENT_COLOR);
            setViewingDate(new Date(initialEvent.timestamp));
        } else if (initialStartTime) {
            // Reset fields for new event
            setTitle('');
            setLocation('');
            setIsAllDay(false);
            setSelectedFriends(initialParticipants || []);
            setColor(DEFAULT_EVENT_COLOR);
            
            setPickedStartTime(initialStartTime);
            setPickedEndTime(initialStartTime + 3600000); // 1 hour default
            setViewingDate(new Date(initialStartTime));
        } else {
            // Reset fields for new event (no time)
            setTitle('');
            setLocation('');
            setIsAllDay(false);
            setSelectedFriends(initialParticipants || []);
            setColor(DEFAULT_EVENT_COLOR);
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
            placeholderTextColor={colors.placeholder}
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
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                </Svg>
            </View>
        </TouchableOpacity>

        <View style={[styles.card, { marginTop: spacing.base }]}>
            <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>ALL DAY</Text>
                <Switch 
                    value={isAllDay} 
                    onValueChange={setIsAllDay}
                    trackColor={{ false: colors.border, true: color }}
                    thumbColor={colors.onColor}
                />
            </View>
        </View>

        <View style={styles.timeRow}>
            <TouchableOpacity 
                style={[styles.timeCard, { marginRight: spacing.sm }]} 
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
                style={[styles.timeCard, { marginLeft: spacing.sm }]}
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

        <View style={[styles.card, { marginTop: spacing.base }]}>
            <Text style={styles.cardLabel}>LOCATION</Text>
            <TextInput 
                style={styles.plainInput}
                placeholder="Add location"
                placeholderTextColor={colors.placeholder}
                value={location}
                onChangeText={setLocation}
            />
        </View>

        <View style={[styles.card, { marginTop: spacing.base }]}>
            <Text style={[styles.cardLabel, { marginBottom: spacing.md }]}>COLOR</Text>
            <View style={styles.colorRow}>
                {eventColors.map(({ base: c }) => (
                    <TouchableOpacity 
                        key={c} 
                        style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorSelected]}
                        onPress={() => setColor(c)}
                    >
                        {color === c && (
                            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.onColor} strokeWidth="4">
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
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" style={{marginRight: spacing.md}}>
                <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </Svg>
            <TextInput
                style={styles.searchInput}
                placeholder="Search friends..."
                placeholderTextColor={colors.placeholder}
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
                textStyle = [styles.friendName, { color: colors.onPrimary }];
            } else if (isBusy) {
                rowStyle = [styles.friendRow, styles.friendRowBusy];
                textStyle = [styles.friendName, { color: colors.danger }];
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
                             <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="4">
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
                     <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2"><Path d="M15 18l-6-6 6-6" /></Svg>
                </TouchableOpacity>
                <Text style={styles.calMonthTitle}>
                    {viewingDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2"><Path d="M9 18l6-6-6-6" /></Svg>
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
                            <Text style={[styles.calDateText, isSelected && { color: colors.onColor }]}>{d}</Text>
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
                             <Text style={[styles.hourText, isExpanded && { color: colors.onPrimary }]}>{hour12} {ampm}</Text>
                             {isExpanded && (
                                 <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth="3">
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
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2">
                            <Path d="M18 6L6 18M6 6l12 12" />
                        </Svg>
                   ) : (
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2">
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
                        style={[styles.saveBtn, { backgroundColor: (!title || !pickedStartTime) ? colors.border : color }]}
                        disabled={!title || !pickedStartTime}
                        onPress={handleSave}
                    >
                        <Text style={[styles.saveText, { color: (!title || !pickedStartTime) ? colors.textDisabled : colors.onColor }]}>
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
                        <Text style={[styles.saveText, { color: colors.onColor }]}>
                            DONE
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </Modal>
  );
};

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  closeBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1, fontFamily: 'Manrope' },
  
  content: { flex: 1 },
  scrollContent: { padding: spacing.xl },
  
  titleInput: { fontSize: typography.display.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope', marginBottom: spacing['2xl'], padding: 0 },
  
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, fontFamily: 'Manrope', marginBottom: spacing.xs },
  cardValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: 'Manrope' },
  
  avatarRow: { flexDirection: 'row', marginTop: spacing.xs },
  avatar: { width: 32, height: 32, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.surface },

  timeRow: { flexDirection: 'row', marginTop: spacing.base },
  timeCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  timeValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: 'Manrope', marginTop: spacing.xs },
  timeSubValue: { fontSize: typography.label.fontSize, color: colors.textSecondary, fontFamily: 'Manrope', marginTop: spacing.xs },
  
  plainInput: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.textPrimary, fontFamily: 'Manrope', padding: 0, marginTop: spacing.xs },
  
  colorRow: { flexDirection: 'row', gap: spacing.md },
  colorCircle: { width: 32, height: 32, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 2, borderColor: colors.textPrimary },
  
  footer: { padding: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  saveBtn: { height: 56, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  saveText: { fontSize: typography.caption.fontSize, fontWeight: '700', letterSpacing: 1, fontFamily: 'Manrope' },

  // Friends Step Styles
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: typography.label.fontSize, color: colors.textPrimary, fontFamily: 'Manrope', fontWeight: '600' },
  friendRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: radius.xl, marginBottom: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  friendRowSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  friendRowBusy: { backgroundColor: colors.dangerSurface, borderColor: colors.dangerSurface },
  friendAvatar: { width: 48, height: 48, borderRadius: radius.pill, marginRight: spacing.base },
  friendName: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope' },
  busyLabel: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.danger, marginTop: spacing.xs, letterSpacing: 0.5 },
  checkCircle: { width: 24, height: 24, borderRadius: radius.pill, backgroundColor: colors.onColor, justifyContent: 'center', alignItems: 'center' },

  // Calendar Styles
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  calMonthTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope', letterSpacing: 1 },
  calNavBtn: { padding: spacing.sm },
  weekRow: { flexDirection: 'row', marginBottom: spacing.md },
  weekDayText: { width: '14.28%', textAlign: 'center', fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, fontFamily: 'Manrope' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm, borderRadius: radius.md },
  calCellSelected: { backgroundColor: colors.primary },
  calDateText: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope' },

  // Hours Styles
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  hourRowExpanded: { backgroundColor: colors.primary, borderColor: colors.primary },
  hourRowConflict: { backgroundColor: colors.dangerSurface, borderColor: colors.dangerSurface, opacity: 0.8 },
  hourText: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope' },
  hourTextConflict: { color: colors.danger },
  conflictBadge: { backgroundColor: colors.dangerSurface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  conflictText: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.danger },
  minuteContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base, paddingHorizontal: spacing.xs },
  minuteBtn: { flex: 1, backgroundColor: colors.surfaceAlt, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  minuteText: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope' }
});

export default CreateEventModal;