import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ClipboardCheck } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { searchEtaChapters } from '../../api/eta';
import { FieldSelect } from '../events/CreateEventWizard/FieldSelect';

const COUNTRIES = [
  'India',
  'United Kingdom',
  'United States',
  'Singapore',
  'United Arab Emirates',
  'Canada',
  'Australia',
  'Germany',
  'Brazil',
  'Kenya',
  'Japan',
  'Other',
].map(c => ({ value: c, label: c }));

const WHY_MIN_LENGTH = 20;
const WHY_MAX_LENGTH = 400;
const DUP_CHECK_DEBOUNCE_MS = 400;

const NEXT_STEPS = [
  { n: '1', title: 'Review', body: 'The chapters team checks for overlap with nearby chapters.' },
  { n: '2', title: 'Founding invite', body: 'We look for a founding lead in the city and introduce you.' },
  { n: '3', title: 'First meetup', body: 'Once 10 members join, the chapter unlocks meetups, chat and RSVPs.' },
];

/** "Create a new ETA chapter" / "Suggest a chapter" flow — matches `ETAChapters_decoded.html`'s
 * "CREATE CHAPTER SCREEN" (~line 546). Drops the "I want to be the chapter lead" checkbox — it's
 * `display:none` in the mockup itself (dead, unreachable), same reasoning as the Spotlight/
 * Trending sections. The duplicate-city check is real here (debounced `searchEtaChapters`
 * against actual chapters), not the mockup's in-memory array scan against fake data. The
 * confirmation REF# is still client-generated (`requestEtaCity`'s real response has no such
 * field — matches web's own placeholder-grade behavior, not a new fabrication). */
