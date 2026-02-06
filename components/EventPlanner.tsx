import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Dimensions } from 'react-native';
import { CalendarEvent, Attendee } from '../types';

interface Props { isDarkMode: boolean; }

const HOURS = Array.from({ length: 25 }, (_, i) => i);
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'];
const SLOT_HEIGHT = 60;
const { width } = Dimensions.get('window');

const EventPlanner: React.FC<Props> = ({ isDarkMode }) => {
  const styles = getStyles(isDarkMode);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreate, setShowCreate] = useState(false);
  
  // Create Event State
  const [title, setTitle] = useState('');
  const [pickedStartTime, setPickedStartTime] = useState<number | null>(null);
  
  const [myEvents, setMyEvents] = useState<CalendarEvent[]>([
     { 
        id: '1', 
        title: 'Strategy Session', 
        timestamp: new Date().setHours(11, 0, 0, 0),
        endTime: new Date().setHours(12, 0, 0, 0),
        type: 'group', 
        participants: ['sarah'], 
        color: COLORS[1],
        status: 'confirmed'
      }
  ]);

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

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  const handleSlotPress = (h: number) => {
    const d = new Date(selectedDate);
    d.setHours(h, 0, 0, 0);
    setPickedStartTime(d.getTime());
    setShowCreate(true);
  };

  const handleSave = () => {
    if (title && pickedStartTime) {
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title,
            timestamp: pickedStartTime,
            endTime: pickedStartTime + 3600000,
            type: 'solo',
            participants: [],
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            status: 'confirmed'
        };
        setMyEvents([...myEvents, newEvent]);
        setShowCreate(false);
        setTitle('');
    }
  };

  const dailyEvents = myEvents.filter(e => isSameDay(new Date(e.timestamp), selectedDate));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Planner</Text>
            <Text style={styles.headerDate}>{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric'})}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { setPickedStartTime(new Date().getTime()); setShowCreate(true); }}>
            <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {weekDays.map((d, i) => {
                const active = isSameDay(selectedDate, d);
                return (
                    <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={styles.dayItem}>
                        <Text style={[styles.dayName, active && styles.activeDayName]}>{['S','M','T','W','T','F','S'][d.getDay()]}</Text>
                        <View style={[styles.dayNumberContainer, active && styles.activeDayNumberContainer]}>
                            <Text style={[styles.dayNumber, active && styles.activeDayNumber]}>{d.getDate()}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
      </View>

      {/* Agenda Grid */}
      <ScrollView style={styles.agenda} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.gridContainer}>
            <View style={styles.timeColumn}>
                {HOURS.slice(0, 24).map(h => (
                    <View key={h} style={styles.timeLabelContainer}>
                        <Text style={styles.timeLabel}>{h === 0 ? '12 AM' : (h > 12 ? `${h-12} PM` : `${h} AM`)}</Text>
                    </View>
                ))}
            </View>
            
            <View style={styles.eventsColumn}>
                {HOURS.slice(0, 24).map(h => (
                    <TouchableOpacity key={h} style={styles.gridSlot} onPress={() => handleSlotPress(h)} />
                ))}

                {/* Events Rendering */}
                {dailyEvents.map(ev => {
                    const startH = new Date(ev.timestamp).getHours();
                    const top = startH * SLOT_HEIGHT;
                    return (
                        <TouchableOpacity key={ev.id} style={[styles.eventCard, { top, backgroundColor: ev.color, height: SLOT_HEIGHT }]}>
                            <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                            <Text style={styles.eventTime}>{new Date(ev.timestamp).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
      </ScrollView>

      {/* Modal for Creation */}
      <Modal visible={showCreate} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalHeader}>New Plan</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    placeholder="Event Title" 
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                  />
                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.cancelButton}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                          <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#10b981' },
  headerDate: { fontSize: 10, fontWeight: '900', color: '#71717a', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  addButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8 },
  addButtonText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  weekStrip: { height: 80, marginBottom: 10 },
  dayItem: { alignItems: 'center', marginRight: 16, width: 44 },
  dayName: { fontSize: 9, fontWeight: '900', color: isDark ? '#52525b' : '#a1a1aa', marginBottom: 8 },
  activeDayName: { color: '#10b981' },
  dayNumberContainer: { width: 44, height: 50, borderRadius: 14, backgroundColor: isDark ? '#1E1E1E' : 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#27272a' : '#f4f4f5' },
  activeDayNumberContainer: { backgroundColor: '#10b981', borderColor: '#10b981' },
  dayNumber: { fontSize: 16, fontWeight: '900', color: isDark ? '#a1a1aa' : '#52525b' },
  activeDayNumber: { color: 'white' },
  agenda: { flex: 1 },
  gridContainer: { flexDirection: 'row' },
  timeColumn: { width: 60, borderRightWidth: 1, borderRightColor: isDark ? '#27272a' : '#f4f4f5' },
  timeLabelContainer: { height: SLOT_HEIGHT, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 8 },
  timeLabel: { fontSize: 9, fontWeight: '900', color: isDark ? '#52525b' : '#a1a1aa' },
  eventsColumn: { flex: 1, position: 'relative' },
  gridSlot: { height: SLOT_HEIGHT, borderBottomWidth: 1, borderBottomColor: isDark ? '#1E1E1E' : '#fafafa' },
  eventCard: { position: 'absolute', left: 4, right: 4, borderRadius: 12, padding: 8, justifyContent: 'center' },
  eventTitle: { color: 'white', fontWeight: '900', fontSize: 12 },
  eventTime: { color: 'white', opacity: 0.8, fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: isDark ? '#1E1E1E' : 'white', padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalHeader: { fontSize: 12, fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 },
  modalInput: { fontSize: 20, fontWeight: 'bold', color: isDark ? 'white' : 'black', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee', marginBottom: 30 },
  modalActions: { flexDirection: 'row', gap: 10 },
  saveButton: { flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  cancelButton: { flex: 1, backgroundColor: isDark ? '#333' : '#f4f4f5', padding: 16, borderRadius: 16, alignItems: 'center' },
  cancelButtonText: { color: isDark ? '#fff' : '#333', fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }
});

export default EventPlanner;