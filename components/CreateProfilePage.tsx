import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Platform } from 'react-native';
import * from 'react-native-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, } from 'react-native-svg';

interface Props {
  isDarkMode: boolean;
  onComplete: (profileData: any) => void;
}

const CreateProfilePage: React.FC<Props> = ({ isDarkMode, onComplete }) => {
  const styles = getStyles(isDarkMode);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop');
  const [hideText, setHideText] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nextStep, setNextStep] = useState(false);
  
  const [badEmail, setBadEmail] = useState(false);
  const [badPass, setBadPass] = useState(false);

  var hideButton = false;

  const handleAddInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest.trim().toUpperCase()]);
      setNewInterest('');
    }
  };

  const handleNextStep = (goAhead: boolean) => {
    if (goAhead) {
      hideButton = true;
      setNextStep(true);
    }
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleImageUpload = () => {
    // In a real app, this would open the image picker
    // For this demo, we'll just cycle through some mock images
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

  function _formatVerify() {
    const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    const passRegex = new RegExp(/^[a-zA-Z0-9!@#$%^&*()<>?{}\[\];',.\/\\`~]{2,24}$/);
    setBadEmail(!emailRegex.test(email));
    setBadPass(!passRegex.test(password));
    if (emailRegex.test(email) == false || passRegex.test(password) == false) {
      return false;
    }
    else {
      return true;
    }; 
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      { true && (
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput 
                  style={styles.input} 
                  value={email}
                  onChangeText={setEmail}
                  placeholder="username@example.com"
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
              />
              { badEmail && (
              <Text style={styles.errorText}>Your email address is invalid (e.g, mark@example.com)</Text>
              )}
          </View>

          <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput 
                  style={styles.input} 
                  value={password}
                  onChangeText={setPassword}
                  placeholder="correcthorsebatterystaple"
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  secureTextEntry={hideText}
              />
              { badPass && (
              <Text style={styles.errorText}>Your password must be 12-24 characters long</Text>
              )}
              <TouchableOpacity style={styles.hideText} onPress={() => {setHideText(!hideText ? true : false); console.log(hideText)}}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={'#c1c1c1'} strokeWidth="2.5">
                  <Circle cx="12" cy="12" r="10" />
                  <Circle cx="8" cy="8" r="10" />
                </Svg>
              </TouchableOpacity>
          </View>

          { !hideButton && (
          <TouchableOpacity 
              style={[styles.submitBtn, (!email || !password) && styles.submitBtnDisabled]} 
              onPress={() => { handleNextStep(_formatVerify()); }}
              disabled={!email || !password}
          >
              <Text style={styles.submitBtnText}>NEXT</Text>
          </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      )}
      { nextStep && (
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.title}>Create Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleImageUpload} style={styles.avatarWrapper}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <View style={styles.cameraIcon}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <Path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </Svg>
              </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput 
                    style={styles.input} 
                    value={name} 
                    onChangeText={setName}
                    placeholder="e.g. Alex Rivera"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>ROLE / LOCATION</Text>
                <TextInput 
                    style={styles.input} 
                    value={role} 
                    onChangeText={setRole}
                    placeholder="e.g. Digital Nomad • SF"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                />
            </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>INTERESTS</Text>
              <View style={styles.addInterestRow}>
                  <TextInput 
                      style={[styles.input, {flex: 1}]} 
                      value={newInterest} 
                      onChangeText={setNewInterest}
                      placeholder="Add an interest..."
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      onSubmitEditing={handleAddInterest}
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddInterest}>
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><Path d="M12 5v14M5 12h14"/></Svg>
                  </TouchableOpacity>
              </View>
              <View style={styles.tagCloud}>
                  {interests.map((tag, idx) => (
                      <TouchableOpacity key={idx} style={styles.tag} onPress={() => handleRemoveInterest(idx)}>
                          <Text style={styles.tagText}>{tag}</Text>
                          <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="2" style={{marginLeft: 6}}>
                              <Path d="M18 6L6 18M6 6l12 12"/>
                          </Svg>
                      </TouchableOpacity>
                  ))}
              </View>
          </View>

          <TouchableOpacity 
              style={[styles.submitBtn, (!name || !role) && styles.submitBtnDisabled]} 
              onPress={() => onComplete({ name, role, interests, avatar })}
              disabled={!name || !role}
          >
              <Text style={styles.submitBtnText}>COMPLETE PROFILE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      )}
    </ScrollView>
  );
};
const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '900', color: '#10b981', fontFamily: 'Inter', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#71717a', fontFamily: 'Inter' },
  
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10b981', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: isDark ? '#121212' : '#FDFCFB' },
  photoHint: { marginTop: 12, color: '#71717a', fontSize: 12, fontWeight: '600' },

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '900', color: '#71717a', letterSpacing: 1, fontFamily: 'Inter' },
  input: { backgroundColor: isDark ? '#1E1E1E' : '#f4f4f5', padding: 16, borderRadius: 16, fontSize: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  
  addInterestRow: { flexDirection: 'row', gap: 12 },
  addBtn: { width: 50, backgroundColor: '#10b981', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: isDark ? '#27272a' : '#fff', borderWidth: 1, borderColor: isDark ? '#333' : '#e4e4e7' },
  tagText: { fontSize: 12, fontWeight: 'bold', color: isDark ? 'white' : 'black' },

  submitBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 24, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  hideText: { backgroundColor: '#8f8f8f', borderRadius: 36, padding: 5, width: '9%' },
  errorText: { color: '#ff8080', textAlign: 'center', fontFamily: 'Anonymous Pro' }
});

export default CreateProfilePage;
