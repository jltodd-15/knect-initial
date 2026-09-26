import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import InitialsAvatar from './InitialsAvatar';

// Ticket 1.4: the fixed interests vocabulary, stored verbatim. These strings are also the tag
// vocabulary Project 9 has to use for Activities.tags, so 13.2's affinity seeding matches them.
// Don't reword, reorder casually, or transform them (no uppercasing).
export const INTERESTS = [
  'Hiking', 'Art', 'Fashion', 'Style', 'Photography', 'Board games', 'Movies', 'TV Shows',
  'Video Games', 'Baking', 'Cooking', 'Fast Food', 'Fine Dining', 'Running', 'Bodybuilding',
  'Camping', 'Outdoors', 'Indoors', 'Music', 'Concerts', 'Dancing', 'Musicals & Theater',
  'Travel', 'Family', 'Pets & Animals', 'Dating', 'Tech', 'Basketball', 'Baseball',
  'Football', 'Hockey', 'Soccer', 'Sports', 'Reading', 'History',
];

// The signup password rule: 8-24 characters, a capital letter, a number. The same rule is set in
// Firebase Console → Authentication → Password policy; if the two ever disagree, the Console wins
// and this is the bug. Checked at signup only — never before a sign-in.
const PASSWORD_RULES = [
  { label: '8–24 characters', test: (p: string) => p.length >= 8 && p.length <= 24 },
  { label: 'A capital letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p: string) => /[0-9]/.test(p) },
];
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9]).{8,24}$/;
// 1.2's mapped copy for Firebase's own policy rejection, word for word.
const PASSWORD_COPY = 'Password must be at least 8 characters and include a capital letter and a number';

// What onboarding hands off for the Users write. No email and no password: credentials travel
// separately, and profile_picture_url is "" until Project 6 builds upload (the initials avatar
// is what shows in the meantime).
export interface ProfilePayload {
  name: string;
  bio: string;
  interests: string[];
  profile_picture_url: string;
}

export interface Credentials {
  email: string;
  password: string;
}

// Someone who arrives already signed in: a social sign-in (1.3), or a resumed signup whose
// profile write failed. Step one is skipped. `name` may be missing — Apple can withhold it.
export interface SignupIdentity {
  email: string;
  name?: string | null;
}

// A rejection from creating the account, aimed at the field it's about.
export interface SignupError {
  target: 'email' | 'password' | 'general';
  message: string;
}

// Ticket 2.3: the state of the real signup write, driven from App.tsx. 'failed' is the
// retry-available state (red outline, "Try Again") — the same button that submitted the first
// time is what retries, so this is the only extra thing the button needs to know.
export type ProfileSubmitState = 'idle' | 'submitting' | 'failed';

interface Props {
  isDarkMode: boolean;
  // `credentials` is null when the user arrived with an identity and never saw step one.
  onComplete: (profile: ProfilePayload, credentials: Credentials | null) => void;
  submitting: ProfileSubmitState;
  identity?: SignupIdentity;
  signupError?: SignupError | null;
}

