import React, { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Bug, CheckCircle2, ChevronRight, FileText, HelpCircle, MessageSquareWarning, Send } from 'lucide-react-native';
import { WEB_BASE_URL } from '@env';
import { useTheme } from '../theme';
import { submitSupportTicket } from '../api/settings';
import type { SupportSeverity } from '../types/settings';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import type { AppStackParamList } from '../navigation/types';

type SupportView = 'menu' | 'bug' | 'complaint';

// Mockup's own display labels (`SEVERITIES` in the decoded mockup) — capitalized, UI-only.
// Mapped to lowercase before hitting the real API, matching `SupportSeverity`'s real contract
// (`types/settings.ts`) and web's own `form.severity` values exactly.
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
type SeverityLabel = (typeof SEVERITIES)[number];

function openLink(url: string) {
  Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' }));
}

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

type MenuGroup = {
  label: string;
  title: string;
  desc: string;
  items: { Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; title: string; sub: string; onPress: () => void }[];
};

/**
 * Settings' "Support & Help" section — matches real web (`webSrc/app/dashboard/settings/
 * page.tsx`'s `activeTab === "support"`) and the mobile mockup exactly: an in-place
 * menu→form state swap (`view`, mirroring web's own `supportView` state), not separate routes —
 * "Report a bug"/"Raise a complaint" swap this same screen's content rather than navigating away.
 *
 * The menu's 3 groups use the same bordered-card-with-header-divider chrome every other Settings
 * screen uses (`card`/`cardHeader` styles, matching `SettingsPrivacyScreen.tsx`/
 * `SettingsBillingScreen.tsx` exactly) — the decoded mobile mockup's own raw markup for this
 * section is actually flat (no card box), but real web's rendering wraps each group in a card,
 * and that's what this matches now, per explicit direction to follow web here over the mockup.
 *
 * Bug and complaint forms share the same shape (Subject/Description/Submit) except the
 * complaint form has no Severity picker — matches web's `SupportForm`'s `isBug &&` gate. Both
 * share `SupportSuccessCard` for their post-submit state.
 */
function SettingsSupportScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [view, setView] = useState<SupportView>('menu');

  const [bugSubject, setBugSubject] = useState('');
  const [bugSeverity, setBugSeverity] = useState<SeverityLabel>('Medium');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSubmitted, setBugSubmitted] = useState(false);

  const resetBugForm = () => {
    setBugSubject('');
    setBugSeverity('Medium');
    setBugDescription('');
    setBugSubmitted(false);
  };

  const handleSubmitBug = async () => {
    if (!bugSubject.trim() || !bugDescription.trim()) {
      Toast.show({ type: 'error', text1: 'Fill in the subject and description' });
      return;
    }
    setBugSubmitting(true);
    try {
      await submitSupportTicket('bug', bugSubject.trim(), bugDescription.trim(), bugSeverity.toLowerCase() as SupportSeverity);
      setBugSubmitted(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not submit report', text2: extractErrorMessage(err) });
    } finally {
      setBugSubmitting(false);
    }
  };

  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const resetComplaintForm = () => {
    setComplaintSubject('');
    setComplaintDescription('');
    setComplaintSubmitted(false);
  };

  const handleSubmitComplaint = async () => {
    if (!complaintSubject.trim() || !complaintDescription.trim()) {
      Toast.show({ type: 'error', text1: 'Fill in the subject and description' });
      return;
    }
    setComplaintSubmitting(true);
    try {
      // `severity` has no UI control here (matches web's `SupportForm`'s `isBug &&` gate — the
      // severity picker only renders for bug reports) but the real endpoint's contract still
      // always expects one; `submitSupportTicket`'s `severity` param is required specifically so
      // this can't be silently forgotten, defaulted to 'medium' same as web.
      await submitSupportTicket('complaint', complaintSubject.trim(), complaintDescription.trim(), 'medium');
      setComplaintSubmitted(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not submit complaint', text2: extractErrorMessage(err) });
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // `view` is local state, not a real navigation route, so the hardware back button doesn't
  // know about it on its own — it would otherwise skip straight past "return to the menu" and
  // pop this whole screen instead, landing on Settings' index. Intercept it here (only while
  // this screen is focused) to return to the menu first, same as `MessagesScreen.tsx`'s
  // identical `view: 'inbox' | 'thread'` fix.
  const returnToMenu = () => {
    resetBugForm();
    resetComplaintForm();
    setView('menu');
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (view !== 'menu') {
          returnToMenu();
          return true;
        }
        return false;
      });
      return () => subscription.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]),
  );

  const groups: MenuGroup[] = [
    {
      label: 'CONTACT US',
      title: 'Support & help',
      desc: 'Get assistance or report an issue to our team.',
      items: [
        { Icon: Bug, title: 'Report a bug', sub: 'Encountered a technical issue? Let us know.', onPress: () => setView('bug') },
        { Icon: MessageSquareWarning, title: 'Raise a complaint', sub: 'Report a concern about a user or experience.', onPress: () => setView('complaint') },
      ],
    },
    {
      label: 'QUICK ANSWERS',
      title: 'Frequently asked questions',
      desc: 'Browse common questions about The Search Bridge.',
      items: [{ Icon: HelpCircle, title: 'View all FAQs', sub: 'Opens in a new tab.', onPress: () => openLink(`${WEB_BASE_URL}/faqs`) }],
    },
    {
      label: 'LEGAL',
      title: 'Policies & agreements',
      desc: 'Review our terms, privacy policy, and platform rules.',
      items: [
        { Icon: FileText, title: 'Terms of service', sub: 'Your rights and obligations on the platform.', onPress: () => openLink(`${WEB_BASE_URL}/terms`) },
        { Icon: FileText, title: 'Privacy policy', sub: 'How we collect, use and protect your data.', onPress: () => openLink(`${WEB_BASE_URL}/privacy-policy`) },
      ],
    },
  ];

  if (view === 'bug' && bugSubmitted) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <AdScreenHeader title="Report a bug" onBack={returnToMenu} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <SupportSuccessCard title="Bug report submitted" onBack={returnToMenu} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'bug') {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <AdScreenHeader title="Report a bug" onBack={returnToMenu} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Eyebrow/title deliberately omitted here — the mockup hides them (`display:none`)
              for this card specifically, since `AdScreenHeader`'s title already says "Report a
              bug"; only the description line renders. */}
          <View style={[styles.formCard, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
            <View style={[styles.formCardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.regular, styles.formCardDescription, { color: colors.ink3 }]}>Help us improve by describing the issue.</Text>
            </View>

            <View style={styles.formBody}>
              <View style={styles.field}>
                <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>SUBJECT</Text>
                <TextInput
                  value={bugSubject}
                  onChangeText={setBugSubject}
                  placeholder="e.g. Profile image not loading"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
                />
              </View>

              <View style={styles.field}>
                <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>SEVERITY</Text>
                <View style={styles.severityGrid}>
                  {SEVERITIES.map(level => {
                    const active = bugSeverity === level;
                    return (
                      <Pressable
                        key={level}
                        onPress={() => setBugSeverity(level)}
                        style={[
                          styles.severityButton,
                          {
                            borderRadius: radius.lg,
                            borderWidth: borderWidth.thin,
                            borderColor: active ? colors.goldLight : colors.homeCardBorder,
                            backgroundColor: active ? colors.chip : colors.surfaceSunken,
                          },
                        ]}
                      >
                        <Text style={[fonts.bold, styles.severityText, { color: active ? colors.goldDark : colors.ink2 }]}>{level}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>DESCRIPTION</Text>
                <TextInput
                  value={bugDescription}
                  onChangeText={setBugDescription}
                  placeholder="Steps to reproduce, expected vs actual behavior…"
                  placeholderTextColor={colors.ink3}
                  multiline
                  textAlignVertical="top"
                  style={[fonts.regular, styles.textarea, { backgroundColor: colors.surfaceSunken, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
                />
              </View>

              <Pressable
                onPress={handleSubmitBug}
                disabled={bugSubmitting}
                style={({ pressed }) => [styles.submitButton, { backgroundColor: '#182E43', borderRadius: radius.xl, opacity: bugSubmitting ? 0.7 : 1 }, pressed && styles.pressed]}
              >
                {bugSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={15} color="#fff" strokeWidth={1.8} />
                    <Text style={[fonts.bold, styles.submitButtonText, { color: '#fff' }]}>Submit</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'complaint' && complaintSubmitted) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <AdScreenHeader title="Raise a complaint" onBack={returnToMenu} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <SupportSuccessCard title="Complaint raised" onBack={returnToMenu} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'complaint') {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
        <AdScreenHeader title="Raise a complaint" onBack={returnToMenu} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Eyebrow/title omitted here too, same reasoning as the bug form. */}
          <View style={[styles.formCard, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
            <View style={[styles.formCardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.regular, styles.formCardDescription, { color: colors.ink3 }]}>Tell us about a concern you've experienced.</Text>
            </View>

            <View style={styles.formBody}>
              <View style={styles.field}>
                <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>SUBJECT</Text>
                <TextInput
                  value={complaintSubject}
                  onChangeText={setComplaintSubject}
                  placeholder="Brief description"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
                />
              </View>

              <View style={styles.field}>
                <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>DESCRIPTION</Text>
                <TextInput
                  value={complaintDescription}
                  onChangeText={setComplaintDescription}
                  placeholder="Please describe the issue in detail…"
                  placeholderTextColor={colors.ink3}
                  multiline
                  textAlignVertical="top"
                  style={[fonts.regular, styles.textareaTall, { backgroundColor: colors.surfaceSunken, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
                />
              </View>

              <Pressable
                onPress={handleSubmitComplaint}
                disabled={complaintSubmitting}
                style={({ pressed }) => [styles.submitButton, { backgroundColor: '#182E43', borderRadius: radius.xl, opacity: complaintSubmitting ? 0.7 : 1 }, pressed && styles.pressed]}
              >
                {complaintSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={15} color="#fff" strokeWidth={1.8} />
                    <Text style={[fonts.bold, styles.submitButtonText, { color: '#fff' }]}>Submit</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Support & Help" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map(group => (
          <View key={group.title} style={[styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>{group.label}</Text>
              <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>{group.title}</Text>
              <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>{group.desc}</Text>
            </View>
            <View style={styles.itemColumn}>
              {group.items.map(item => (
                <Pressable
                  key={item.title}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.menuRow,
                    { borderColor: colors.homeCardBorder, backgroundColor: colors.surfaceSunken, borderRadius: radius.lg, borderWidth: borderWidth.thin },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.iconWell, { borderRadius: radius.md, backgroundColor: colors.chip }]}>
                    <item.Icon size={16} color={colors.goldDark} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>{item.title}</Text>
                    <Text style={[fonts.regular, styles.rowDescription, { color: colors.ink3 }]}>{item.sub}</Text>
                  </View>
                  <ChevronRight size={13} color={colors.ink3} strokeWidth={1.8} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Shared by the bug and complaint forms' post-submit state — matches web's `SupportForm`
 * `submitted` view exactly (checkmark + title + fixed message + "Back to support"), reused as-is
 * for the complaint form in Step 3 (web uses the same "24–48 hours" message for both, only the
 * title differs — "Bug report submitted" vs "Complaint raised"). */
function SupportSuccessCard({ title, onBack }: { title: string; onBack: () => void }) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  return (
    <View style={[styles.formCard, styles.successCard, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
      <View style={[styles.successIconWell, { backgroundColor: colors.successSurface, borderColor: colors.success, borderWidth: borderWidth.thin }]}>
        <CheckCircle2 size={26} color={colors.success} strokeWidth={1.6} />
      </View>
      <Text style={[fonts.display, styles.successTitle, { color: colors.ink }]}>{title}</Text>
      <Text style={[fonts.regular, styles.successMessage, { color: colors.ink3 }]}>Our team will review your submission within 24–48 hours.</Text>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.successButton, { backgroundColor: '#182E43', borderRadius: radius.lg }, pressed && styles.pressed]}
      >
        <Text style={[fonts.bold, styles.successButtonText, { color: '#fff' }]}>Back to support</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 15,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 17,
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  itemColumn: {
    padding: 16,
    gap: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  iconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowDescription: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  formCard: {
    overflow: 'hidden',
  },
  formCardHeader: {
    padding: 15,
    paddingBottom: 13,
  },
  formCardDescription: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  formBody: {
    padding: 14,
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  input: {
    height: 46,
    paddingHorizontal: 13,
  },
  textarea: {
    height: 130,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  textareaTall: {
    height: 150,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  severityGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  severityButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    fontSize: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
  },
  submitButtonText: {
    fontSize: 14,
  },
  successCard: {
    alignItems: 'center',
    padding: 32,
  },
  successIconWell: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  successButton: {
    height: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SettingsSupportScreen;
