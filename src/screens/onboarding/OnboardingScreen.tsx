import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { PrimaryButton } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { ETA_CHAPTERS, LINKEDIN_PATTERN, MAX_ETA_CHAPTERS, Step, STEP_LABELS } from './constants';
import { RoleSheet, Step1Fields, Step2Fields } from './components';

const AUTH_LOGO = require('../../assets/images/AuthLogo.png');

/** Per-step heading + subtitle, as in the design's `titles` map — steps without an entry fall
 * back to the generic "Step N · Label" heading (still true for the Step 3/4 stubs). */
const STEP_COPY: Partial<Record<Step, [string, string]>> = {
  1: ['What brings you to The Search Bridge?', "We'll personalize your experience based on your role."],
  2: ['Step Into a City That Thinks Ahead', "Pick your preferred cities — we'll customize accordingly."],
};

/**
 * Onboarding — mobile port of `TSBOnboarding.html` (repo root), reached
 * after Signup. Built as one component with a `step` state, matching the
 * design file's own architecture (a single wizard, not five separate
 * screens/routes) — steps share a header/stepper/card/footer shell and need
 * to see each other's answers on Back, which a stack of routes would only
 * complicate (see the Login/Signup "roaming" bug this app already hit once
 * from over-using navigation for what's really just view-state).
 *
 * Building this "one step at a time" per request: the shell + Step 1 (role
 * picker, sub-category, LinkedIn, city) and Step 2 (search + join ETA
 * chapters) are real; Steps 3-4 are placeholder cards for now so the
 * Back/Continue mechanics and stepper are testable end-to-end, to be filled
 * in next.
 *
 * The design's native `<select>` dropdowns for Sub Category and City are
 * ported via `FieldDropdown` (react-native-element-dropdown), an inline
 * floating-list dropdown — not the bottom-sheet pattern used for the
 * (richer) Category picker.
 *
 * Step 2's chapter list (`ETA_CHAPTERS` in `./constants`) is a static
 * placeholder matching the design's mock data — a real "get ETA Chapters"
 * API call replaces it later; the UI (search, cap-at-3 join/leave, chip
 * list) is otherwise final.
 *
 * Each step's body (`Step1Fields`, `Step2Fields`), the role picker, sub-category/city sheets,
 * ETA chapter cards, and their pieces (cards, headers, triggers) each live in their own file
 * under `./components`, each with its own styles — matching how every other screen in this app
 * keeps its `StyleSheet.create` local to itself, and keeping this file from growing into one
 * giant render as Steps 3-4 get filled in. This screen still owns all the step state/handlers;
 * the step components are dumb — they render and forward onChange. Shared data (roles, cities,
 * sub-categories, ETA chapters, the `Step` type) lives in `./constants` since it's a single
 * source of truth several of those files read from.
 */

