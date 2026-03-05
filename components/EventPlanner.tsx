import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, TouchableWithoutFeedback } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CalendarEvent, Friend, DiscoveryItem } from '../types';
import CreateEventModal from './CreateEventModal';
import { calculateEventLayouts } from '../utils/calendarLayout';
import DraggableEvent from './DraggableEvent';
import { ChatService } from '../services/ChatService';
import { storage } from '../utils/storage';
import { statusService } from '../services/StatusService';
import { MOCK_FRIENDS } from '../constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props { 
    isDarkMode: boolean;
    initialProposal?: DiscoveryItem | null;
    initialParticipants?: string[];
}

const HOURS = Array.from({ length: 25 }, (_, i) => i);
const SLOT_HEIGHT = 80; 
const INITIAL_NOW = new Date();

const EventPlanner: React.FC<Props> = ({ isDarkMode, initialProposal, initialParticipants }) => {
  const styles = getStyles(isDarkMode);
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
              color: '#10b981',
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
    // Load events from storage
    const savedEvents = storage.getItem('knect_events');
    if (savedEvents) {
        setMyEvents(JSON.parse(savedEvents));
    } else {
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
            color: '#10b981',
            status: 'confirmed', // Changed to confirmed
            isAllDay: false
        }];
        setMyEvents(initialEvents);
        storage.setItem('knect_events', JSON.stringify(initialEvents));
    }
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Save events whenever they change
  useEffect(() => {
      if (myEvents.length > 0) {
          storage.setItem('knect_events', JSON.stringify(myEvents));
      }
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
        const convo = ChatService.findOrCreateConversation(finalEvent.participants, finalEvent.title);
        ChatService.sendMessage(convo.id, '', 'event-proposal', finalEvent);
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
                            <Text style={[styles.monthDateText, isSelected && {color: 'white'}]}>{d.getDate()}</Text>
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
                    <Text style={[styles.dayNumber, active && { color: 'white' }]}>{d.getDate()}</Text>
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
                            style={[styles.allDayEventRow, { backgroundColor: ev.color || '#10b981' }]}
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
                            isDarkMode={isDarkMode}
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

        <View style={{flexDirection:'row', alignItems:'center', gap: 12}}>
             <TouchableOpacity 
                style={styles.viewSelectorBtn} 
                onPress={() => setShowViewDropdown(!showViewDropdown)}
             >
                <Text style={styles.viewSelectorText}>{viewMode === 'week' ? 'WEEK' : 'MONTH'}</Text>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDarkMode?'white':'black'} strokeWidth="3"><Path d="M6 9l6 6 6-6"/></Svg>
             </TouchableOpacity>

             <TouchableOpacity style={styles.addButton} onPress={() => { setEditingEvent(null); setShowCreate(true); }}>
                <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><Path d="M12 5v14m-7-7h14" /></Svg>
             </TouchableOpacity>
        </View>

        {showViewDropdown && (
            <View style={styles.dropdown}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setViewMode('week'); setShowViewDropdown(false); }}>
                    <Text style={[styles.dropdownText, viewMode==='week' && {color:'#10b981'}]}>WEEKLY VIEW</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setViewMode('month'); setShowViewDropdown(false); }}>
                    <Text style={[styles.dropdownText, viewMode==='month' && {color:'#10b981'}]}>MONTHLY VIEW</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>

      {viewMode === 'week' ? renderWeekView() : renderMonthView()}

      {/* Event Info Popup */}
      {popupEvent && (
        <View style={styles.popupOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPopupEvent(null)} />
            <View style={[styles.popupCard, { backgroundColor: isDarkMode ? '#1E1E1E' : 'white' }]}>
                {/* Header with Color and Actions */}
                <View style={[styles.popupHeader, { backgroundColor: popupEvent.event.color || '#10b981' }]}>
                    <View style={styles.popupHeaderActions}>
                         <TouchableOpacity onPress={() => {
                             handlePopupAction(); // Edit/Propose
                         }} style={styles.popupHeaderBtn}>
                             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleDeleteEvent(popupEvent.event.id)} style={styles.popupHeaderBtn}>
                             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => setPopupEvent(null)} style={styles.popupHeaderBtn}>
                             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><Path d="M18 6L6 18M6 6l12 12"/></Svg>
                         </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.popupContent}>
                    <Text style={[styles.popupTitle, { color: isDarkMode ? 'white' : '#333' }]}>{popupEvent.event.title}</Text>
                    
                    {/* Time */}
                    <View style={styles.popupRow}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#ccc' : '#555'} strokeWidth="2" style={{marginRight: 12, marginTop: 2}}>
                            <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <Path d="M12 6v6l4 2" />
                        </Svg>
                        <Text style={[styles.popupTime, { color: isDarkMode ? '#ccc' : '#555' }]}>
                            {new Date(popupEvent.event.timestamp).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})} ⋅ {new Date(popupEvent.event.timestamp).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} - {new Date(popupEvent.event.endTime).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}
                        </Text>
                    </View>

                    {/* Location */}
                    {popupEvent.event.location ? (
                        <View style={styles.popupRow}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#aaa' : '#777'} strokeWidth="2" style={{marginRight: 12, marginTop: 2}}>
                                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <Path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                            </Svg>
                            <Text style={[styles.popupLocation, { color: isDarkMode ? '#aaa' : '#777' }]}>{popupEvent.event.location}</Text>
                        </View>
                    ) : null}

                    {/* Participants */}
                    <View style={styles.popupRow}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#aaa' : '#777'} strokeWidth="2" style={{marginRight: 12, marginTop: 2}}>
                            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <Path d="M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                            <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </Svg>
                        <View>
                            <Text style={[styles.popupSectionTitle, { color: isDarkMode ? '#aaa' : '#777' }]}>
                                {popupEvent.event.participants?.length || 0} guests
                            </Text>
                            <View style={styles.popupAttendees}>
                                {popupEvent.event.participants?.map((pid, idx) => {
                                    // Mock mapping ID to name if possible, or just show ID/Name
                                    const friend = MOCK_FRIENDS.find(f => f.id === pid);
                                    return (
                                        <View key={idx} style={styles.popupAttendeeRow}>
                                            <View style={styles.popupAttendeeDot} />
                                            <Text style={[styles.popupAttendeeName, { color: isDarkMode ? '#ccc' : '#555' }]}>
                                                {friend ? friend.name : `User ${pid}`}
                                            </Text>
                                        </View>
                                    );
                                })}
                                <View style={styles.popupAttendeeRow}>
                                    <View style={[styles.popupAttendeeDot, { backgroundColor: '#10b981' }]} />
                                    <Text style={[styles.popupAttendeeName, { color: isDarkMode ? '#ccc' : '#555' }]}>You (Organizer)</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    
                    {/* Description (Mock) */}
                    <View style={styles.popupRow}>
                         <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#ccc' : '#555'} strokeWidth="2" style={{marginRight: 12, marginTop: 2}}>
                             <Path d="M17 10H7" />
                             <Path d="M21 6H3" />
                             <Path d="M21 14H3" />
                             <Path d="M17 18H7" />
                         </Svg>
                         <Text style={[styles.popupDescription, { color: isDarkMode ? '#ccc' : '#555' }]}>
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
        isDarkMode={isDarkMode} 
        friends={MOCK_FRIENDS}
        initialStartTime={preselectedTime}
        initialEvent={editingEvent}
        initialParticipants={initialParticipants}
      />
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, zIndex: 10, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#10b981', fontFamily: 'Inter' },
  headerSubtitle: { fontSize: 10, fontWeight: '900', color: '#71717a', letterSpacing: 2, fontFamily: 'Inter', marginTop: 4 },
  
  viewSelectorBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E1E1E' : '#eee', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 8 },
  viewSelectorText: { color: isDark ? 'white' : 'black', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  
  addButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', shadowColor: 'black', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  dropdown: { position: 'absolute', top: 70, right: 24, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 24, padding: 8, shadowColor:'#000', shadowOpacity: 0.2, shadowRadius: 10, zIndex: 100, width: 160 },
  dropdownItem: { padding: 16 },
  dropdownText: { fontWeight: '900', color: isDark ? 'white' : 'black', fontFamily: 'Inter', fontSize: 12 },

  weekStripContainer: { marginBottom: 20 },
  weekStripContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  dayItem: { alignItems: 'center', width: 44 },
  dayName: { fontSize: 9, fontWeight: '900', color: '#71717a', marginBottom: 8, fontFamily: 'Inter' },
  dayNumberContainer: { width: 44, height: 44, borderRadius: 16, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#27272a' : '#e4e4e7' },
  activeDayNumberContainer: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dayNumber: { fontSize: 16, fontWeight: '900', color: '#71717a', fontFamily: 'Inter' },
  activeDot: { width: 4, height: 4, backgroundColor: 'white', borderRadius: 2, marginTop: 2 },
  
  allDayContainer: { paddingHorizontal: 24, marginBottom: 16, flexDirection: 'column' },
  allDayLabel: { fontSize: 10, fontWeight: '900', color: '#52525b', fontFamily: 'Inter', marginBottom: 8 },
  allDayEventsList: { gap: 4 },
  allDayEventRow: { width: '100%', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
  allDayEventText: { color: 'white', fontSize: 13, fontWeight: 'bold', fontFamily: 'Inter' },

  agenda: { flex: 1 },
  gridContainer: { flexDirection: 'row' },
  timeColumn: { width: 60, borderRightWidth: 1, borderColor: isDark ? '#27272a' : '#f4f4f5' },
  timeLabelContainer: { height: SLOT_HEIGHT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 0, transform: [{translateY: -6}] },
  timeLabel: { fontSize: 10, fontWeight: '900', color: '#52525b', fontFamily: 'Inter' },
  eventsColumn: { flex: 1, position: 'relative' },
  gridSlot: { height: SLOT_HEIGHT, borderBottomWidth: 1, borderColor: isDark ? '#1E1E1E' : '#fafafa' },
  
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#10b981', zIndex: 10 },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  
  eventCard: { position: 'absolute', left: 10, right: 10, borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#10b981', borderStyle: 'dashed', backgroundColor: isDark ? '#121212' : '#f0fdf4', height: 160 },
  eventTitle: { color: '#10b981', fontWeight: '900', fontSize: 14, fontFamily: 'Inter' },
  eventStatus: { color: '#10b981', fontSize: 9, fontWeight: '900' },
  eventTime: { color: '#34d399', fontSize: 10, fontWeight: 'bold', marginTop: 4 },

  // Month View Styles
  monthContainer: { flex: 1 },
  monthBlock: { marginBottom: 32, paddingHorizontal: 24 },
  monthBlockTitle: { fontSize: 14, fontWeight: '900', color: isDark ? 'white' : 'black', marginBottom: 16, fontFamily: 'Inter', letterSpacing: 1 },
  monthHeaderRow: { flexDirection: 'row', marginBottom: 12 },
  monthHeaderDay: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '900', color: '#71717a', fontFamily: 'Inter' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 12 },
  monthCellSelected: { backgroundColor: '#10b981' },
  monthDateText: { fontSize: 14, fontWeight: 'bold', color: isDark ? '#ccc' : '#333', fontFamily: 'Inter' },
  monthDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#10b981', marginTop: 4 },

  // Popup Styles
  popupOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 200, backgroundColor: 'rgba(0,0,0,0.4)' },
  popupCard: { width: '85%', borderRadius: 16, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10 },
  popupHeader: { padding: 16, height: 60, justifyContent: 'center' },
  popupHeaderActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  popupHeaderBtn: { padding: 4 },
  
  popupContent: { padding: 24 },
  popupTitle: { fontSize: 22, fontWeight: 'bold', fontFamily: 'Inter', marginBottom: 16 },
  
  popupRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  popupIconPlaceholder: { width: 24, marginRight: 12 }, // For alignment if needed
  popupRowIcon: { fontSize: 16, width: 24, marginRight: 12, textAlign: 'center' },
  
  popupTime: { fontSize: 14, fontFamily: 'Inter', flex: 1, lineHeight: 20 },
  popupLocation: { fontSize: 14, fontFamily: 'Inter', flex: 1, lineHeight: 20 },
  
  popupSectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, fontFamily: 'Inter' },
  popupAttendees: { gap: 8 },
  popupAttendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popupAttendeeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  popupAttendeeName: { fontSize: 13, fontFamily: 'Inter' },
  
  popupDescription: { fontSize: 14, fontFamily: 'Inter', lineHeight: 20, flex: 1 },
  
  popupButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  popupButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, fontFamily: 'Inter' },

  // Toast
  toastContainer: { position: 'absolute', bottom: 100, left: '20%', right: '20%', backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 24, alignItems: 'center', zIndex: 300 },
  toastText: { color: 'white', fontSize: 12, fontWeight: '600', fontFamily: 'Inter', textAlign: 'center' },
});

export default EventPlanner;