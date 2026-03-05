import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Switch, Modal, FlatList, TextInput, Alert } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { MOCK_FRIENDS } from '../constants';
import { storage } from '../utils/storage';

interface Props {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<Props> = ({ isDarkMode, toggleDarkMode, onLogout }) => {
  const styles = getStyles(isDarkMode);
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
      const savedProfile = storage.getItem('knect_profile');
      if (savedProfile) {
          const data = JSON.parse(savedProfile);
          if (data.name) setName(data.name);
          if (data.role) setRole(data.role);
          if (data.interests) setInterests(data.interests);
          if (data.avatar) setAvatar(data.avatar);
      }
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

  const handleSaveProfile = () => {
      setIsEditing(false);
      const profileData = { name, role, interests, avatar };
      storage.setItem('knect_profile', JSON.stringify(profileData));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
       <View style={styles.header}>
          <View style={styles.avatarContainer}>
             <TouchableOpacity onPress={handleImageChange} disabled={!isEditing}>
                 <Image source={{ uri: avatar }} style={styles.avatar} />
                 {isEditing && (
                     <View style={styles.cameraOverlay}>
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <Path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        </Svg>
                     </View>
                 )}
             </TouchableOpacity>
             <TouchableOpacity style={styles.editBadge} onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isEditing ? <Path d="M20 6L9 17l-5-5" stroke={isDarkMode ? "white" : "black"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
                </Svg>
             </TouchableOpacity>
          </View>
          
          {isEditing ? (
              <>
                  <TextInput 
                      style={[styles.nameInput, { color: '#10b981' }]} 
                      value={name} 
                      onChangeText={setName}
                      autoFocus
                  />
                  <TextInput 
                      style={[styles.roleInput, { color: '#a1a1aa' }]} 
                      value={role} 
                      onChangeText={setRole}
                  />
                  <Text style={{fontSize: 10, color: '#71717a', marginTop: 8}}>Tap photo to change</Text>
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
           <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <View style={{flexDirection: 'row', marginRight: 12}}>
                   {friends.slice(0,3).map((f,i) => (
                       <Image key={f.id} source={{uri: f.avatar}} style={[styles.miniAvatar, {marginLeft: i > 0 ? -12 : 0, zIndex: 3-i}]} />
                   ))}
               </View>
               <Text style={styles.friendsBtnText}>{friends.length} Friends</Text>
           </View>
           <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2"><Path d="M9 18l6-6-6-6"/></Svg>
       </TouchableOpacity>

       <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <Text style={styles.label}>INTERESTS</Text>
             <TouchableOpacity style={styles.plusBtn} onPress={() => setIsAddingInterest(!isAddingInterest)}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="3">
                    <Line x1="12" y1="5" x2="12" y2="19" />
                    <Line x1="5" y1="12" x2="19" y2="12" />
                </Svg>
             </TouchableOpacity>
          </View>
          
          {isAddingInterest && (
              <View style={{flexDirection: 'row', marginBottom: 12, gap: 8}}>
                  <TextInput 
                      style={[styles.tagInput, { color: isDarkMode ? 'white' : 'black', borderColor: isDarkMode ? '#333' : '#ddd' }]}
                      value={newInterest}
                      onChangeText={setNewInterest}
                      placeholder="Add interest..."
                      placeholderTextColor="#999"
                      onSubmitEditing={handleAddInterest}
                      autoFocus
                  />
                  <TouchableOpacity style={styles.addTagBtn} onPress={handleAddInterest}>
                      <Text style={{color: 'white', fontWeight: 'bold'}}>ADD</Text>
                  </TouchableOpacity>
              </View>
          )}

          <View style={styles.tagCloud}>
             {interests.map((i, idx) => (
                <TouchableOpacity key={idx} style={styles.tag} onPress={() => handleRemoveInterest(idx)} disabled={!isEditing}>
                   <Text style={styles.tagText}>{i}</Text>
                   {isEditing && (
                       <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "#333"} strokeWidth="3" style={{marginLeft: 6}}>
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
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <View style={styles.calendarIcon}>
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                          <Path d="M16 2v4" />
                          <Path d="M8 2v4" />
                          <Path d="M3 10h18" />
                      </Svg>
                  </View>
                  <Text style={styles.calendarBtnText}>Connect External Calendar</Text>
              </View>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2"><Path d="M9 18l6-6-6-6"/></Svg>
          </TouchableOpacity>
       </View>

       <View style={styles.section}>
          <Text style={styles.label}>SETTINGS</Text>
          <View style={styles.settingCard}>
             <View style={styles.settingRow}>
                <Text style={styles.settingText}>Dark Mode</Text>
                <Switch 
                    value={isDarkMode} 
                    onValueChange={toggleDarkMode}
                    trackColor={{false: '#333', true: '#10b981'}}
                    thumbColor={'white'} 
                />
             </View>
             <View style={styles.divider} />
             <TouchableOpacity style={styles.settingRow} onPress={onLogout}>
                <Text style={[styles.settingText, { color: '#ef4444' }]}>Log Out</Text>
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
               <View style={{padding: 16, backgroundColor: isDarkMode ? '#1E1E1E' : '#f4f4f5', margin: 16, borderRadius: 12}}>
                   <Text style={{color: isDarkMode ? '#aaa' : '#666', fontSize: 13, textAlign: 'center'}}>
                       Tap the star to add to Close Friends list.
                   </Text>
               </View>
               <FlatList 
                   data={friends}
                   keyExtractor={item => item.id}
                   contentContainerStyle={{padding: 24, paddingTop: 0}}
                   renderItem={({item}) => (
                       <View style={styles.friendRow}>
                           <Image source={{uri: item.avatar}} style={styles.friendAvatar} />
                           <View style={{flex: 1, marginLeft: 16}}>
                               <Text style={styles.friendName}>{item.name}</Text>
                               <Text style={styles.friendStatus}>{item.status}</Text>
                           </View>
                           <TouchableOpacity onPress={() => toggleCloseFriend(item.id)}>
                               <Svg width="24" height="24" viewBox="0 0 24 24" fill={item.isCloseFriend ? "#fbbf24" : "none"} stroke={item.isCloseFriend ? "#fbbf24" : (isDarkMode ? "#555" : "#ccc")} strokeWidth="2">
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

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { alignItems: 'center', marginTop: 0, marginBottom: 40 },
  avatarContainer: { position: 'relative', marginBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 0 },
  cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: isDark ? '#333' : 'white', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: isDark ? '#121212' : '#FDFCFB' },
  name: { fontSize: 32, fontWeight: '900', color: '#10b981', fontFamily: 'Inter', letterSpacing: -1, marginBottom: 8 },
  role: { fontSize: 11, fontWeight: '900', color: '#a1a1aa', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Inter' },
  nameInput: { fontSize: 32, fontWeight: '900', fontFamily: 'Inter', letterSpacing: -1, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#10b981', textAlign: 'center', minWidth: 200 },
  roleInput: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 12, textTransform: 'uppercase', fontFamily: 'Inter', borderBottomWidth: 1, borderBottomColor: '#a1a1aa', textAlign: 'center', minWidth: 250 },
  
  friendsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#1E1E1E' : 'white', padding: 20, borderRadius: 24, marginBottom: 32, borderWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  friendsBtnText: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#1E1E1E' : 'white' },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '900', color: '#71717a', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Inter' },
  plusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#1E1E1E' : '#eee', justifyContent: 'center', alignItems: 'center' },
  
  tagInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, fontSize: 12, fontFamily: 'Inter' },
  addTagBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 20 },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: isDark ? '#27272a' : '#fff', borderWidth: 1, borderColor: isDark ? '#333' : '#e4e4e7' },
  tagText: { fontSize: 12, fontWeight: '900', color: isDark ? 'white' : '#333', textTransform: 'uppercase', fontFamily: 'Inter', letterSpacing: 1 },
  
  calendarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#1E1E1E' : 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  calendarIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  calendarBtnText: { fontSize: 14, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },

  settingCard: { backgroundColor: isDark ? '#1E1E1E' : 'white', borderRadius: 24, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  settingText: { fontWeight: 'bold', color: isDark ? 'white' : 'black', fontSize: 14, fontFamily: 'Inter' },
  divider: { height: 1, backgroundColor: isDark ? '#333' : '#f4f4f5', marginHorizontal: 20 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: isDark ? 'white' : 'black' },
  closeText: { color: '#10b981', fontSize: 16, fontWeight: '600' },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: isDark ? '#333' : '#f4f4f5' },
  friendAvatar: { width: 48, height: 48, borderRadius: 24 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: isDark ? 'white' : 'black', marginBottom: 4 },
  friendStatus: { fontSize: 12, color: '#71717a' }
});

export default ProfilePage;