import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import {  SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, useIsFocused } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Navigation from './components/Navigation';
import SearchTab from './components/SearchTab';
import DiscoveryFeed from './components/DiscoveryFeed';
import EventPlanner from './components/EventPlanner';
import SocialDashboard from './components/SocialDashboard';
import ProfilePage from './components/ProfilePage';
import CreateProfilePage, {
  Credentials,
  ProfilePayload,
  ProfileSubmitState,
  SignupError,
  SignupIdentity,
} from './components/CreateProfilePage';

import { DiscoveryItem } from './types';

import { AuthService } from './services/AuthService';
import { UsersRepository } from './services/UsersRepository';
import { checkUserProfileExists, withTimeout, WRITE_TIMEOUT_MS } from './hooks/useProfileCheck';

// Ticket 2.3: told once, at the moment the account survives a second failed profile write and
// the user is signed out. The account is real and the email is taken — signing back in, not
// signing up again, is the way forward.
const SIGN_OUT_COPY =
  'Your account was created, but saving your profile failed. That email is already registered — sign in with it to pick up where you left off.';

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

// Ticket 1.4: an account-creation rejection stays on the signup screen, aimed at the field it's
// about, with 1.2's copy.
const signupErrorFor = (code: string): SignupError => {
  const { message } = mapAuthError(code);
  switch (code) {
    case 'auth/email-already-in-use':
    case 'auth/invalid-email':
      return { target: 'email', message };
    case 'auth/password-does-not-meet-requirements':
    case 'auth/weak-password':
      return { target: 'password', message };
    default:
      return { target: 'general', message };
  }
};

// Ticket 4.1: the signed-in app is a root stack whose only screen is the five-tab navigator, so a
// later ticket can push a screen over the tabs. The tab order here is the order in the bar.
type TabParamList = {
  Planner: undefined;
  Discover: undefined;
  Search: undefined;
  Circle: undefined;
  Profile: undefined;
};