function OnboardingScreen() {
  const { colors, fonts, fontSize, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');

  const [role, setRole] = useState('');
  const [sub, setSub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [city, setCity] = useState('');

  const [etaQuery, setEtaQuery] = useState('');
  const [joinedEtas, setJoinedEtas] = useState<string[]>([]);

  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  const filteredEtas = ETA_CHAPTERS.filter(
    c => !etaQuery.trim() || c.name.toLowerCase().includes(etaQuery.trim().toLowerCase()),
  );

  const toggleEta = (name: string) => {
    setJoinedEtas(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= MAX_ETA_CHAPTERS) {
        Toast.show({ type: 'info', text1: `You can select up to ${MAX_ETA_CHAPTERS} cities.` });
        return prev;
      }
      return [...prev, name];
    });
    setError('');
  };

  const canBack = step > 1;
  const inFlow = step < 5;
  const stepIndex = step >= 4 ? 3 : step;

  const back = () => {
    setError('');
    setStep(s => Math.max(1, s - 1) as Step);
  };

  const next = () => {
    if (step === 1) {
      if (!role) return setError('Pick the category that describes you.');
      if (!sub) return setError('Select a sub category.');
      if (!LINKEDIN_PATTERN.test(linkedin)) return setError('Add your LinkedIn profile URL.');
      if (!city) return setError('Select your city.');
    }
    if (step === 2) {
      if (!joinedEtas.length) return setError('Join at least one city ETA.');
    }
    setError('');
    setStep(step < 4 ? ((step + 1) as Step) : 5);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.obPage }}
      // Android already resizes the window for the keyboard via `windowSoftInputMode="adjustResize"`
      // in the manifest — stacking `behavior="height"` on top of that double-compensates and leaves a
      // large residual gap under the footer even with no keyboard visible.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.obPage} />

      {/* Header — logo + stepper, stays put across steps */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 4, borderBottomColor: colors.obLine2, backgroundColor: colors.obPage },
        ]}
      >
        <View style={styles.brandRow}>
          <Image source={AUTH_LOGO} resizeMode="contain" style={styles.brandIcon} />
          <Text style={[fonts.bold, styles.brandText, { color: colors.obInk }]}>TSB</Text>
        </View>
        <Text style={[fonts.semibold, styles.brandTagline, { color: colors.obInk }]}>
          Find. Connect. Close.
        </Text>
        <View style={styles.stepper}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = stepIndex > n;
            const active = stepIndex === n;
            return (
              <View key={label} style={styles.stepCell}>
                <View style={styles.railRow}>
                  <View
                    style={[
                      styles.rail,
                      { backgroundColor: i === 0 ? 'transparent' : done || active ? colors.obInk : colors.obLine2 },
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      done || active
                        ? { backgroundColor: colors.obInk, borderColor: colors.obInk }
                        : { backgroundColor: colors.obPage, borderColor: colors.obLine2 },
                    ]}
                  >
                    {done ? (
                      // `obInk` inverts between themes (near-black in light, near-white in
                      // dark) — `obPage` inverts the same way in the opposite direction, so it
                      // stays readable against this dot's fill in both themes, unlike `onAccent`
                      // (always white — correct for the gold buttons, wrong here).
                      <Check size={11} color={colors.obPage} strokeWidth={2.5} />
                    ) : (
                      <Text
                        style={[fonts.bold, styles.dotLabel, { color: active ? colors.obPage : colors.obInk3 }]}
                      >
                        {n}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[styles.rail, { backgroundColor: i === 2 ? 'transparent' : done ? colors.obInk : colors.obLine2 }]}
                  />
                </View>
                <Text
                  style={[
                    active ? fonts.bold : fonts.medium,
                    styles.stepLabel,
                    { color: active || done ? colors.obInk : colors.obInk3 },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Plain `ScrollView` never scrolls a focused input into view on its own — a lower field
          like LinkedIn ends up hidden behind the keyboard. `enableOnAndroid` is required since
          this library only auto-scrolls on Android when explicitly told to. */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardOpeningTime={0}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}>
          {inFlow && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[fonts.authDisplay, styles.title, { color: colors.obInk }]}>
                {STEP_COPY[step]?.[0] ?? `Step ${step} · ${STEP_LABELS[Math.min(stepIndex, 3) - 1]}`}
              </Text>
              <Text style={[fonts.regular, styles.subtitle, { color: colors.obInk3 }]}>
                {STEP_COPY[step]?.[1] ?? ''}
              </Text>
            </View>
          )}

          {step === 1 && (
            <Step1Fields
              role={role}
              sub={sub}
              linkedin={linkedin}
              city={city}
              onRolePress={() => setRoleSheetOpen(true)}
              onSubChange={v => {
                setSub(v);
                setError('');
              }}
              onLinkedinChange={setLinkedin}
              onCityChange={v => {
                setCity(v);
                setError('');
              }}
            />
          )}

          {step === 2 && (
            <Step2Fields
              query={etaQuery}
              onQueryChange={setEtaQuery}
              joined={joinedEtas}
              chapters={filteredEtas}
              onToggle={toggleEta}
            />
          )}

          {step > 2 && step < 5 && (
            <View style={styles.stubCard}>
              <Text style={[fonts.regular, { color: colors.obInk3, textAlign: 'center' }]}>
                Step {step} — {STEP_LABELS[Math.min(stepIndex, 3) - 1]} fields go here next.
              </Text>
            </View>
          )}

          {step === 5 && (
            <View style={styles.doneWrap}>
              <View style={[styles.doneBadge, { backgroundColor: colors.obChip }]}>
                <Check size={26} color={colors.obGold} strokeWidth={2} />
              </View>
              <Text style={[fonts.authDisplay, styles.doneTitle, { color: colors.obInk }]}>
                You&apos;re on the Bridge
              </Text>
              <Text style={[fonts.regular, styles.doneSubtitle, { color: colors.obInk3 }]}>
                Profile complete. We&apos;re matching you with {role.toLowerCase() || 'relevant'} deals, members and
                ETAs in {city || 'your region'}.
              </Text>
              <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
                <PrimaryButton label="Continue to Dashboard" onPress={login} letterSpacing={0} />
                <Pressable onPress={() => setStep(1)} style={styles.reviewButton}>
                  <Text style={[fonts.semibold, { color: colors.obInk, fontSize: fontSize.small }]}>
                    Review my answers
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.authErrorBg, borderColor: colors.authErrorBorder }]}>
          <Text style={[fonts.medium, { color: colors.authErrorText, fontSize: fontSize.authFootnote }]}>{error}</Text>
        </View>
      ) : null}

      {inFlow && (
        <View
          style={[
            styles.footer,
            { paddingBottom: 12 + insets.bottom, borderTopColor: colors.obLine2, backgroundColor: colors.obPage },
          ]}
        >
          {canBack && (
            <Pressable onPress={back} style={[styles.backButton, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
              <ChevronLeft size={15} color={colors.obInk2} strokeWidth={1.6} />
              <Text style={[fonts.semibold, { color: colors.obInk2, fontSize: fontSize.ui }]}>Back</Text>
            </Pressable>
          )}
          <Pressable onPress={next} style={[styles.nextButton, { backgroundColor: colors.obGold }]}>
            <Text style={[fonts.bold, { color: colors.onAccent, fontSize: fontSize.ui }]}>
              {step === 4 ? 'Complete' : 'Continue'}
            </Text>
            <ChevronRight size={15} color={colors.onAccent} strokeWidth={1.7} />
          </Pressable>
        </View>
      )}

      <RoleSheet
        visible={roleSheetOpen}
        selected={role}
        onSelect={r => {
          setRole(r);
          setRoleSheetOpen(false);
          setError('');
        }}
        onClose={() => setRoleSheetOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  brandIcon: {
    width: 22,
    height: 20,
  },
  brandText: {
    fontSize: 19,
    letterSpacing: 0.3,
  },
  brandTagline: {
    marginTop: 2,
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  stepper: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  railRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  rail: {
    flex: 1,
    height: 1.5,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    fontSize: 11,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 18,
  },
  card: {
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  stubCard: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  doneBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontSize: 21,
  },
  doneSubtitle: {
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 270,
  },
  reviewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 13,
  },
  errorBanner: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
});

export default OnboardingScreen;
