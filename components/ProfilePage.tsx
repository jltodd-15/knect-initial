import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Switch, Modal, FlatList, TextInput, Alert } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { MOCK_FRIENDS } from '../constants';
import { userStore } from '../utils/storage';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

interface Props {
  onLogout: () => void;
}

const ProfilePage: React.FC<Props> = ({ onLogout }) => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [interests, setInterests] = useState(['HIKING', 'TECHNO', 'BRUNCH', 'MINIMALISM', 'COFFEE']);
  const [newInterest, setNewInterest] = useState('');
  const [isAddingInterest, setIsAddingInterest] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Alex Rivera');
  const [role, setRole] = useState('DIGITAL NOMAD • SAN FRANCISCO');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop');

  useEffect(() => {
    (async () => {
      const savedProfile = await userStore.getItem('knect_profile');
      if (savedProfile) {
          const data = JSON.parse(savedProfile);
          if (data.name) setName(data.name);
          if (data.role) setRole(data.role);
          if (data.interests) setInterests(data.interests);
          if (data.avatar) setAvatar(data.avatar);
      }
    })();
  }, []);

  const toggleCloseFriend = (id: string) => {
      setFriends(prev => prev.map(f => f.id === id ? { ...f, isCloseFriend: !f.isCloseFriend } : f));
  };

  const handleAddInterest = () => {
      if (newInterest.trim()) {
          setInterests([...interests, newInterest.trim().toUpperCase()]);
          setNewInterest('');
          setIsAddingInterest(false);
      }
  };

  const handleRemoveInterest = (index: number) => {
      if (isEditing) {
          setInterests(interests.filter((_, i) => i !== index));
      }
  };

  const handleImageChange = () => {
      if (!isEditing) return;
      
      // TODO: remove this in lieu of actual image selection
      // Mock image cycling
      const mockImages = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop'
      ];
      const currentIdx = mockImages.indexOf(avatar);
      const nextIdx = (currentIdx + 1) % mockImages.length;
      setAvatar(mockImages[nextIdx]);
  };

  const handleSaveProfile = async () => {
      setIsEditing(false);
      const profileData = { name, role, interests, avatar };
      await userStore.setItem('knect_profile', JSON.stringify(profileData));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
       <View style={styles.header}>
          <View style={styles.avatarContainer}>
             <TouchableOpacity onPress={handleImageChange} disabled={!isEditing}>
                 <Image source={{ uri: avatar }} style={styles.avatar} />
                 {isEditing && (
                     <View style={styles.cameraOverlay}>
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.onColor} strokeWidth="2">
                            <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <Path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        </Svg>
                     </View>
                 )}
             </TouchableOpacity>
             <TouchableOpacity style={styles.editBadge} onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isEditing ? <Path d="M20 6L9 17l-5-5" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
                </Svg>
             </TouchableOpacity>
          </View>
          
          {isEditing ? (
              <>
                  <TextInput 
                      style={styles.nameInput} 
                      value={name} 
                      onChangeText={setName}
                      autoFocus
                  />
                  <TextInput 
                      style={styles.roleInput} 
                      value={role} 
                      onChangeText={setRole}
                  />
                  <Text style={styles.photoHint}>Tap photo to change</Text>
              </>
          ) : (
              <>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.role}>{role}</Text>
              </>
          )}
       </View>

       {/* Friends Button */}
       <TouchableOpacity style={styles.friendsBtn} onPress={() => setShowFriends(true)}>
           <View style={styles.row}>
               <View style={styles.miniAvatars}>
                   {friends.slice(0,3).map((f,i) => (
                       <Image key={f.id} source={{uri: f.avatar}} style={[styles.miniAvatar, i > 0 && styles.miniAvatarOverlap, {zIndex: 3-i}]} />
                   ))}
               </View>
               <Text style={styles.friendsBtnText}>{friends.length} Friends</Text>
           </View>
           <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2"><Path d="M9 18l6-6-6-6"/></Svg>
       </TouchableOpacity>

       <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <Text style={styles.label}>INTERESTS</Text>
             <TouchableOpacity style={styles.plusBtn} onPress={() => setIsAddingInterest(!isAddingInterest)}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="3">
                    <Line x1="12" y1="5" x2="12" y2="19" />
                    <Line x1="5" y1="12" x2="19" y2="12" />
                </Svg>
             </TouchableOpacity>
          </View>
          
          {isAddingInterest && (
              <View style={styles.addInterestRow}>
                  <TextInput 
                      style={styles.tagInput}
                      value={newInterest}
                      onChangeText={setNewInterest}
                      placeholder="Add interest..."
                      placeholderTextColor={colors.placeholder}
                      onSubmitEditing={handleAddInterest}
                      autoFocus
                  />
                  <TouchableOpacity style={styles.addTagBtn} onPress={handleAddInterest}>
                      <Text style={styles.addTagText}>ADD</Text>
                  </TouchableOpacity>
              </View>
          )}

          <View style={styles.tagCloud}>
             {interests.map((i, idx) => (
                <TouchableOpacity key={idx} style={styles.tag} onPress={() => handleRemoveInterest(idx)} disabled={!isEditing}>
                   <Text style={styles.tagText}>{i}</Text>
                   {isEditing && (
                       <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="3" style={styles.tagRemove}>
                           <Path d="M18 6L6 18M6 6l12 12"/>
                       </Svg>
                   )}
                </TouchableOpacity>
             ))}
          </View>
       </View>

       <View style={styles.section}>
          <Text style={styles.label}>CALENDAR</Text>
          <TouchableOpacity style={styles.calendarBtn} onPress={() => Alert.alert('Sync Calendar', 'This would open OAuth flow for Google/Apple Calendar.')}>
              <View style={styles.calendarRow}>
                  <View style={styles.calendarIcon}>
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth="2">
                          <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                          <Path d="M16 2v4" />
                          <Path d="M8 2v4" />
                          <Path d="M3 10h18" />
                      </Svg>
                  </View>
                  <Text style={styles.calendarBtnText}>Connect External Calendar</Text>
              </View>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2"><Path d="M9 18l6-6-6-6"/></Svg>
          </TouchableOpacity>
       </View>

       <View style={styles.section}>
          <Text style={styles.label}>SETTINGS</Text>
          <View style={styles.settingCard}>
             <View style={styles.settingRow}>
                <Text style={styles.settingText}>Dark Mode</Text>
                <Switch 
                    testID="dark-mode-switch"
                    value={theme.mode === 'dark'} 
                    onValueChange={(on) => theme.setOverride(on ? 'dark' : 'light')}
                    trackColor={{false: colors.border, true: colors.primary}}
                    thumbColor={colors.onColor} 
                />
             </View>
             <View style={styles.divider} />
             <TouchableOpacity style={styles.settingRow} onPress={onLogout}>
                <Text style={[styles.settingText, styles.logOutText]}>Log Out</Text>
             </TouchableOpacity>
          </View>
       </View>

       {/* Friends Modal */}
       <Modal visible={showFriends} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFriends(false)}>
           <View style={styles.modalContainer}>
               <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>My Friends</Text>
                   <TouchableOpacity onPress={() => setShowFriends(false)}>
                       <Text style={styles.closeText}>Close</Text>
                   </TouchableOpacity>
               </View>
               <View style={styles.friendsHint}>
                   <Text style={styles.friendsHintText}>
                       Tap the star to add to Close Friends list.
                   </Text>
               </View>
               <FlatList 
                   data={friends}
                   keyExtractor={item => item.id}
                   contentContainerStyle={styles.friendsList}
                   renderItem={({item}) => (
                       <View style={styles.friendRow}>
                           <Image source={{uri: item.avatar}} style={styles.friendAvatar} />
                           <View style={styles.friendText}>
                               <Text style={styles.friendName}>{item.name}</Text>
                               <Text style={styles.friendStatus}>{item.status ? "Available" : "Away"}</Text>
                           </View>
                           <TouchableOpacity onPress={() => toggleCloseFriend(item.id)}>
                               <Svg width="24" height="24" viewBox="0 0 24 24" fill={item.isCloseFriend ? colors.primary : "none"} stroke={item.isCloseFriend ? colors.primary : colors.textSecondary} strokeWidth="2">
                                   <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                               </Svg>
                           </TouchableOpacity>
                       </View>
                   )}
               />
           </View>
       </Modal>
    </ScrollView>
  );
};

