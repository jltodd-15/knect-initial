import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import InitialsAvatar from './InitialsAvatar';
import { Theme } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

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
  // `credentials` is null when the user arrived with an identity and never saw step one.
  onComplete: (profile: ProfilePayload, credentials: Credentials | null) => void;
  submitting: ProfileSubmitState;
  identity?: SignupIdentity;
  signupError?: SignupError | null;
}

const CreateProfilePage: React.FC<Props> = ({ onComplete, submitting, identity, signupError }) => {
  const theme = useTheme();
  const { colors, icons } = theme;
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [step, setStep] = useState<'credentials' | 'profile'>(identity ? 'profile' : 'credentials');

  const [name, setName] = useState(identity?.name ?? '');
  // A name that arrived with the identity is shown, not asked for, until the user taps CHANGE.
  const [editingName, setEditingName] = useState(!identity?.name);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [hideText, setHideText] = useState(true);
  // The open eye offers to show the password; the crossed eye offers to hide it again.
  const PasswordIcon = hideText ? Eye : EyeOff;

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
                  placeholderTextColor={colors.placeholder}
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
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={hideText}
                />
                <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setHideText(!hideText)}
                    accessibilityLabel={hideText ? 'Show password' : 'Hide password'}
                >
                  <PasswordIcon size={22} color={colors.textSecondary} strokeWidth={icons.strokeWidth} />
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
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.onPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={backLocked ? colors.textDisabled : colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    placeholderTextColor={colors.placeholder}
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
                    placeholderTextColor={colors.placeholder}
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
                submitting === 'failed' && styles.submitBtnFailed,
              ]}
              onPress={handleComplete}
              disabled={!canComplete}
          >
              { submitting === 'submitting' ? (
              <View style={styles.submittingRow}>
                  <ActivityIndicator testID="submit-spinner" color={colors.onPrimary} />
                  <Text style={styles.submitBtnText}>SAVING PROFILE...</Text>
              </View>
              ) : (
              <Text style={[styles.submitBtnText, submitting === 'failed' && styles.submitBtnTextFailed]}>
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
const getStyles = ({ colors, typography, spacing, radius }: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', marginTop: 40, marginBottom: spacing['2xl'] },
  title: { ...typography.display, color: colors.primary, fontFamily: 'Manrope', marginBottom: spacing.sm },
  subtitle: { fontSize: typography.label.fontSize, color: colors.textSecondary, fontFamily: 'Manrope' },
  
  avatarSection: { alignItems: 'center', marginBottom: spacing['2xl'] },

  form: { gap: spacing.xl },
  inputGroup: { gap: spacing.sm },
  label: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, fontFamily: 'Manrope' },
  input: { backgroundColor: colors.surfaceAlt, padding: spacing.base, borderRadius: radius.lg, fontSize: typography.body.fontSize, color: colors.textPrimary, fontFamily: 'Manrope' },
  
  prefilledRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, padding: spacing.base, borderRadius: radius.lg },
  prefilledName: { fontSize: typography.body.fontSize, color: colors.textPrimary, fontFamily: 'Manrope' },
  changeText: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.primary, letterSpacing: 1, fontFamily: 'Manrope' },

  ruleList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  ruleText: { fontSize: typography.caption.fontSize, color: colors.textSecondary, fontFamily: 'Manrope' },
  ruleMet: { color: colors.primary, fontWeight: '700' },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tagSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.textPrimary },
  tagTextSelected: { color: colors.onPrimary },

  submitBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.xl, alignItems: 'center', marginTop: spacing.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnFailed: { borderWidth: 2, borderColor: colors.danger, backgroundColor: 'transparent' },
  submitBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: typography.label.fontSize, letterSpacing: 1 },
  submitBtnTextFailed: { color: colors.danger },
  submittingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  backBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  backBtnLocked: { opacity: 0.4 },

  passwordRow: { justifyContent: 'center' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: spacing.md, padding: spacing.xs },
  errorText: { color: colors.danger, textAlign: 'center', fontFamily: 'Manrope' }
});

export default CreateProfilePage;