export function CreateChapterScreen({
  visible,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  isSubmitting: boolean;
  onSubmit: (payload: { city: string; country: string; chapterName: string; reason: string; connection: string }) => Promise<boolean>;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [connection, setConnection] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const dupCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Same Modal-on-Android keyboard fix as `ContributeResourceSheet.tsx` (see its doc comment for
  // the full root-cause writeup): `KeyboardAvoidingView`'s Android resize behavior doesn't
  // reliably apply inside a `Modal`, and stacking it on top of this app's own
  // `windowSoftInputMode="adjustResize"` meant two separate resize mechanisms fought each other
  // on every keyboard open/close — the visible symptom being a flicker right as the keyboard
  // closed, and sometimes a stray leftover gap below the footer once it had. Manual
  // `keyboardHeight` tracking + a precise scroll-to-clear-the-keyboard on show replaces it;
  // `behavior={undefined}` on Android below means nothing tries to resize this screen at all.
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const focusedInputRef = useRef<TextInput | null>(null);
  const cityInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const whyInputRef = useRef<TextInput>(null);
  const connectionInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      const kbHeight = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(kbHeight);
      const input = focusedInputRef.current;
      if (!input) return;
      // Wait a frame so the new bottom padding below has actually rendered — otherwise this
      // scroll can get clamped to the old (shorter) scrollable range.
      requestAnimationFrame(() => {
        input.measureInWindow((_x, y, _width, height) => {
          const keyboardTop = Dimensions.get('window').height - kbHeight;
          const overlap = y + height - keyboardTop;
          if (overlap > 0) {
            scrollRef.current?.scrollTo({ y: scrollOffsetRef.current + overlap + 12, animated: true });
          }
        });
      });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    setCity('');
    setCountry('');
    setName('');
    setWhy('');
    setConnection('');
    setIsDuplicate(false);
    setDone(false);
    setRef('');
  }, [visible]);

  useEffect(() => {
    if (dupCheckRef.current) clearTimeout(dupCheckRef.current);
    const trimmed = city.trim();
    if (trimmed.length < 2) {
      setIsDuplicate(false);
      return;
    }
    dupCheckRef.current = setTimeout(async () => {
      try {
        const results = await searchEtaChapters(trimmed);
        setIsDuplicate(results.some(c => c.name.toLowerCase().includes(trimmed.toLowerCase()) || (c.location ?? '').toLowerCase().includes(trimmed.toLowerCase())));
      } catch {
        setIsDuplicate(false);
      }
    }, DUP_CHECK_DEBOUNCE_MS);
    return () => {
      if (dupCheckRef.current) clearTimeout(dupCheckRef.current);
    };
  }, [city]);

  const trimmedCity = city.trim();
  const trimmedWhy = why.trim();
  const cityOk = !!trimmedCity && !isDuplicate && !!country;
  const nameOk = !!name.trim();
  const whyOk = trimmedWhy.length >= WHY_MIN_LENGTH;
  const ready = cityOk && nameOk && whyOk && !isSubmitting;

  const handleSubmit = async () => {
    if (!ready) return;
    const ok = await onSubmit({ city: trimmedCity, country, chapterName: name.trim(), reason: trimmedWhy, connection: connection.trim() });
    if (ok) {
      setRef(`#TSB-${10000 + Math.floor(Math.random() * 89999)}`);
      setDone(true);
    }
  };

  const handleClose = () => {
    setDone(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {done ? (
          <>
            <ScrollView contentContainerStyle={styles.doneScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.doneIcon, { backgroundColor: colors.gold }]}>
                <ClipboardCheck size={28} color="#fff" strokeWidth={1.8} />
              </View>
              <Text style={[fonts.display, styles.doneTitle, { color: colors.goldDark }]}>Pending admin approval</Text>
              <Text style={[fonts.regular, styles.doneBody, { color: colors.ink2 }]}>
                Your chapter request for <Text style={fonts.bold}>{trimmedCity}{country ? `, ${country}` : ''}</Text> has been submitted. We
                review new chapters within 48 hours and notify you as soon as it is approved.
              </Text>
              <View style={[styles.refChip, { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.md }]}>
                <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>REF {ref}</Text>
              </View>

              <View style={[styles.stepsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
                {NEXT_STEPS.map((step, i) => (
                  <View key={step.n} style={[styles.stepRow, i < NEXT_STEPS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.chip }]}>
                      <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>{step.n}</Text>
                    </View>
                    <View style={styles.stepText}>
                      <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>{step.title}</Text>
                      <Text style={[fonts.regular, styles.stepBody, { color: colors.ink3 }]}>{step.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View
              style={[
                styles.doneFooter,
                { paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin },
              ]}
            >
              <Pressable onPress={handleClose} style={[styles.doneButton, { backgroundColor: colors.feedFill, borderRadius: radius.xl }]}>
                <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>Done</Text>
              </Pressable>
              <Pressable onPress={() => setDone(false)} hitSlop={10} style={styles.anotherButton}>
                <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink3 }]}>Submit another city</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <Pressable onPress={onClose} accessibilityLabel="Back" style={styles.backButton}>
                <ArrowLeft size={18} color={colors.ink} strokeWidth={1.8} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Create a new ETA chapter</Text>
                <Text style={[fonts.regular, styles.headerSub, { color: colors.ink3 }]}>
                  Submit for admin review — usually approved within 48 hours
                </Text>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.formScroll, { paddingBottom: 16 + keyboardHeight }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScroll={e => {
                scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
            >
              <View style={[styles.noticeBox, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.gold, borderRadius: radius.xl }]}>
                <Text style={[fonts.bold, styles.noticeLabel, { color: colors.gold }]}>ADMIN REVIEW</Text>
                <Text style={[fonts.regular, styles.noticeBody, { color: colors.ink2 }]}>
                  Chapters are reviewed within 48 hours. Once approved you become the founding moderator and can invite
                  members.
                </Text>
              </View>

              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
                <Field label="City" required>
                  <TextInput
                    ref={cityInputRef}
                    value={city}
                    onChangeText={setCity}
                    onFocus={() => {
                      focusedInputRef.current = cityInputRef.current;
                    }}
                    onBlur={() => {
                      focusedInputRef.current = null;
                    }}
                    placeholder="e.g. Hyderabad"
                    placeholderTextColor={colors.ink3}
                    style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.ink, borderRadius: radius.lg }]}
                  />
                  {isDuplicate && (
                    <Text style={[fonts.regular, styles.errorText, { color: colors.danger }]}>
                      A chapter already exists in this city — join it instead.
                    </Text>
                  )}
                </Field>

                <Field label="Country" required>
                  <FieldSelect value={country} placeholder="Select country…" options={COUNTRIES} onChange={setCountry} />
                </Field>

                <Field label="Chapter name" required>
                  <TextInput
                    ref={nameInputRef}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => {
                      focusedInputRef.current = nameInputRef.current;
                    }}
                    onBlur={() => {
                      focusedInputRef.current = null;
                    }}
                    placeholder={trimmedCity ? `TSB ${trimmedCity}` : 'e.g. TSB Hyderabad'}
                    placeholderTextColor={colors.ink3}
                    style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.ink, borderRadius: radius.lg }]}
                  />
                </Field>

                <Field label="Why this city?" required>
                  <TextInput
                    ref={whyInputRef}
                    value={why}
                    onChangeText={text => setWhy(text.slice(0, WHY_MAX_LENGTH))}
                    onFocus={() => {
                      focusedInputRef.current = whyInputRef.current;
                    }}
                    onBlur={() => {
                      focusedInputRef.current = null;
                    }}
                    placeholder="Describe the ETA / search fund community here and why a TSB chapter would be valuable…"
                    placeholderTextColor={colors.ink3}
                    multiline
                    style={[fonts.regular, styles.textarea, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.ink, borderRadius: radius.lg }]}
                  />
                  <View style={styles.hintRow}>
                    <Text style={[fonts.regular, styles.hintText, { color: colors.ink3 }]}>
                      {whyOk ? 'Looks good' : `At least ${WHY_MIN_LENGTH} characters`}
                    </Text>
                    <Text style={[fonts.regular, styles.hintText, { color: colors.ink3 }]}>
                      {trimmedWhy.length} / {WHY_MAX_LENGTH}
                    </Text>
                  </View>
                </Field>

                <Field label="Your connection to the city" hint="optional">
                  <TextInput
                    ref={connectionInputRef}
                    value={connection}
                    onChangeText={setConnection}
                    onFocus={() => {
                      focusedInputRef.current = connectionInputRef.current;
                    }}
                    onBlur={() => {
                      focusedInputRef.current = null;
                    }}
                    placeholder="e.g. Based here, local investor network"
                    placeholderTextColor={colors.ink3}
                    style={[fonts.regular, styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.ink, borderRadius: radius.lg }]}
                  />
                </Field>
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { paddingBottom: insets.bottom, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin },
              ]}
            >
              <Pressable
                onPress={onClose}
                style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
              >
                <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!ready}
                style={[styles.submitButton, { backgroundColor: ready ? colors.gold : colors.surfaceSunken, borderRadius: radius.xl }]}
              >
                <Text style={[fonts.bold, { fontSize: fontSize.body, color: ready ? '#fff' : colors.ink3 }]}>
                  {isSubmitting ? 'Submitting…' : 'Submit for approval'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>
        {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
        {hint && <Text style={{ color: colors.ink3, fontWeight: '600' }}> {hint}</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 3,
  },
  // No bottom padding — the footer's own top padding/border already separates it from this
  // content, so a matching bottom value here just doubled up as visible empty page-background
  // gap between the last card (`formCard`) and the Cancel/Submit row (confirmed on-device).
  formScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 13,
  },
  noticeBox: {
    padding: 11,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  noticeLabel: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  noticeBody: {
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
  },
  formCard: {
    padding: 14,
    gap: 13,
  },
  field: {
    gap: 6,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13.5,
  },
  textarea: {
    height: 96,
    padding: 11,
    borderWidth: 1,
    fontSize: 13.5,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintText: {
    fontSize: 10.5,
  },
  errorText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 9,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `flexGrow: 1` makes this `contentContainerStyle` actually fill the ScrollView's viewport
  // (not just size to its own content) so `justifyContent: 'center'` has room to center the
  // content vertically — without it, short content sticks to the top and dumps all the leftover
  // space below itself, right above the footer (confirmed on-device: a large dead gap).
  doneScroll: {
    flexGrow: 1,
    padding: 22,
    paddingTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontSize: 23,
    marginTop: 16,
    textAlign: 'center',
  },
  doneBody: {
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  refChip: {
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderWidth: 1,
  },
  stepsCard: {
    width: '100%',
    marginTop: 20,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 13,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    minWidth: 0,
  },
  stepBody: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  // Its own style, not a reuse of `styles.footer` — that one is `flexDirection: 'row'`, built
  // for the Cancel/Submit *pair* side-by-side on the form screen. This footer stacks "Done"
  // (full-width, via RN's default `alignItems: 'stretch'` on a column container) above the
  // "Submit another city" text link, matching the mockup — reusing the row style collapsed both
  // to their own content width instead (confirmed on-device: "Done" rendered as a tiny pill).
  doneFooter: {
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  doneButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // No fixed `height` (was 42, ~2.5x its actual text line height) — that invisible box (no
  // background/border to show its real edge) stacked with `insets.bottom` below it made the gap
  // under "Submit another city" look excessive on phones with a larger bottom safe-area inset
  // (gesture-nav Android, notched/Dynamic-Island iPhones). `paddingVertical` hugs the text
  // instead; `hitSlop` on the `Pressable` above keeps the real tap target comfortable without
  // that padding taking up visible layout space.
  anotherButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
