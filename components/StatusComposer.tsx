import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, Modal } from 'react-native';
import { statusService } from '../services/StatusService';
import { UserStatus } from '../types';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

const StatusComposer: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [status, setStatus] = useState<UserStatus>({ isAvailable: false, activity: '', privacy: 'all', timestamp: Date.now() });

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
        <View style={styles.statusLabelRow}>
            <Text style={styles.statusLabel}>MY STATUS</Text>
            <TouchableOpacity onPress={() => setShowTooltip(true)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <View style={styles.infoDot}>
                    <Text style={styles.infoDotText}>?</Text>
                </View>
            </TouchableOpacity>
        </View>
        <Switch 
            value={status.isAvailable} 
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      </View>

      {status.isAvailable && (
        <View style={styles.statusBody}>
            <TextInput 
                style={styles.statusInput}
                value={status.activity}
                onChangeText={handleActivityChange}
                placeholder="What are you up to?"
                placeholderTextColor={colors.placeholder}
            />
            
            <View style={styles.privacyRow}>
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

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  statusContainer: { marginHorizontal: spacing.base, marginBottom: spacing.base, padding: spacing.base, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusLabel: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  infoDot: { width: 14, height: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  infoDotText: { fontSize: typography.micro.fontSize, fontWeight: '700', color: colors.primary },
  statusBody: { marginTop: spacing.sm },
  statusInput: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.xs },

  privacyRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  privacyPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.border },
  privacyPillActive: { backgroundColor: colors.primary },
  privacyText: { fontSize: typography.caption.fontSize, fontWeight: '600', color: colors.textSecondary },
  privacyTextActive: { color: colors.onPrimary },

  tooltipOverlay: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center' },
  tooltipContent: { width: '80%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  tooltipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  tooltipTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary },
  tooltipClose: { fontSize: typography.headline.fontSize, color: colors.textSecondary, padding: spacing.xs },
  tooltipText: { fontSize: typography.label.fontSize, color: colors.textSecondary, lineHeight: 20 }
});

export default StatusComposer;
