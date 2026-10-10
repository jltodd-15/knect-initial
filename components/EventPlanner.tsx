import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, UIManager, TouchableWithoutFeedback } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CalendarEvent, DiscoveryItem } from '../types';
import CreateEventModal from './CreateEventModal';
import { calculateEventLayouts } from '../utils/calendarLayout';
import DraggableEvent from './DraggableEvent';
import { ChatService } from '../services/ChatService';
import { statusService } from '../services/StatusService';
import { MOCK_FRIENDS } from '../constants';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';
import { eventColors } from '../theme/tokens';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props { 
    initialProposal?: DiscoveryItem | null;
    initialParticipants?: string[];
}

const HOURS = Array.from({ length: 25 }, (_, i) => i);
const SLOT_HEIGHT = 80; 
const INITIAL_NOW = new Date();

const EventPlanner: React.FC<Props> = ({ initialProposal, initialParticipants }) => {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(INITIAL_NOW.getFullYear(), INITIAL_NOW.getMonth(), INITIAL_NOW.getDate()));
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([]);
  
  // For creating event from grid click
  const [preselectedTime, setPreselectedTime] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [popupEvent, setPopupEvent] = useState<{ event: CalendarEvent, x: number, y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
      if (initialProposal) {
          // Pre-fill event creation with proposal data
          const now = new Date();
          now.setHours(now.getHours() + 1, 0, 0, 0); // Default to next hour
          
          const newEvent: CalendarEvent = {
              id: Date.now().toString(),
              title: initialProposal.title,
              location: initialProposal.location || '',
              timestamp: now.getTime(),
              endTime: now.getTime() + (2 * 60 * 60 * 1000), // 2 hours default
              type: 'group',
              participants: [],
              color: eventColors[0].base,
              status: 'proposed',
              isAllDay: false
          };
          
          setEditingEvent(newEvent);
          setShowCreate(true);
      } else if (initialParticipants && initialParticipants.length > 0) {
          setShowCreate(true);
      }
  }, [initialProposal, initialParticipants]);

  useEffect(() => {
    // Mock initial data matching screenshot
    const mockDate = new Date(INITIAL_NOW.getFullYear(), INITIAL_NOW.getMonth(), INITIAL_NOW.getDate(), 18, 30).getTime();
    const initialEvents: CalendarEvent[] = [{
        id: '1', 
        title: 'MOVIE NIGHT', 
        timestamp: mockDate,
        endTime: mockDate + 10800000, // 3 hr
        type: 'personal', // Changed to personal since no participants
        location: 'TBD', 
        participants: [], 
        color: eventColors[0].base,
        status: 'confirmed', // Changed to confirmed
        isAllDay: false
    }];
    setMyEvents(initialEvents);
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Save events whenever they change
  useEffect(() => {
    // TODO: Create listener for new events
  }, [myEvents]);

  const handleDeleteEvent = (eventId: string) => {
      setMyEvents(prev => prev.filter(e => e.id !== eventId));
      setPopupEvent(null);
  };

  const handleCreateEvent = async (newEvent: CalendarEvent) => {
    // Determine status based on participants
    // If it has participants, it's a proposal. If just me, it's confirmed.
    const finalEvent: CalendarEvent = {
        ...newEvent,
        status: newEvent.participants.length > 0 ? 'proposed' : 'confirmed',
        type: newEvent.participants.length > 0 ? 'group' : 'personal'
    };

    setMyEvents(prev => {
        const exists = prev.find(e => e.id === finalEvent.id);
        let updated;
        if (exists) {
            updated = prev.map(e => e.id === finalEvent.id ? finalEvent : e);
        } else {
            updated = [...prev, finalEvent];
        }
        return updated;
    });
    setShowCreate(false);
    setPreselectedTime(null);
    setEditingEvent(null);

    // Check if event is today -> clear status
    const eventDate = new Date(finalEvent.timestamp);
    const now = new Date();
    if (eventDate.getDate() === now.getDate() && 
        eventDate.getMonth() === now.getMonth() && 
        eventDate.getFullYear() === now.getFullYear()) {
        statusService.clearStatus();
    }

    // Send to chat only if it's a group proposal
    if (finalEvent.status === 'proposed' && !editingEvent) {
        const convo = await ChatService.findOrCreateConversation(finalEvent.participants, finalEvent.title);
        await ChatService.sendMessage(convo.id, '', 'event-proposal', finalEvent);
    }
  };

  const handleEventDragEnd = (eventId: string, newStartTime: number) => {
    setMyEvents(prev => prev.map(ev => {
        if (ev.id === eventId) {
            const duration = ev.endTime - ev.timestamp;
            return {
                ...ev,
                timestamp: newStartTime,
                endTime: newStartTime + duration
            };
        }
        return ev;
    }));
  };

  const handleEventResizeEnd = (eventId: string, durationChange: number) => {
      setMyEvents(prev => prev.map(ev => {
          if (ev.id === eventId) {
              const newEndTime = ev.endTime + durationChange;
              // Prevent shrinking below start time
              if (newEndTime <= ev.timestamp) return ev;
              return {
                  ...ev,
                  endTime: newEndTime
              };
          }
          return ev;
      }));
  };

  const handleEventPress = (event: CalendarEvent) => {
      setPopupEvent({ event, x: 0, y: 0 });
  };

  const handlePopupAction = () => {
      if (popupEvent) {
          setEditingEvent(popupEvent.event);
          setShowCreate(true);
          setPopupEvent(null);
      }
  };

  const handleGridPress = (evt: any) => {
      // Calculate time from Y coordinate
      const y = evt.nativeEvent.locationY;
      
      const hourIndex = Math.floor(y / SLOT_HEIGHT);
      
      // The grid starts at 0 AM (Midnight)
      const startHour = 0;
      const clickedHour = startHour + hourIndex;

      const newDate = new Date(selectedDate);
      newDate.setHours(clickedHour);
      newDate.setMinutes(0); // Snap to start of hour
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      
      setPreselectedTime(newDate.getTime());
      setShowCreate(true);
  };

  const weekDays = useMemo(() => {
    const days = [];
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - current.getDay()); 
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  const nowLineTop = (currentTime.getHours() * SLOT_HEIGHT) + (currentTime.getMinutes() * (SLOT_HEIGHT / 60));

  const SingleMonthGrid: React.FC<{ monthDate: Date }> = ({ monthDate }) => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startPadding = firstDay.getDay();
    
    const days = [];
    for(let i=0; i<startPadding; i++) days.push(null);
    for(let i=1; i<=daysInMonth; i++) days.push(new Date(y, m, i));

    return (
        <View style={styles.monthBlock}>
            <Text style={styles.monthBlockTitle}>{monthDate.toLocaleDateString(undefined, {month:'long', year:'numeric'}).toUpperCase()}</Text>
            <View style={styles.monthHeaderRow}>
                {['S','M','T','W','T','F','S'].map((d,i) => <Text key={i} style={styles.monthHeaderDay}>{d}</Text>)}
            </View>
            <View style={styles.monthGrid}>
                {days.map((d, i) => {
                    if (!d) return <View key={i} style={styles.monthCell} />;
                    const isSelected = d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
                    const hasEvent = myEvents.some(e => {
                        const evtDate = new Date(e.timestamp);
                        return evtDate.getDate() === d.getDate() && evtDate.getMonth() === d.getMonth() && evtDate.getFullYear() === d.getFullYear();
                    });
                    
                    return (
                        <TouchableOpacity 
                            key={i} 
                            style={[styles.monthCell, isSelected && styles.monthCellSelected]}
                            onPress={() => setSelectedDate(d)}
                        >
                            <Text style={[styles.monthDateText, isSelected && {color: colors.onPrimary}]}>{d.getDate()}</Text>
                            {hasEvent && !isSelected && <View style={styles.monthDot} />}
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    );
  };

  const renderMonthView = () => {
    const months = [];
    const start = new Date(INITIAL_NOW.getFullYear(), INITIAL_NOW.getMonth(), 1);
    for(let i=0; i<12; i++) {
        const m = new Date(start);
        m.setMonth(start.getMonth() + i);
        months.push(m);
    }

    return (
      <ScrollView style={styles.monthContainer} contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
          {months.map((m, i) => <SingleMonthGrid key={i} monthDate={m} />)}
      </ScrollView>
    );
  };

  const renderWeekView = () => {
      // Define the visible window for the selected date
      // Grid starts at 0 AM and ends at 12 AM (next day) -> 24 hours
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayStartMs = dayStart.getTime();
      
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(24, 0, 0, 0); // Midnight
      const dayEndMs = dayEnd.getTime();

      // Filter events that overlap with this day
      const eventsForDay = myEvents.filter(e => {
          const eStart = new Date(e.timestamp);
          const eEnd = new Date(e.endTime);
          
          // Check overlap: (StartA <= EndB) and (EndA >= StartB)
          return eStart.getTime() < dayEndMs && eEnd.getTime() > dayStartMs;
      });

      const allDayRenderList: CalendarEvent[] = [];
      const hourlyRenderList: CalendarEvent[] = [];

      eventsForDay.forEach(e => {
          // Check if it covers the full day
          // It covers full day if:
          // 1. It is explicitly isAllDay
          // 2. OR (e.timestamp <= dayStartMs AND e.endTime >= dayEndMs)
          const coversFullDay = e.timestamp <= dayStartMs && e.endTime >= dayEndMs;

          if (e.isAllDay || coversFullDay) {
              allDayRenderList.push(e);
          } else {
              // It's a partial day event (start or end of a multi-day, or just a normal event)
              hourlyRenderList.push(e);
          }
      });

      // Calculate layouts for hourly events
      // We need to clamp the start/end times to the visible window for layout purposes
      const clampedEvents = hourlyRenderList.map(e => {
          const eStart = Math.max(e.timestamp, dayStartMs);
          const eEnd = Math.min(e.endTime, dayEndMs);
          
          return {
              ...e,
              // Use clamped values for layout calculation
              layoutTimestamp: eStart,
              layoutEndTime: eEnd,
              // Keep original for display/logic
              originalTimestamp: e.timestamp,
              originalEndTime: e.endTime
          };
      });

      // We need a modified calculateEventLayouts that uses the clamped values
      // But calculateEventLayouts likely uses .timestamp and .endTime directly.
      // Let's create a temporary array for layout calculation
      const tempForLayout = clampedEvents.map(e => ({
          ...e,
          timestamp: e.layoutTimestamp,
          endTime: e.layoutEndTime
      }));

      const layoutEvents = calculateEventLayouts(tempForLayout, SLOT_HEIGHT, 100).map((ev) => {
          // ev already contains originalTimestamp and originalEndTime because we spread them in tempForLayout
          // and calculateEventLayouts preserves extra properties.
          const originalTimestamp = (ev as any).originalTimestamp;
          const originalEndTime = (ev as any).originalEndTime;

          return {
              ...ev,
              timestamp: originalTimestamp, // Restore original times
              endTime: originalEndTime,
              layout: {
                  ...ev.layout,
                  top: ev.layout.top // No adjustment needed as grid starts at 0
              }
          };
      });

      return (
      <>
        {/* Week Strip */}
        <View style={styles.weekStripContainer}>
            <View style={styles.weekStripContent}>
            {weekDays.map((d, i) => {
                const active = d.getDate() === selectedDate.getDate();
                return (
                <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={styles.dayItem}>
                    <Text style={styles.dayName}>{['S','M','T','W','T','F','S'][d.getDay()]}</Text>
                    <View style={[styles.dayNumberContainer, active && styles.activeDayNumberContainer]}>
                    <Text style={[styles.dayNumber, active && { color: colors.onPrimary }]}>{d.getDate()}</Text>
                    {active && <View style={styles.activeDot} />}
                    </View>
                </TouchableOpacity>
                );
            })}
            </View>
        </View>

        {/* All Day Banner */}
        {allDayRenderList.length > 0 && (
            <View style={styles.allDayContainer}>
                <Text style={styles.allDayLabel}>ALL DAY</Text>
                <View style={styles.allDayEventsList}>
                    {allDayRenderList.map(ev => (
                        <TouchableOpacity 
                            key={ev.id} 
                            style={[styles.allDayEventRow, { backgroundColor: ev.color || colors.primary }]}
                            onPress={() => handleEventPress(ev)}
                        >
                            <Text style={styles.allDayEventText}>{ev.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        )}

        <ScrollView style={styles.agenda} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            <View style={styles.gridContainer}>
            <View style={styles.timeColumn}>
                {HOURS.slice(0, 24).map(h => {
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const hour12 = h % 12 || 12;
                    return (
                        <View key={h} style={styles.timeLabelContainer}>
                            <Text style={styles.timeLabel}>
                                {`${hour12} ${ampm}`}
                            </Text>
                        </View>
                    );
                })}
            </View>
            
            <View style={styles.eventsColumn}>
                <TouchableWithoutFeedback onPress={handleGridPress}>
                    <View style={StyleSheet.absoluteFill}>
                         {HOURS.slice(0, 24).map(h => (
                            <View key={h} style={styles.gridSlot} />
                         ))}
                    </View>
                </TouchableWithoutFeedback>
                
                {/* Now Line */}
                {selectedDate.toDateString() === currentTime.toDateString() && (
                <View style={[styles.nowLine, { top: nowLineTop }]}>
                    <View style={styles.nowDot} />
                </View>
                )}

                {/* Render Events */}
                {layoutEvents.map(ev => {
                    // Check if multi-day (duration > 24h OR crosses midnight boundary of current view)
                    // Actually, if it's clamped, it means it extends beyond the view.
                    // Simple check: if original duration > 24h OR start/end dates are different
                    const isMultiDay = (ev.endTime - ev.timestamp) > 24 * 60 * 60 * 1000 || 
                                       new Date(ev.timestamp).getDate() !== new Date(ev.endTime).getDate();

                    return (
                        <DraggableEvent 
                            key={ev.id}
                            event={ev}
                            layout={ev.layout}
                            slotHeight={SLOT_HEIGHT}
                            gridStartHour={0}
                            onDragEnd={handleEventDragEnd}
                            onResizeEnd={handleEventResizeEnd}
                            onPress={handleEventPress}
                            allowResize={ev.endTime <= dayEnd.getTime()}
                            isMultiDay={isMultiDay}
                            onDragAttemptBlocked={() => showToast("You cannot move multi-day events")}
                        />
                    );
                })}
            </View>
            </View>
        </ScrollView>
      </>
  )};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>Planner</Text>
            <Text style={styles.headerSubtitle}>{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
        </View>

        <View style={{flexDirection:'row', alignItems:'center', gap: spacing.md}}>
             <TouchableOpacity 
                style={styles.viewSelectorBtn} 
                onPress={() => setShowViewDropdown(!showViewDropdown)}
             >
                <Text style={styles.viewSelectorText}>{viewMode === 'week' ? 'WEEK' : 'MONTH'}</Text>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="3"><Path d="M6 9l6 6 6-6"/></Svg>
             </TouchableOpacity>

             <TouchableOpacity style={styles.addButton} onPress={() => { setEditingEvent(null); setShowCreate(true); }}>
                <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth="3"><Path d="M12 5v14m-7-7h14" /></Svg>
             </TouchableOpacity>
        </View>

        {showViewDropdown && (
            <View style={styles.dropdown}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setViewMode('week'); setShowViewDropdown(false); }}>
                    <Text style={[styles.dropdownText, viewMode==='week' && {color:colors.primary}]}>WEEKLY VIEW</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setViewMode('month'); setShowViewDropdown(false); }}>
                    <Text style={[styles.dropdownText, viewMode==='month' && {color:colors.primary}]}>MONTHLY VIEW</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>

      {viewMode === 'week' ? renderWeekView() : renderMonthView()}

      {/* Event Info Popup */}
      {popupEvent && (
        <View style={styles.popupOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPopupEvent(null)} />
            <View style={[styles.popupCard, { backgroundColor: colors.surface }]}>
                {/* Header with Color and Actions */}
                <View style={[styles.popupHeader, { backgroundColor: popupEvent.event.color || colors.primary }]}>
                    <View style={styles.popupHeaderActions}>
                         <TouchableOpacity onPress={() => {
                             handlePopupAction(); // Edit/Propose
                         }} style={styles.popupHeaderBtn}>
                             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.onColor} strokeWidth="2"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleDeleteEvent(popupEvent.event.id)} style={styles.popupHeaderBtn}>
                             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.onColor} strokeWidth="2"><Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => setPopupEvent(null)} style={styles.popupHeaderBtn}>
                             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.onColor} strokeWidth="2"><Path d="M18 6L6 18M6 6l12 12"/></Svg>
                         </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.popupContent}>
                    <Text style={[styles.popupTitle, { color: colors.textPrimary }]}>{popupEvent.event.title}</Text>
                    
                    {/* Time */}
                    <View style={styles.popupRow}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" style={{marginRight: spacing.md, marginTop: spacing.xs}}>
                            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <Path d="M12 6v6l4 2" />
                        </Svg>
                        <Text style={[styles.popupTime, { color: colors.textSecondary }]}>
                            {new Date(popupEvent.event.timestamp).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})} ⋅ {new Date(popupEvent.event.timestamp).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} - {new Date(popupEvent.event.endTime).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                        </Text>
                    </View>

                    {/* Location */}
                    {popupEvent.event.location ? (
                        <View style={styles.popupRow}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" style={{marginRight: spacing.md, marginTop: spacing.xs}}>
                                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <Path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                            </Svg>
                            <Text style={[styles.popupLocation, { color: colors.textSecondary }]}>{popupEvent.event.location}</Text>
                        </View>
                    ) : null}

                    {/* Participants */}
                    <View style={styles.popupRow}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" style={{marginRight: spacing.md, marginTop: spacing.xs}}>
                            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <Path d="M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                            <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </Svg>
                        <View>
                            <Text style={[styles.popupSectionTitle, { color: colors.textSecondary }]}>
                                {popupEvent.event.participants?.length || 0} guests
                            </Text>
                            <View style={styles.popupAttendees}>
                                {popupEvent.event.participants?.map((pid, idx) => {
                                    // Mock mapping ID to name if possible, or just show ID/Name
                                    const friend = MOCK_FRIENDS.find(f => f.id === pid);
                                    return (
                                        <View key={idx} style={styles.popupAttendeeRow}>
                                            <View style={styles.popupAttendeeDot} />
                                            <Text style={[styles.popupAttendeeName, { color: colors.textSecondary }]}>
                                                {friend ? friend.name : `User ${pid}`}
                                            </Text>
                                        </View>
                                    );
                                })}
                                <View style={styles.popupAttendeeRow}>
                                    <View style={[styles.popupAttendeeDot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.popupAttendeeName, { color: colors.textSecondary }]}>You (Organizer)</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    
                    {/* Description (Mock) */}
                    <View style={styles.popupRow}>
                         <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth="2" style={{marginRight: spacing.md, marginTop: spacing.xs}}>
                             <Path d="M17 10H7" />
                             <Path d="M21 6H3" />
                             <Path d="M21 14H3" />
                             <Path d="M17 18H7" />
                         </Svg>
                         <Text style={[styles.popupDescription, { color: colors.textSecondary }]}>
                             No description provided.
                         </Text>
                    </View>

                </View>
            </View>
        </View>
      )}

      {/* Toast Message */}
      {toastMessage && (
          <View style={styles.toastContainer}>
              <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
      )}

      <CreateEventModal 
        visible={showCreate} 
        onClose={() => {
            setShowCreate(false);
            setPreselectedTime(null);
            setEditingEvent(null);
            setPopupEvent(null);
        }}
        onSave={handleCreateEvent}
        friends={MOCK_FRIENDS}
        initialStartTime={preselectedTime}
        initialEvent={editingEvent}
        initialParticipants={initialParticipants}
      />
    </View>
  );
};

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, zIndex: 10, backgroundColor: colors.background },
  headerTitle: { fontSize: typography.display.fontSize, fontWeight: '800', color: colors.primary, fontFamily: 'Manrope' },
  headerSubtitle: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, fontFamily: 'Manrope', marginTop: spacing.xs },
  
  viewSelectorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderRadius: radius.xl, gap: spacing.sm },
  viewSelectorText: { color: colors.textPrimary, fontSize: typography.micro.fontSize, fontWeight: '700', letterSpacing: 0.5 },
  
  addButton: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.shadow, shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  dropdown: { position: 'absolute', top: 70, right: 24, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.sm, shadowColor:colors.shadow, shadowOpacity: 0.2, shadowRadius: 10, zIndex: 100, width: 160 },
  dropdownItem: { padding: spacing.base },
  dropdownText: { fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope', fontSize: typography.caption.fontSize },

  weekStripContainer: { marginBottom: spacing.lg },
  weekStripContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl },
  dayItem: { alignItems: 'center', width: 44 },
  dayName: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm, fontFamily: 'Manrope' },
  dayNumberContainer: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  activeDayNumberContainer: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayNumber: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textSecondary, fontFamily: 'Manrope' },
  activeDot: { width: 4, height: 4, backgroundColor: colors.onColor, borderRadius: radius.pill, marginTop: spacing.xs },
  
  allDayContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.base, flexDirection: 'column' },
  allDayLabel: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, fontFamily: 'Manrope', marginBottom: spacing.sm },
  allDayEventsList: { gap: spacing.xs },
  allDayEventRow: { width: '100%', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md },
  allDayEventText: { color: colors.onColor, fontSize: typography.label.fontSize, fontWeight: '700', fontFamily: 'Manrope' },

  agenda: { flex: 1 },
  gridContainer: { flexDirection: 'row' },
  timeColumn: { width: 60, borderRightWidth: 1, borderColor: colors.border },
  timeLabelContainer: { height: SLOT_HEIGHT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 0, transform: [{translateY: -6}] },
  timeLabel: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, fontFamily: 'Manrope' },
  eventsColumn: { flex: 1, position: 'relative' },
  gridSlot: { height: SLOT_HEIGHT, borderBottomWidth: 1, borderColor: colors.surfaceAlt },
  
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.primary, zIndex: 10 },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  
  eventCard: { position: 'absolute', left: 10, right: 10, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: colors.primarySurface, height: 160 },
  eventTitle: { color: colors.primary, fontWeight: '700', fontSize: typography.label.fontSize, fontFamily: 'Manrope' },
  eventStatus: { color: colors.primary, fontSize: typography.micro.fontSize, fontWeight: '700' },
  eventTime: { color: colors.primary, fontSize: typography.micro.fontSize, fontWeight: '700', marginTop: spacing.xs },

  // Month View Styles
  monthContainer: { flex: 1 },
  monthBlock: { marginBottom: spacing['2xl'], paddingHorizontal: spacing.xl },
  monthBlockTitle: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.base, fontFamily: 'Manrope', letterSpacing: 1 },
  monthHeaderRow: { flexDirection: 'row', marginBottom: spacing.md },
  monthHeaderDay: { width: '14.28%', textAlign: 'center', fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.textSecondary, fontFamily: 'Manrope' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm, borderRadius: radius.md },
  monthCellSelected: { backgroundColor: colors.primary },
  monthDateText: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Manrope' },
  monthDot: { width: 4, height: 4, borderRadius: radius.pill, backgroundColor: colors.primary, marginTop: spacing.xs },

  // Popup Styles
  popupOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 200, backgroundColor: colors.scrim },
  popupCard: { width: '85%', borderRadius: radius.lg, overflow: 'hidden', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10 },
  popupHeader: { padding: spacing.base, height: 60, justifyContent: 'center' },
  popupHeaderActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.base },
  popupHeaderBtn: { padding: spacing.xs },
  
  popupContent: { padding: spacing.xl },
  popupTitle: { fontSize: typography.title.fontSize, fontWeight: '700', fontFamily: 'Manrope', marginBottom: spacing.base },
  
  popupRow: { flexDirection: 'row', marginBottom: spacing.base, alignItems: 'flex-start' },
  popupIconPlaceholder: { width: 24, marginRight: spacing.md }, // For alignment if needed
  popupRowIcon: { fontSize: typography.body.fontSize, width: 24, marginRight: spacing.md, textAlign: 'center' },
  
  popupTime: { fontSize: typography.label.fontSize, fontFamily: 'Manrope', flex: 1, lineHeight: 20 },
  popupLocation: { fontSize: typography.label.fontSize, fontFamily: 'Manrope', flex: 1, lineHeight: 20 },
  
  popupSectionTitle: { fontSize: typography.caption.fontSize, fontWeight: '600', marginBottom: spacing.sm, fontFamily: 'Manrope' },
  popupAttendees: { gap: spacing.sm },
  popupAttendeeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  popupAttendeeDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.border },
  popupAttendeeName: { fontSize: typography.label.fontSize, fontFamily: 'Manrope' },
  
  popupDescription: { fontSize: typography.label.fontSize, fontFamily: 'Manrope', lineHeight: 20, flex: 1 },
  
  popupButton: { paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center', marginTop: spacing.xl },
  popupButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: typography.label.fontSize, fontFamily: 'Manrope' },

  // Toast
  toastContainer: { position: 'absolute', bottom: 100, left: '20%', right: '20%', backgroundColor: colors.scrim, padding: spacing.md, borderRadius: radius.xl, alignItems: 'center', zIndex: 300 },
  toastText: { color: colors.onColor, fontSize: typography.caption.fontSize, fontWeight: '600', fontFamily: 'Manrope', textAlign: 'center' },
});

export default EventPlanner;