type RootStackParamList = {
  Tabs: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// A tab's screen exists only while its tab is in front, as it did before the navigator: leaving a
// tab discards the screen, and coming back builds a fresh one. The navigator alone would keep
// every visited screen alive (an open chat would still be open on returning to Circle).
const FocusedOnly: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  useIsFocused() ? <>{children}</> : null;

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Ticket 2.3: the signup write's submitting/failed treatment, and the missing-profile
  // detection that runs after every sign-in (not just a fresh signup).
  const [submitState, setSubmitState] = useState<ProfileSubmitState>('idle');
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [profileCheckStatus, setProfileCheckStatus] = useState<'checking' | 'present' | 'missing'>('checking');
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<SignupError | null>(null);
  // Who onAuthStateChanged says is signed in. A resumed signup (signed in, no profile) starts
  // from this instead of asking for credentials again.
  const [signedInIdentity, setSignedInIdentity] = useState<SignupIdentity | null>(null);

  // Guards that must act synchronously, ahead of React's own state batching:
  const writeInFlightRef = useRef(false); // double-submit guard for the profile write
  const attemptCountRef = useRef(0); // write attempts (not auth attempts); 2 failures signs out
  // The account the profile is being saved to: its uid and the email it was created with, kept
  // together so a retry can never pair one account's uid with a different, since-edited email.
  const accountRef = useRef<{ uid: string; email: string } | null>(null);
  const checkSeqRef = useRef(0); // invalidates a stale missing-profile read after our own write lands

  useEffect(() => {
    setIsDarkMode(false);
  }, []);

  useEffect(() => {
    const unsubscribe = AuthService.subscribeToAuthState((user) => {
      setIsAuth(user !== null);
      // Keyed only off the uid onAuthStateChanged itself reports — never a locally stored id.
      setCurrentUid(user ? user.uid : null);
      setSignedInIdentity(user ? { email: user.email ?? '', name: user.displayName } : null);
      setInitializing(false);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // The one-time Users/{uid} read (a get(), never a listener) that catches an Auth account with
  // no profile document behind it — the state a failed-then-signed-out signup can leave behind.
  useEffect(() => {
    const seq = ++checkSeqRef.current;
    if (!currentUid) {
      setProfileCheckStatus('checking');
      return;
    }
    setProfileCheckStatus('checking');
    checkUserProfileExists(currentUid)
      .then((exists) => {
        if (checkSeqRef.current !== seq) return; // superseded by a newer check or a fresh write
        setProfileCheckStatus(exists ? 'present' : 'missing');
      })
      .catch(() => {
        if (checkSeqRef.current !== seq) return;
        // Rare edge case: offline with no cached copy of this doc. Stay on the checking/loading
        // visual rather than guessing - no sign-out, no new screen, per the ticket's decision.
      });
  }, [currentUid]);

  const handleAuth = async () => {
    setAuthError({ field: null, message: '' });
    setSignOutNotice(null);
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
    setAuthError({ field: null, message: '' });
    setSignOutNotice(null);
    writeInFlightRef.current = false;
    attemptCountRef.current = 0;
    accountRef.current = null;
    setSubmitState('idle');
    setSignupError(null);
    setShowCreateProfile(true);
  };

  // Submit from the onboarding sequence. With credentials (a fresh email/password signup) it
  // creates the Auth account, then saves the profile. With none, the user is already signed in (a
  // resumed signup, or a social sign-in) and the profile is saved to that account — never a second
  // one.
  const handleProfileComplete = async (profile: ProfilePayload, credentials: Credentials | null) => {
    // Double-submit guard: synchronous, so a second tap arriving before React re-renders the
    // disabled button can't slip through the same window a state check alone would leave open.
    if (writeInFlightRef.current) return;

    let account = accountRef.current;
    if (!account && !credentials) {
      if (!currentUid) return;
      account = { uid: currentUid, email: signedInIdentity?.email ?? '' };
      accountRef.current = account;
    }

    writeInFlightRef.current = true;
    setSignupError(null);
    setSubmitState('submitting');

    // The auth call happens once per signup session. A retry reuses the account it created and
    // never calls signUp again - a second call with the same email would wrongly report
    // auth/email-already-in-use even though the real failure was the Firestore write.
    if (!account && credentials) {
      try {
        const uid = await AuthService.signUp(credentials.email, credentials.password);
        account = { uid, email: credentials.email };
        accountRef.current = account;
      } catch (e: any) {
        // Auth failure - not a write failure: it doesn't consume a write attempt or enter the
        // retry machinery below. It stays on this screen, where the user can fix it.
        writeInFlightRef.current = false;
        setSubmitState('idle');
        setSignupError(signupErrorFor(e.code));
        return;
      }
    }

    await saveProfile(account!, profile);
  };

  // The profile write both paths share: bounded by a timeout, retried once from the same button,
  // then the user is signed out.
  const saveProfile = async (account: { uid: string; email: string }, profile: ProfilePayload) => {
    attemptCountRef.current += 1;
    try {
      await withTimeout(
        UsersRepository.createUserDocuments(account.uid, {
          name: profile.name,
          // 2.2's field is still called `role`; it's the bio, written to profile_info.
          role: profile.bio,
          interests: profile.interests,
          email: account.email,
        }),
        WRITE_TIMEOUT_MS,
      );
    } catch {
      writeInFlightRef.current = false;
      if (attemptCountRef.current >= 2) {
        // Retry exhausted. The Auth account survives this - the missing-profile check catches it
        // the next time they sign in.
        attemptCountRef.current = 0;
        accountRef.current = null;
        setSubmitState('idle');
        setShowCreateProfile(false);
        setAuthError({ field: null, message: '' });
        setSignOutNotice(SIGN_OUT_COPY);
        await AuthService.signOutUser();
      } else {
        setSubmitState('failed'); // red outline / "Try Again" on the same button
      }
      return;
    }

    // Both documents are confirmed written.
    writeInFlightRef.current = false;
    attemptCountRef.current = 0;
    accountRef.current = null;
    checkSeqRef.current += 1; // pre-empts a stale missing-profile read racing this same uid
    setProfileCheckStatus('present');
    setSubmitState('idle');
    // The tab navigator isn't mounted during signup, so it starts fresh on its initial route:
    // Planner, even if the previous user this session logged out from another tab.
    setShowCreateProfile(false); // only now is the tab tree reachable
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

  const handlePlanActivity = (goToPlanner: () => void, item: DiscoveryItem | null, participants?: string[]) => {
      if (item) setPendingDiscoveryItem(item);
      if (participants) setPendingParticipants(participants);
      setIsChatOpen(false); // Close chat to show nav bar
      goToPlanner();
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
              <CreateProfilePage
                isDarkMode={isDarkMode}
                onComplete={handleProfileComplete}
                submitting={submitState}
                signupError={signupError}
              />
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

              {signOutNotice && (
                <Text style={styles.errorText}>{signOutNotice}</Text>
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

               {/* Google and Apple sign-in are hidden until ticket 1.3 wires them up (it needs a paid
                   Apple Developer account). */}
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

  // Ticket 2.3: the moment after onAuthStateChanged reports a signed-in user but before the
  // one-time Users/{uid} read resolves. Neither the tab tree nor the login screen is correct
  // here - same visual family as the `initializing` state above, for the same reason: flashing
  // the wrong screen at a user who turns out to have a perfectly good profile is the bug this
  // state exists to prevent. A rejected read (no cache, no connection) also lands here and stays
  // here, rather than guessing.
  if (profileCheckStatus === 'checking') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Ticket 1.4: a signed-in user with no Users document - the account a failed profile write can
  // leave behind - resumes the signup at step two. They're already signed in, so step one is
  // skipped and the profile is saved to the account they're in.
  if (profileCheckStatus === 'missing') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <CreateProfilePage
              isDarkMode={isDarkMode}
              onComplete={handleProfileComplete}
              submitting={submitState}
              identity={signedInIdentity ?? { email: '' }}
              signupError={signupError}
            />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // The navigator paints its own background behind every screen; keep it the app's.
  const navigationTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: isDarkMode ? '#121212' : '#FDFCFB' },
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navigationTheme}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Tabs">
            {() => (
              <Tab.Navigator
                initialRouteName="Planner"
                backBehavior="none"
                screenOptions={{ headerShown: false }}
                tabBar={(props) => (isChatOpen ? null : <Navigation {...props} isDarkMode={isDarkMode} />)}
              >
                <Tab.Screen name="Planner">
                  {() => (
                    <FocusedOnly>
                      <EventPlanner
                          isDarkMode={isDarkMode}
                          initialProposal={pendingDiscoveryItem}
                          initialParticipants={pendingParticipants}
                      />
                    </FocusedOnly>
                  )}
                </Tab.Screen>
                <Tab.Screen name="Discover">
                  {({ navigation }) => (
                    <FocusedOnly>
                      <DiscoveryFeed
                          isDarkMode={isDarkMode}
                          onPlanActivity={(item) => handlePlanActivity(() => navigation.navigate('Planner'), item)}
                      />
                    </FocusedOnly>
                  )}
                </Tab.Screen>
                <Tab.Screen name="Search">
                  {() => (
                    <FocusedOnly>
                      <SearchTab isDarkMode={isDarkMode} />
                    </FocusedOnly>
                  )}
                </Tab.Screen>
                <Tab.Screen name="Circle">
                  {({ navigation }) => (
                    <FocusedOnly>
                      <SocialDashboard
                          isDarkMode={isDarkMode}
                          onChatOpen={() => setIsChatOpen(true)}
                          onChatClose={() => setIsChatOpen(false)}
                          onPlanActivity={(item, participants) => handlePlanActivity(() => navigation.navigate('Planner'), item, participants)}
                      />
                    </FocusedOnly>
                  )}
                </Tab.Screen>
                <Tab.Screen name="Profile">
                  {() => (
                    <FocusedOnly>
                      <ProfilePage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onLogout={handleLogout} />
                    </FocusedOnly>
                  )}
                </Tab.Screen>
              </Tab.Navigator>
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#121212' : '#FDFCFB' },
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

  forgotPasswordText: { color: '#71717a', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 12, fontFamily: 'Inter' },

  errorText: { color: '#ff8080', textAlign: 'center', fontFamily: 'Anonymous Pro' }
});

export default App;
