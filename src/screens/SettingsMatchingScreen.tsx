import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Award, Briefcase, Handshake, Landmark, TrendingUp, Users, Wrench } from 'lucide-react-native';
import { useTheme } from '../theme';
import { fetchMatching, fetchMatchingCounts, saveMatching } from '../api/settings';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { Switch } from '../components/Switch';
import { FieldSelect } from '../components/events/CreateEventWizard/FieldSelect';
import { DEFAULT_MATCH_AUDIENCE, DEFAULT_MATCH_BEHAVIOR, MatchAudience, MatchBehavior, MatchTypeKey } from '../types/settings';
import type { AppStackParamList } from '../navigation/types';

const AUDIENCE_DEBOUNCE_MS = 600;

// `linear-gradient(140deg, ...)`'s direction vector — same conversion `ProfileCompletionCard.tsx`
// already documents (`(sin(a), -cos(a))`, centered in the unit square), reused verbatim here since
// the mockup's stat strip uses the identical `140deg,var(--hero1),var(--hero2)` gradient.
const GRADIENT_START = { x: 0.18, y: 0.12 };
const GRADIENT_END = { x: 0.82, y: 0.88 };

const MATCH_TYPE_META: { key: MatchTypeKey; label: string; description: string; Icon: typeof Users }[] = [
  { key: 'searchers', label: 'Co-Searchers', description: 'Other searchers running their own acquisition process. Great for diligence swaps, broker referrals and co-investment.', Icon: Users },
  { key: 'investors', label: 'Investors & LPs', description: 'Family offices, search fund investors and individuals who back acquisitions. Match for capital, advice and intros.', Icon: TrendingUp },
  { key: 'lenders', label: 'Lenders', description: 'SBA preferred lenders, mezzanine providers and senior debt funds active in the lower middle market.', Icon: Landmark },
  { key: 'operators', label: 'Operators & CEOs', description: 'Current and former operators of acquired businesses. Useful for interim CEO roles, post-close advice, or board seats.', Icon: Briefcase },
  { key: 'mentors', label: 'Mentors & Advisors', description: 'Experienced searchers and operators offering office hours, board roles or paid advisory.', Icon: Award },
  { key: 'brokers', label: 'Brokers & M&A Advisors', description: "Business brokers and sell-side advisors who originate deal flow. You'll still see their public listings in the home feed.", Icon: Handshake },
  { key: 'serviceProviders', label: 'Service Providers', description: 'QofE, legal, tax, insurance and post-close consultants who serve searchers. Enable only when actively in diligence.', Icon: Wrench },
];

const BEHAVIOR_META: { key: keyof Pick<MatchBehavior, 'mutualMatchesOnly' | 'hideConnectedMembers' | 'resurfaceDismissed'>; label: string; description: string }[] = [
  { key: 'mutualMatchesOnly', label: 'Mutual matches only', description: 'Only show me members whose preferences also include my user type. Reduces inbound noise.' },
  { key: 'hideConnectedMembers', label: 'Hide already-connected members', description: "Members you've already messaged or connected with won't reappear in your match feed." },
  { key: 'resurfaceDismissed', label: 'Re-surface dismissed matches after 90 days', description: 'Useful if circumstances change. Members you actively blocked are never re-surfaced.' },
];

const DAILY_LIMIT_OPTIONS = [
  { value: '5', label: '5 per day' },
  { value: '10', label: '10 per day' },
  { value: '20', label: '20 per day' },
  { value: 'null', label: 'No limit' },
];

const QUICK_SETS: { label: string; apply: MatchTypeKey[] | 'all' | 'none' }[] = [
  { label: 'Match with everyone', apply: 'all' },
  { label: 'Peers & capital only', apply: ['searchers', 'investors'] },
  { label: 'Pause all matching', apply: 'none' },
];

const ALL_KEYS = MATCH_TYPE_META.map(m => m.key);

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

function cloneAudience(a: MatchAudience): MatchAudience {
  return JSON.parse(JSON.stringify(a));
}

/**
 * Settings' "Matching Preferences" section — ported field-for-field from the decoded mobile
 * mockup (`standalone/TSB Profile - Mobile.html`'s `__bundler/template` blob, "MATCHING
 * PREFERENCES" block), not the desktop web layout: a compact 3-cell stat strip (eyebrow + value
 * only, no sub-line/pulse), one bordered card holding the header + horizontally-scrolling
 * quick-set pills (plain text, no icons) + all 7 audience rows as a flat divided list (no
 * per-row card/color-coding — icon wells stay neutral regardless of enabled state), and a second
 * card for the 3 behavior toggles + daily limit + a distinct shaded footer bar ("Reset" /
 * "Save preferences"). Functionality (debounced per-type auto-save, explicit combined save,
 * reset-to-last-saved) still matches real web/backend behavior — only layout and copy follow the
 * mobile mockup, per this feature's "mockup governs layout/copy, web governs functionality" rule.
 */
function SettingsMatchingScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [matchAudience, setMatchAudience] = useState<MatchAudience>(DEFAULT_MATCH_AUDIENCE);
  const [savedMatchAudience, setSavedMatchAudience] = useState<MatchAudience>(DEFAULT_MATCH_AUDIENCE);
  const [matchBehavior, setMatchBehavior] = useState<MatchBehavior>(DEFAULT_MATCH_BEHAVIOR);
  const [savedMatchBehavior, setSavedMatchBehavior] = useState<MatchBehavior>(DEFAULT_MATCH_BEHAVIOR);
  const [matchTypeCounts, setMatchTypeCounts] = useState<Record<string, number> | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(true);
  const [matchingSaving, setMatchingSaving] = useState(false);
  const [matchingDirty, setMatchingDirty] = useState(false);

  const audienceLoadedRef = useRef(false);
  const audienceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([fetchMatching(), fetchMatchingCounts()])
      .then(([prefs, counts]) => {
        setMatchAudience(prefs.matchAudience);
        setSavedMatchAudience(cloneAudience(prefs.matchAudience));
        setMatchBehavior(prefs.matchBehavior);
        setSavedMatchBehavior({ ...prefs.matchBehavior });
        setMatchTypeCounts(counts);
        setMatchingDirty(false);
        audienceLoadedRef.current = true;
      })
      .catch(() => {})
      .finally(() => setMatchingLoading(false));
  }, []);

  useEffect(() => {
    if (!audienceLoadedRef.current) return;
    if (audienceDebounceRef.current) clearTimeout(audienceDebounceRef.current);
    audienceDebounceRef.current = setTimeout(async () => {
      try {
        await saveMatching({ matchAudience });
        setSavedMatchAudience(cloneAudience(matchAudience));
        setMatchingDirty(false);
      } catch {
        // silent — the explicit "Save preferences" button is still the fallback, matches web
      }
    }, AUDIENCE_DEBOUNCE_MS);
    return () => {
      if (audienceDebounceRef.current) clearTimeout(audienceDebounceRef.current);
    };
  }, [matchAudience]);

  const enabledCount = ALL_KEYS.filter(k => matchAudience[k].enabled).length;
  const potentialMatches = matchTypeCounts
    ? ALL_KEYS.filter(k => matchAudience[k].enabled).reduce((sum, k) => sum + (matchTypeCounts[k] ?? 0), 0)
    : null;

  const stats = [
    { label: 'MATCHING WITH', value: matchingLoading ? '—' : `${enabledCount} / 7` },
    { label: 'POTENTIAL MATCHES', value: matchingLoading || potentialMatches === null ? '—' : String(potentialMatches) },
    { label: 'LAST REFRESHED', value: 'Active' },
  ];

  const toggleAudience = (key: MatchTypeKey) => {
    setMatchAudience(prev => ({ ...prev, [key]: { enabled: !prev[key].enabled } }));
    setMatchingDirty(true);
  };

  const applyQuickSet = (apply: MatchTypeKey[] | 'all' | 'none') => {
    setMatchAudience(prev => {
      const next = { ...prev };
      ALL_KEYS.forEach(k => {
        const enabled = apply === 'all' ? true : apply === 'none' ? false : apply.includes(k);
        next[k] = { enabled };
      });
      return next;
    });
    setMatchingDirty(true);
  };

  const toggleBehavior = (key: (typeof BEHAVIOR_META)[number]['key']) => {
    setMatchBehavior(prev => ({ ...prev, [key]: !prev[key] }));
    setMatchingDirty(true);
  };

  const handleReset = () => {
    setMatchAudience(cloneAudience(savedMatchAudience));
    setMatchBehavior({ ...savedMatchBehavior });
    setMatchingDirty(false);
  };

  const handleSave = async () => {
    setMatchingSaving(true);
    try {
      await saveMatching({ matchAudience, ...matchBehavior });
      Toast.show({ type: 'success', text1: 'Matching preferences saved' });
      setSavedMatchAudience(cloneAudience(matchAudience));
      setSavedMatchBehavior({ ...matchBehavior });
      setMatchingDirty(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setMatchingSaving(false);
    }
  };

  const cardStyle = [styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }];

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Matching Preferences" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={[colors.hero1, colors.hero2]} style={[styles.statStrip, { borderRadius: radius.xl }]} start={GRADIENT_START} end={GRADIENT_END}>
          {stats.map((s, index) => (
            <View key={s.label} style={[styles.statCell, index > 0 && styles.statCellBorder]}>
              <Text style={[fonts.bold, styles.statEyebrow]}>{s.label}</Text>
              <Text style={[fonts.display, styles.statValue, { color: colors.goldLight }]}>{s.value}</Text>
            </View>
          ))}
        </LinearGradient>

        <View style={cardStyle}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>WHO YOU WANT TO MEET</Text>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Match audience</Text>
            <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>Choose which types of TSB members can appear in your matches.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickSetRow}>
            {QUICK_SETS.map(q => (
              <Pressable
                key={q.label}
                onPress={() => applyQuickSet(q.apply)}
                style={({ pressed }) => [styles.quickSetPill, { borderColor: colors.homeCardBorder, backgroundColor: colors.surface, borderRadius: radius.lg }, pressed && styles.pressed]}
              >
                <Text style={[fonts.bold, styles.quickSetText, { color: colors.ink2 }]}>{q.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {matchingLoading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 12 }} />
          ) : (
            MATCH_TYPE_META.map(({ key, label, description, Icon }) => {
              const enabled = matchAudience[key].enabled;
              const n = matchTypeCounts?.[key];
              const countText = n != null ? `${n} member${n !== 1 ? 's' : ''}` : '—';
              return (
                <View key={key} style={[styles.audienceRow, { borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin }]}>
                  <View style={[styles.audienceIconWell, { borderRadius: radius.lg, backgroundColor: colors.surfaceSunken }]}>
                    <Icon size={16} color={colors.ink2} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.audienceMetaRow}>
                      <Text style={[fonts.bold, styles.audienceLabel, { color: colors.ink }]}>{label}</Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.surfaceSunken, borderRadius: radius.sm }]}>
                        <Text style={[fonts.bold, styles.countBadgeText, { color: colors.ink3 }]}>{enabled ? countText : `${countText} · paused`}</Text>
                      </View>
                    </View>
                    <Text style={[fonts.regular, styles.audienceDescription, { color: colors.ink3 }]}>{description}</Text>
                  </View>
                  <Switch value={enabled} onValueChange={() => toggleAudience(key)} />
                </View>
              );
            })
          )}
        </View>

        <View style={cardStyle}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>MATCH BEHAVIOR</Text>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>How matches work</Text>
            <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>Fine-tune what happens once a match is suggested.</Text>
          </View>

          {matchingLoading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 8 }} />
          ) : (
            <>
              {BEHAVIOR_META.map(({ key, label, description }) => (
                <View key={key} style={[styles.behaviorRow, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>{label}</Text>
                    <Text style={[fonts.regular, styles.behaviorDescription, { color: colors.ink3 }]}>{description}</Text>
                  </View>
                  <Switch value={matchBehavior[key]} onValueChange={() => toggleBehavior(key)} onColor="#182e43" />
                </View>
              ))}
              <View style={styles.behaviorRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>Daily match limit</Text>
                  <Text style={[fonts.regular, styles.behaviorDescription, { color: colors.ink3 }]}>Cap how many new matches AI Assist surfaces each day.</Text>
                </View>
                <View style={{ width: 128 }}>
                  <FieldSelect
                    value={String(matchBehavior.dailyMatchLimit ?? 'null')}
                    placeholder="No limit"
                    options={DAILY_LIMIT_OPTIONS}
                    onChange={v => {
                      setMatchBehavior(prev => ({ ...prev, dailyMatchLimit: v === 'null' ? null : Number(v) }));
                      setMatchingDirty(true);
                    }}
                  />
                </View>
              </View>
            </>
          )}

          <View style={[styles.footer, { backgroundColor: colors.surfaceSunken, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin }]}>
            <Text style={[fonts.regular, styles.footerText, { color: colors.ink3 }]}>
              {matchingDirty ? 'Unsaved changes' : 'Changes refresh your match feed in ~5 min'}
            </Text>
            <View style={styles.footerButtonRow}>
              <Pressable
                onPress={handleReset}
                disabled={!matchingDirty}
                style={({ pressed }) => [styles.resetButton, { borderColor: colors.homeCardBorder, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: borderWidth.thin, opacity: matchingDirty ? 1 : 0.4 }, pressed && styles.pressed]}
              >
                <Text style={[fonts.semibold, styles.footerButtonText, { color: colors.ink2 }]}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!matchingDirty || matchingSaving}
                style={({ pressed }) => [styles.saveButton, { backgroundColor: '#182E43', borderRadius: radius.xl, opacity: matchingDirty ? 1 : 0.4 }, pressed && styles.pressed]}
              >
                {matchingSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, styles.footerButtonText, { color: '#fff' }]}>Save preferences</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 13,
    paddingBottom: 40,
  },
  statStrip: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statCellBorder: {
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 1,
  },
  statEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    // Reserves room for 2 lines always (not just when a label like "POTENTIAL MATCHES" actually
    // wraps) — otherwise that cell's label is taller than the other two single-line cells, which
    // pushes just its own `statValue` down and breaks the row's alignment across all 3 cells.
    minHeight: 26,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    marginTop: 3,
    textAlign: 'center',
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
  quickSetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  quickSetPill: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickSetText: {
    fontSize: 11.5,
  },
  audienceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  audienceIconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  audienceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  audienceLabel: {
    fontSize: 13.5,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 9.5,
  },
  audienceDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  behaviorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  behaviorDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  footer: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  footerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    height: 42,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    height: 42,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default SettingsMatchingScreen;
