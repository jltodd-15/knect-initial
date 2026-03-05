import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Modal } from 'react-native';
import { statusService } from '../services/StatusService';
import { UserStatus } from '../types';

interface Props {
  isDarkMode: boolean;
}

const StatusComposer: React.FC<Props> = ({ isDarkMode }) => {
  const styles = getStyles(isDarkMode);
  const [status, setStatus] = useState<UserStatus>({ isAvailable: false, activity: '', privacy: 'all' });

  useEffect(() => {
    const unsubscribe = statusService.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (val: boolean) => {
    statusService.setStatus({ isAvailable: val });
  };

  const handleActivityChange = (text: string) => {
    statusService.setStatus({ activity: text });
  };

  const handlePrivacyChange = (val: 'all' | 'close-friends' | 'specific-groups') => {
    statusService.setStatus({ privacy: val });
  };

  return (
    <View style={styles.statusContainer}>
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity 
            style={styles.tooltipOverlay} 
            activeOpacity={1} 
            onPress={() => setShowTooltip(false)}
        >
            <View style={styles.tooltipContent}>
                <View style={styles.tooltipHeader}>
                    <Text style={styles.tooltipTitle}>Status Info</Text>
                    <TouchableOpacity onPress={() => setShowTooltip(false)}>
                        <Text style={styles.tooltipClose}>✕</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.tooltipText}>
                    Your status will stay on for the next hour, or until it is turned off.
                </Text>
            </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.statusHeader}>
        <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
            <Text style={styles.statusLabel}>MY STATUS</Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <View style={{width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#10b981', justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 9, fontWeight: 'bold', color: '#10b981'}}>?</Text>
                </View>
            </TouchableOpacity>
        </View>
        <Switch 
            value={status.isAvailable} 
            onValueChange={handleToggle}
            trackColor={{ false: '#767577', true: '#10b981' }}
            thumbColor={status.isAvailable ? '#fff' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      </View>

      {status.isAvailable && (
        <View style={{marginTop: 8}}>
            <TextInput 
                style={styles.statusInput}
                value={status.activity}
                onChangeText={handleActivityChange}
                placeholder="What are you up to?"
                placeholderTextColor="#666"
            />
            
            <View style={{flexDirection: 'row', marginTop: 12, gap: 8}}>
                <TouchableOpacity 
                    style={[styles.privacyPill, status.privacy === 'all' && styles.privacyPillActive]}
                    onPress={() => handlePrivacyChange('all')}
                >
                    <Text style={[styles.privacyText, status.privacy === 'all' && styles.privacyTextActive]}>All Friends</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.privacyPill, status.privacy === 'close-friends' && styles.privacyPillActive]}
                    onPress={() => handlePrivacyChange('close-friends')}
                >
                    <Text style={[styles.privacyText, status.privacy === 'close-friends' && styles.privacyTextActive]}>Close Friends</Text>
                </TouchableOpacity>
            </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  statusContainer: { marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: isDark ? '#1c1c1e' : '#f2f2f7', borderRadius: 16 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 11, fontWeight: '900', color: '#10b981', letterSpacing: 1 },
  statusInput: { fontSize: 15, fontWeight: '600', color: isDark ? 'white' : 'black', marginTop: 4 },
  
  privacyPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' },
  privacyPillActive: { backgroundColor: '#10b981' },
  privacyText: { fontSize: 11, fontWeight: '600', color: isDark ? '#8e8e93' : '#666' },
  privacyTextActive: { color: 'white' },
  
  tooltipOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  tooltipContent: { width: '80%', backgroundColor: isDark ? '#1c1c1e' : 'white', borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  tooltipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tooltipTitle: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : 'black' },
  tooltipClose: { fontSize: 18, color: '#999', padding: 4 },
  tooltipText: { fontSize: 14, color: isDark ? '#ccc' : '#666', lineHeight: 20 }
});

export default StatusComposer;