const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 0, marginBottom: 40 },
  avatarContainer: { position: 'relative', marginBottom: spacing.xl },
  avatar: { width: 120, height: 120, borderRadius: radius.pill, borderWidth: 0 },
  cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.surface, width: 36, height: 36, borderRadius: radius.pill, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: colors.background },
  name: { ...typography.display, color: colors.primary, fontFamily: 'Inter', letterSpacing: -1, marginBottom: spacing.sm },
  role: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Inter' },
  nameInput: { ...typography.display, color: colors.primary, fontFamily: 'Inter', letterSpacing: -1, marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.primary, textAlign: 'center', minWidth: 200 },
  roleInput: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.md, textTransform: 'uppercase', fontFamily: 'Inter', borderBottomWidth: 1, borderBottomColor: colors.textSecondary, textAlign: 'center', minWidth: 250 },
  photoHint: { fontSize: typography.micro.fontSize, color: colors.textSecondary, marginTop: spacing.sm },
  
  friendsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.xl, marginBottom: spacing['2xl'], borderWidth: 1, borderColor: colors.border },
  friendsBtnText: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Inter' },
  miniAvatars: { flexDirection: 'row', marginRight: spacing.md },
  miniAvatar: { width: 32, height: 32, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.surface },
  miniAvatarOverlap: { marginLeft: -spacing.md },

  section: { marginBottom: spacing['2xl'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  label: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Inter' },
  plusBtn: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  
  addInterestRow: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  tagInput: { flex: 1, height: 40, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.base, fontSize: typography.caption.fontSize, color: colors.textPrimary, fontFamily: 'Inter' },
  addTagBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.base, justifyContent: 'center', borderRadius: radius.pill },
  addTagText: { color: colors.onPrimary, fontWeight: '700' },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textPrimary, textTransform: 'uppercase', fontFamily: 'Inter', letterSpacing: 1 },
  tagRemove: { marginLeft: spacing.sm },
  
  calendarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  calendarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  calendarIcon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  calendarBtnText: { fontSize: typography.label.fontSize, fontWeight: '700', color: colors.textPrimary, fontFamily: 'Inter' },

  settingCard: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  settingText: { fontWeight: '700', color: colors.textPrimary, fontSize: typography.label.fontSize, fontFamily: 'Inter' },
  logOutText: { color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.xl, alignItems: 'center' },
  modalTitle: { ...typography.headline, color: colors.textPrimary },
  closeText: { color: colors.primary, fontSize: typography.body.fontSize, fontWeight: '600' },
  friendsHint: { padding: spacing.base, backgroundColor: colors.surfaceAlt, margin: spacing.base, borderRadius: radius.md },
  friendsHintText: { color: colors.textSecondary, fontSize: typography.label.fontSize, textAlign: 'center' },
  friendsList: { padding: spacing.xl, paddingTop: 0 },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.base, borderBottomWidth: 1, borderColor: colors.border },
  friendAvatar: { width: 48, height: 48, borderRadius: radius.pill },
  friendText: { flex: 1, marginLeft: spacing.base },
  friendName: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  friendStatus: { fontSize: typography.caption.fontSize, color: colors.textSecondary }
});

export default ProfilePage;
