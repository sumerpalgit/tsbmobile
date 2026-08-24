import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { fetchAnalyticsSummary, AnalyticsSummary } from '../../api/analytics';

const RING_SIZE = 84;
const RING_RADIUS = 34;
const RING_STROKE = 9;

/**
 * View Profile's Analytics tab — Phase 7. Web's own tab LABEL reads "Analytics" but its internal
 * component is `CompleteProfileTab` — confirmed via direct research this is a profile-completion
 * ring + section breakdown with 4 real "Match Score Facts" stat numbers, NOT an engagement/reach
 * dashboard (no charts, no time-range picker exist on web or in the mockup for this tab). Built
 * against that real shape, not the "Analytics" label's implication.
 *
 * Ring technique matches Overview's Profile Insights ring exactly (`react-native-svg`
 * `Circle`+`strokeDasharray`, Phase 2), scaled up to the mockup's own bigger size (84px vs 40px)
 * — same hand-rolled approach, no new dependency. Fetches its OWN endpoint
 * (`GET /profile/analytics/summary`, `fetchAnalyticsSummary()`) rather than reusing Overview's
 * `useProfileCompletion()` — confirmed these are two distinct real endpoints on web itself
 * (`/profile/completion` vs `/profile/analytics/summary`), not a mobile-side duplication to
 * simplify away.
 *
 * "Match Score Facts" (Inbound/Outbound/Matches/Posts) initially looked like the kind of
 * demo-only invented metric this project has caught and dropped elsewhere (fabricated join
 * dates, a fake "Top Investor" badge) — verified instead via direct research that these ARE real
 * backend fields web reads defensively off the same response (`inbound_views`/`outbound_reach`/
 * `match_count`/`post_count`), not fabricated. Kept, with their exact mockup/web description
 * copy ("Profile views this month" etc.) since that's real UI text, not a functional claim.
 *
 * "Profile Completion" section rows are real data (`sections[]`, real `percentage` per row) but
 * intentionally NON-INTERACTIVE — web's own rows link to a real `editPath` per section, but its
 * exact value/shape wasn't confirmed by research. Guessing a destination (e.g. mapping "Basic
 * Information" to `SettingsProfile`) risks being wrong in a way that's hard to catch — same
 * "leave inert rather than guess" precedent as Phase 1's disabled Edit Profile button and Phase
 * 2's originally-non-interactive Profile Insights ring. Revisit once `editPath` is confirmed.
 */