const CreateProfilePage: React.FC<Props> = ({ isDarkMode, onComplete, submitting, identity, signupError }) => {
  const styles = getStyles(isDarkMode);
  const [step, setStep] = useState<'credentials' | 'profile'>(identity ? 'profile' : 'credentials');

  const [name, setName] = useState(identity?.name ?? '');
  // A name that arrived with the identity is shown, not asked for, until the user taps CHANGE.
  const [editingName, setEditingName] = useState(!identity?.name);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [hideText, setHideText] = useState(true);

  // The password lives here, in component state, and nowhere else. It is handed to onComplete as
  // a credential, never as part of the profile.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [badEmail, setBadEmail] = useState(false);
  const [badPass, setBadPass] = useState(false);

  // An email or password rejection from creating the account belongs on step one.
  useEffect(() => {
    if (signupError && signupError.target !== 'general' && !identity) {
      setStep('credentials');
    }
  }, [signupError, identity]);

  const toggleInterest = (interest: string) => {
    setInterests(current =>
      current.includes(interest) ? current.filter(i => i !== interest) : [...current, interest],
    );
  };

  function _formatVerify() {
    const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    setBadEmail(!emailRegex.test(email));
    setBadPass(!PASSWORD_REGEX.test(password));
    return emailRegex.test(email) && PASSWORD_REGEX.test(password);
  };

  const handleNext = () => {
    if (_formatVerify()) {
      setStep('profile');
    }
  };

  const handleComplete = () => {
    onComplete(
      { name: name.trim(), bio: bio.trim(), interests, profile_picture_url: '' },
      identity ? null : { email, password },
    );
  };

  // Once the account exists (or is being created), its email is fixed: going back to edit it
  // would look like it fixes a typo and wouldn't.
  const backLocked = submitting !== 'idle';
  const canComplete = name.trim().length > 0 && submitting !== 'submitting';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      { step === 'credentials' && (
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
              { signupError?.target === 'email' && (
              <Text style={styles.errorText}>{signupError.message}</Text>
              )}
          </View>

          <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordRow}>
                <TextInput 
                    style={[styles.input, styles.passwordInput]} 
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    secureTextEntry={hideText}
                />
                <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setHideText(!hideText)}
                    accessibilityLabel={hideText ? 'Show password' : 'Hide password'}
                >
                  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={styles.ruleList}>
                {PASSWORD_RULES.map(rule => {
                  const met = rule.test(password);
                  return (
                    <Text key={rule.label} style={[styles.ruleText, met && styles.ruleMet]}>
                      {rule.label}
                    </Text>
                  );
                })}
              </View>
              { badPass && (
              <Text style={styles.errorText}>{PASSWORD_COPY}</Text>
              )}
              { signupError?.target === 'password' && !badPass && (
              <Text style={styles.errorText}>{signupError.message}</Text>
              )}
          </View>

          <TouchableOpacity 
              style={[styles.submitBtn, (!email || !password) && styles.submitBtnDisabled]} 
              onPress={handleNext}
              disabled={!email || !password}
              accessibilityLabel="Next"
          >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      )}
      { step === 'profile' && (
      <SafeAreaView>
        { !identity && (
          <TouchableOpacity
              testID="back-button"
              style={[styles.backBtn, backLocked && styles.backBtnLocked]}
              onPress={() => setStep('credentials')}
              disabled={backLocked}
              accessibilityLabel="Back"
          >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={backLocked ? '#a1a1aa' : '#10b981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M19 12H5M11 6l-6 6 6 6" />
              </Svg>
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Create Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        <View style={styles.avatarSection}>
          <InitialsAvatar name={name} size={120} />
        </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                { editingName ? (
                <TextInput 
                    style={styles.input} 
                    value={name} 
                    onChangeText={setName}
                    placeholder="e.g. Alex Rivera"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                />
                ) : (
                <View style={styles.prefilledRow}>
                    <Text style={styles.prefilledName}>{name}</Text>
                    <TouchableOpacity onPress={() => setEditingName(true)}>
                        <Text style={styles.changeText}>CHANGE</Text>
                    </TouchableOpacity>
                </View>
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>BIO</Text>
                <TextInput 
                    style={styles.input} 
                    value={bio} 
                    onChangeText={setBio}
                    placeholder="A line about you (optional)"
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                />
            </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>INTERESTS</Text>
              <View style={styles.tagCloud}>
                  {INTERESTS.map(interest => {
                      const selected = interests.includes(interest);
                      return (
                        <TouchableOpacity key={interest} style={[styles.tag, selected && styles.tagSelected]} onPress={() => toggleInterest(interest)}>
                            <Text testID="interest-option" style={[styles.tagText, selected && styles.tagTextSelected]}>{interest}</Text>
                        </TouchableOpacity>
                      );
                  })}
              </View>
          </View>

          { signupError?.target === 'general' && (
          <Text style={styles.errorText}>{signupError.message}</Text>
          )}

          <TouchableOpacity
              testID="complete-button"
              style={[
                styles.submitBtn,
                !name.trim() && styles.submitBtnDisabled,
                submitting === 'failed' && { borderWidth: 2, borderColor: '#ff8080', backgroundColor: 'transparent' },
              ]}
              onPress={handleComplete}
              disabled={!canComplete}
          >
              { submitting === 'submitting' ? (
              <View style={styles.submittingRow}>
                  <ActivityIndicator testID="submit-spinner" color="white" />
                  <Text style={styles.submitBtnText}>SAVING PROFILE...</Text>
              </View>
              ) : (
              <Text style={[styles.submitBtnText, submitting === 'failed' && { color: '#ff8080' }]}>
                {submitting === 'failed' ? 'TRY AGAIN' : 'COMPLETE PROFILE'}
              </Text>
              )}
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

  form: { gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '900', color: '#71717a', letterSpacing: 1, fontFamily: 'Inter' },
  input: { backgroundColor: isDark ? '#1E1E1E' : '#f4f4f5', padding: 16, borderRadius: 16, fontSize: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  
  prefilledRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDark ? '#1E1E1E' : '#f4f4f5', padding: 16, borderRadius: 16 },
  prefilledName: { fontSize: 16, color: isDark ? 'white' : 'black', fontFamily: 'Inter' },
  changeText: { fontSize: 11, fontWeight: '900', color: '#10b981', letterSpacing: 1, fontFamily: 'Inter' },

  ruleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  ruleText: { fontSize: 12, color: '#71717a', fontFamily: 'Inter' },
  ruleMet: { color: '#10b981', fontWeight: '700' },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: isDark ? '#27272a' : '#fff', borderWidth: 1, borderColor: isDark ? '#333' : '#e4e4e7' },
  tagSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  tagText: { fontSize: 12, fontWeight: 'bold', color: isDark ? 'white' : 'black' },
  tagTextSelected: { color: 'white' },

  submitBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 24, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  submittingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4 },
  backBtnLocked: { opacity: 0.4 },

  passwordRow: { justifyContent: 'center' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  errorText: { color: '#ff8080', textAlign: 'center', fontFamily: 'Anonymous Pro' }
});

export default CreateProfilePage;
