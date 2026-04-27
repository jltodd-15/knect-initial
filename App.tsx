import React, { useState, useEffect } from 'react';
import { NativeModules, View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { AppTab } from './types';
import Navigation from './components/Navigation';
import DiscoveryFeed from './components/DiscoveryFeed';
import EventPlanner from './components/EventPlanner';
import SocialDashboard from './components/SocialDashboard';
import ProfilePage from './components/ProfilePage';
import CreateProfilePage from './components/CreateProfilePage';

import { DiscoveryItem } from './types';

import { localStorage, keyChain } from './utils/storage';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PLANNER);
  const [isAuth, setIsAuth] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingDiscoveryItem, setPendingDiscoveryItem] = useState<DiscoveryItem | null>(null);
  const [pendingParticipants, setPendingParticipants] = useState<string[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {FirebaseModule} = NativeModules;

  useEffect(() => {
    setIsDarkMode(false);
  }, []);

  const handleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      if (!FirebaseModule.authenticateUser()) {
        localStorage.setItem('knect_session', 'true');
        setIsAuth(true);
        setLoading(false);
      }
    }, 5000);
  };

  const handleSignUp = () => {
      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          setShowCreateProfile(true);
      }, 800);
  };

  const handleProfileComplete = (profileData: any) => {
      FirebaseModule.createUserData(email, password);
      setShowCreateProfile(false);
      setIsAuth(true);
  };

  const handleLogout = () => {
    setIsAuth(false);
  };

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
  };

  const handlePlanActivity = (item: DiscoveryItem | null, participants?: string[]) => {
      if (item) setPendingDiscoveryItem(item);
      if (participants) setPendingParticipants(participants);
      setIsChatOpen(false); // Close chat to show nav bar
      setActiveTab(AppTab.PLANNER);
  };

  const styles = getStyles(isDarkMode);

  if (showCreateProfile) {
      return (
          <SafeAreaView style={styles.container}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <CreateProfilePage isDarkMode={isDarkMode} onComplete={handleProfileComplete} />
          </SafeAreaView>
      );
  }

  if (!isAuth) {
    console.log(isAuth);
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.authContainer}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
             <View style={styles.logoBox}>
                <Text style={styles.logoText}>Kn</Text>
             </View>
             <Text style={styles.appTitle}>Knect</Text>
             <Text style={styles.appSubtitle}>Plan smarter. Connect deeper.</Text>
          </View>

          <View style={styles.formCard}>
             <TextInput 
                style={styles.input} 
                placeholder="EMAIL ADDRESS" 
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
             />
             <TextInput 
                style={styles.input} 
                placeholder="PASSWORD" 
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
             />
             <TouchableOpacity style={styles.signInBtn} onPress={handleAuth} disabled={loading}>
                <Text style={styles.signInText}>{loading ? 'PROCESSING...' : 'SIGN IN'}</Text>
             </TouchableOpacity>
             
             <TouchableOpacity style={[styles.signInBtn, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#ddd', marginTop: 12}]} onPress={handleSignUp} disabled={loading}>
                <Text style={[styles.signInText, {color: isDarkMode ? 'white' : 'black'}]}>CREATE ACCOUNT</Text>
             </TouchableOpacity>

             <View style={styles.divider}>
               <View style={styles.line} />
               <Text style={styles.orText}>OR</Text>
               <View style={styles.line} />
             </View>

             <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} onPress={handleAuth}>
                   <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} onPress={handleAuth}>
                   <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        {activeTab === AppTab.PLANNER && (
            <EventPlanner 
                isDarkMode={isDarkMode} 
                initialProposal={pendingDiscoveryItem} 
                initialParticipants={pendingParticipants}
            />
        )}
        {activeTab === AppTab.FEED && (
            <DiscoveryFeed 
                isDarkMode={isDarkMode} 
                onPlanActivity={(item) => handlePlanActivity(item)} 
            />
        )}
        {activeTab === AppTab.SOCIAL && (
            <SocialDashboard 
                isDarkMode={isDarkMode} 
                onChatOpen={() => setIsChatOpen(true)}
                onChatClose={() => setIsChatOpen(false)}
                onPlanActivity={(item, participants) => handlePlanActivity(item, participants)}
            />
        )}
        {activeTab === AppTab.PROFILE && <ProfilePage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onLogout={handleLogout} />}
      </View>
      {!isChatOpen && <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />}
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
  content: { flex: 1 },
  authContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  
  logoBox: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    backgroundColor: '#10b981', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24,
  },
  logoText: {
    fontFamily: 'Anonymous Pro',
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -2
  },
  
  appTitle: { fontSize: 40, fontWeight: '700', color: isDark ? 'white' : 'black', marginBottom: 8, fontFamily: 'Anonymous Pro' },
  appSubtitle: { fontSize: 10, fontWeight: '900', color: '#71717a', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Inter' },
  
  formCard: { backgroundColor: isDark ? '#1E1E1E' : 'white', padding: 32, borderRadius: 40, gap: 16, borderWidth: 1, borderColor: isDark ? '#333' : '#f0f0f0' },
  input: { backgroundColor: isDark ? '#2C2C2C' : '#f4f4f5', padding: 20, borderRadius: 24, fontSize: 12, fontWeight: 'bold', color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  signInBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 24, alignItems: 'center' },
  signInText: { color: 'white', fontWeight: '900', fontSize: 12, letterSpacing: 2, fontFamily: 'Inter' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  line: { flex: 1, height: 1, backgroundColor: isDark ? '#333' : '#eee' },
  orText: { marginHorizontal: 16, fontSize: 10, fontWeight: '900', color: '#71717a', fontFamily: 'Inter' },
  socialRow: { flexDirection: 'row', gap: 16 },
  socialBtn: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: isDark ? '#333' : '#eee', alignItems: 'center' },
  socialText: { fontWeight: 'bold', color: '#71717a', fontSize: 10, textTransform: 'uppercase', fontFamily: 'Inter' }
});

export default App;