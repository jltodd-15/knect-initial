import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, useColorScheme, Platform } from 'react-native';
import { AppTab } from './types';
import Navigation from './components/Navigation';
import DiscoveryFeed from './components/DiscoveryFeed';
import EventPlanner from './components/EventPlanner';
import SocialDashboard from './components/SocialDashboard';
import ProfilePage from './components/ProfilePage';
//import { GoogleGenAI } from '@google/genai'; // Keeping logic imports

import { createAsyncStorage } from "@react-native-async-storage/async-storage";

// Auth Component
import { TouchableOpacity, TextInput, Image } from 'react-native';

const App: React.FC = () => {
  const systemColorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PLANNER);
  const [isAuth, setIsAuth] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default logic handled in useEffect

  const localStorage = createAsyncStorage("appDB");

  // Theme State Initialization
  useEffect(() => {
    async () => { 
      const savedTheme = await localStorage.getItem('knect_theme'); 
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(systemColorScheme === 'dark');
      }
    }
  }, [systemColorScheme]);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('knect_session');
    if (savedUser != null) setIsAuth(true);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('knect_theme', newMode ? 'dark' : 'light');
  };

  const handleAuth = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockUser = { id: 'user_123', email: email || 'alex@knect.app' };
      // TODO: add session handling here, data retrieval, etc.
      localStorage.setItem('knect_session', JSON.stringify(mockUser));
      setIsAuth(true);
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('knect_session');
    setIsAuth(false);
  };

  const styles = getStyles(isDarkMode);

  if (!isAuth) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.authContainer}>
          <View style={styles.logoContainer}>
             <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={styles.title}>Knect</Text>
          <Text style={styles.subtitle}>PLAN SMARTER. CONNECT DEEPER.</Text>

          <View style={styles.formContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="EMAIL" 
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput 
              style={styles.input} 
              placeholder="PASSWORD" 
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'CONNECTING...' : 'SIGN IN'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.contentContainer}>
        {activeTab === AppTab.PLANNER && <EventPlanner isDarkMode={isDarkMode} />}
        {activeTab === AppTab.FEED && <DiscoveryFeed isDarkMode={isDarkMode} />}
        {activeTab === AppTab.SOCIAL && <SocialDashboard isDarkMode={isDarkMode} />}
        {activeTab === AppTab.PROFILE && <ProfilePage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onLogout={handleLogout} />}
      </View>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#FDFCFB',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // Space for tab bar
  },
  authContainer: {
    width: '100%',
    padding: 30,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#10b981',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    transform: [{ rotate: '3deg' }]
  },
  logoText: {
    color: 'white',
    fontSize: 40,
    fontWeight: '900',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: isDark ? 'white' : '#18181b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#71717a',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    backgroundColor: isDark ? '#1E1E1E' : 'white',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: isDark ? '#27272a' : '#f4f4f5',
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  input: {
    width: '100%',
    padding: 20,
    backgroundColor: isDark ? '#27272a' : '#f4f4f5',
    borderRadius: 20,
    color: isDark ? 'white' : 'black',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  button: {
    width: '100%',
    padding: 20,
    backgroundColor: '#10b981',
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  }
});

export default App;