export function ViewProfileAnalyticsTab() {
  const { colors, fonts } = useTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetchAnalyticsSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.ink3} />
      </View>
    );
  }

  const sections = summary?.sections ?? [];
  const fallbackPct = sections.length > 0 ? sections.reduce((sum, s) => sum + s.percentage, 0) / sections.length : 0;
  const pct = Math.max(0, Math.min(100, Math.round(summary?.completionPercentage ?? fallbackPct)));
  const sectionsDone = sections.filter(s => s.percentage >= 100).length;

  const facts = [
    { label: 'Inbound', value: summary?.inboundViews ?? 0, desc: 'Profile views this month' },
    { label: 'Outbound', value: summary?.outboundReach ?? 0, desc: 'Outbound reach this month' },
    { label: 'Matches', value: summary?.matchCount ?? 0, desc: 'Profiles matched this month' },
    { label: 'Posts', value: summary?.postCount ?? 0, desc: 'Posts made this month' },
  ];

  return (
    <View style={styles.container}>
      {/* Matches the mockup's own header exactly (decoded `vpIsAnalytics` block) — missed in the
          original build, added after the user caught it. Static copy, not computed from `pct`:
          the mockup shows this same string regardless of completion level, and no alternate
          "you're all set" copy exists in either source to switch to at 100%. */}
      <View>
        <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Your Profile Needs Work</Text>
        <Text style={[fonts.regular, styles.headerSubtitle, { color: colors.ink3 }]}>
          Higher profile completion improves Match Score accuracy and inbound deal flow.
        </Text>
      </View>

      <View style={[styles.ringCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.surfaceSunken}
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#3B82F6"
              strokeWidth={RING_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * RING_RADIUS} ${2 * Math.PI * RING_RADIUS}`}
              strokeDashoffset={2 * Math.PI * RING_RADIUS * (1 - pct / 100)}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          {/* Matches the "Profile Insights" ring's own color on the Overview tab (`#3B82F6`,
              `ViewProfileOverviewTab.tsx`) — kept as the same literal blue on purpose, per explicit
              user direction, rather than the section rows below (which stay indigo, unaffected). */}
          <Text style={[fonts.display, styles.ringPct, { color: '#3B82F6' }]}>{pct}%</Text>
        </View>
        <View style={styles.ringMeta}>
          <Text style={[fonts.semibold, styles.ringTitle, { color: colors.ink }]}>Profile Strength</Text>
          <Text style={[fonts.regular, styles.ringSubtitle, { color: colors.ink3 }]}>
            {pct}% complete · {sectionsDone} of {sections.length} sections done
          </Text>
        </View>
      </View>

      {sections.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[fonts.bold, styles.sectionHeader, { color: colors.ink }]}>Profile Completion</Text>
          <View style={styles.sectionList}>
            {sections.map(section => (
              <View key={section.label} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionTopRow}>
                  <Text style={[fonts.semibold, styles.sectionTitle, { color: colors.ink }]} numberOfLines={1}>{section.label}</Text>
                  <Text style={[fonts.bold, styles.sectionPct, { color: '#3B82F6' }]}>{Math.round(section.percentage)}%</Text>
                </View>
                {!!section.description && (
                  <Text style={[fonts.regular, styles.sectionDesc, { color: colors.ink3 }]}>{section.description}</Text>
                )}
                <View style={[styles.sectionTrack, { backgroundColor: colors.surfaceSunken }]}>
                  <View style={[styles.sectionFill, { width: `${Math.max(0, Math.min(100, section.percentage))}%`, backgroundColor: '#3B82F6' }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <Text style={[fonts.bold, styles.sectionHeader, { color: colors.ink }]}>Match Score Facts</Text>
        <View style={styles.factsGrid}>
          {facts.map(fact => (
            <View key={fact.label} style={[styles.factCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.factLabelRow}>
                <View style={[styles.factDash, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.bold, styles.factLabel, { color: colors.goldDark }]}>{fact.label.toUpperCase()}</Text>
              </View>
              <Text style={[fonts.display, styles.factValue, { color: colors.ink }]}>{fact.value}</Text>
              <Text style={[fonts.regular, styles.factDesc, { color: colors.ink3 }]}>{fact.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 18 },
  loading: { paddingVertical: 60, alignItems: 'center' },
  headerTitle: { fontSize: 21, lineHeight: 25, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 5 },
  ringCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringPct: { position: 'absolute', fontSize: 16, letterSpacing: -0.3 },
  ringMeta: { flex: 1, minWidth: 0, gap: 3 },
  ringTitle: { fontSize: 14.5 },
  ringSubtitle: { fontSize: 11.5, lineHeight: 16 },
  sectionBlock: { gap: 10 },
  sectionHeader: { fontSize: 12.5 },
  sectionList: { gap: 10 },
  sectionCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  sectionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { flex: 1, fontSize: 13 },
  sectionPct: { fontSize: 12.5 },
  sectionDesc: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  sectionTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 9 },
  sectionFill: { height: '100%', borderRadius: 3 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { flexBasis: '47%', flexGrow: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 5 },
  factLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  factDash: { width: 8, height: 2, borderRadius: 1 },
  factLabel: { fontSize: 10, letterSpacing: 0.5 },
  factValue: { fontSize: 24, letterSpacing: -0.3 },
  factDesc: { fontSize: 10.5, lineHeight: 14 },
});
