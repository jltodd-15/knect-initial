import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import {  SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppTab } from './types';
import Navigation from './components/Navigation';
import DiscoveryFeed from './components/DiscoveryFeed';
import EventPlanner from './components/EventPlanner';
import SocialDashboard from './components/SocialDashboard';
import ProfilePage from './components/ProfilePage';
import CreateProfilePage, { CreateProfileData } from './components/CreateProfilePage';

import { DiscoveryItem } from './types';

import { AuthService } from './services/AuthService';

type AuthErrorField = 'email' | 'credential' | 'network' | null;

const mapAuthError = (code: string): { field: AuthErrorField; message: string } => {
  switch (code) {
    case 'auth/invalid-email':
      return { field: 'email', message: 'Email is badly formatted' };
    case 'auth/password-does-not-meet-requirements':
      return { field: 'credential', message: 'Password must be at least 8 characters and include a capital letter and a number' };
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return { field: 'credential', message: 'Email or password are incorrect' };
    case 'auth/email-already-in-use':
      return { field: 'credential', message: 'Email already in use' };
    case 'auth/network-request-failed':
      return { field: 'network', message: 'No internet connection. Check your network and try again.' };
    default:
      return { field: 'credential', message: 'Something went wrong. Please try again.' };
  }
};

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

  //errors
  const [authError, setAuthError] = useState<{ field: AuthErrorField; message: string }>({ field: null, message: '' });

  const [initializing, setInitializing] = useState(true);
  const [authView, setAuthView] = useState<'signin' | 'forgotPassword' | 'resetSent'>('signin');
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    setIsDarkMode(false);
  }, []);

  useEffect(() => {
    const unsubscribe = AuthService.subscribeToAuthState((user) => {
      setIsAuth(user !== null);
      setInitializing(false);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleAuth = async () => {
    setAuthError({ field: null, message: '' });
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
    } catch (e: any) {
      setLoading(false);
      setAuthError(mapAuthError(e.code));
    }
  };

  const handleSignUp = () => {
    setLoading(false);
    setShowCreateProfile(true);
  };

  const handleProfileComplete = async (profileData: CreateProfileData) => {
    setShowCreateProfile(false);
    setLoading(true);
    try {
      await AuthService.signUp(profileData.email, profileData.password);
    } catch (e: any) {
      setLoading(false);
      setAuthError(mapAuthError(e.code));
    }
  };

  const handleLogout = async () => {
    await AuthService.signOutUser();
  };

  const handleForgotPassword = async () => {
    setAuthError({ field: null, message: '' });
    try {
      await AuthService.resetPassword(resetEmail);
      setAuthView('resetSent');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        setAuthView('resetSent');
        return;
      }
      setAuthError(mapAuthError(e.code));
    }
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

  if (initializing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (showCreateProfile) {
      return (
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <CreateProfilePage isDarkMode={isDarkMode} onComplete={handleProfileComplete} />
          </SafeAreaView>
        </SafeAreaProvider>
      );
  }

  if (!isAuth) {
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

          {authView === 'signin' && (
            <View style={styles.formCard}>
               <TextInput
                  style={styles.input}
                  placeholder="EMAIL ADDRESS"
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
               />
               {authError.field === 'email' && (
                 <Text style={styles.errorText}>{authError.message}</Text>
               )}
               <TextInput
                  style={styles.input}
                  placeholder="PASSWORD"
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
               />

              {(authError.field === 'credential' || authError.field === 'network') && (
                <Text style={styles.errorText}>
                  {authError.field === 'network' ? authError.message : `Unable to sign in: ${authError.message}`}
                </Text>
              )}

               <TouchableOpacity style={styles.signInBtn} onPress={handleAuth} disabled={loading}>
                  <Text style={styles.signInText}>{loading ? 'PROCESSING...' : 'SIGN IN'}</Text>
               </TouchableOpacity>

               <TouchableOpacity style={[styles.signInBtn, {backgroundColor: 'transparent', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#ddd', marginTop: 12}]} onPress={handleSignUp} disabled={loading}>
                  <Text style={[styles.signInText, {color: isDarkMode ? 'white' : 'black'}]}>CREATE ACCOUNT</Text>
               </TouchableOpacity>

               <TouchableOpacity onPress={() => { setAuthError({ field: null, message: '' }); setAuthView('forgotPassword'); }} disabled={loading}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
               </TouchableOpacity>

               <View style={styles.divider}>
                 <View style={styles.line} />
                 <Text style={styles.orText}>OR</Text>
                 <View style={styles.line} />
               </View>

               <View style={styles.socialRow}>
                  <TouchableOpacity style={[styles.socialBtn, styles.socialBtnDisabled]} disabled={true}>
                     <Text style={[styles.socialText, styles.socialTextDisabled]}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.socialBtn, styles.socialBtnDisabled]} disabled={true}>
                     <Text style={[styles.socialText, styles.socialTextDisabled]}>Apple</Text>
                  </TouchableOpacity>
               </View>
            </View>
          )}

          {authView === 'forgotPassword' && (
            <View style={styles.formCard}>
               <TextInput
                  style={styles.input}
                  placeholder="EMAIL ADDRESS"
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
               />
               {authError.field && (
                 <Text style={styles.errorText}>{authError.message}</Text>
               )}
               <TouchableOpacity style={styles.signInBtn} onPress={handleForgotPassword}>
                  <Text style={styles.signInText}>SEND RESET EMAIL</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setAuthError({ field: null, message: '' }); setAuthView('signin'); }}>
                  <Text style={styles.forgotPasswordText}>Back to sign in</Text>
               </TouchableOpacity>
            </View>
          )}

          {authView === 'resetSent' && (
            <View style={styles.formCard}>
               <Text style={styles.errorText}>Password reset email sent</Text>
               <TouchableOpacity style={styles.signInBtn} onPress={() => setAuthView('signin')}>
                  <Text style={styles.signInText}>BACK TO SIGN IN</Text>
               </TouchableOpacity>
            </View>
          )}
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
  socialText: { fontWeight: 'bold', color: '#71717a', fontSize: 10, textTransform: 'uppercase', fontFamily: 'Inter' },
  socialBtnDisabled: { opacity: 0.4, borderColor: isDark ? '#27272a' : '#e4e4e7' },
  socialTextDisabled: { color: isDark ? '#52525b' : '#a1a1aa' },

  forgotPasswordText: { color: '#71717a', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 12, fontFamily: 'Inter' },

  errorText: { color: '#ff8080', textAlign: 'center', fontFamily: 'Anonymous Pro' }
});

export default App;
