import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import { fetchAnalyticsSummary, AnalyticsSummary } from '../../api/analytics';

const RING_SIZE = 84;
const RING_RADIUS = 34;
const RING_STROKE = 9;
// Web's own `CompleteProfileTab` hardcodes this denominator too (`totalSections = 3`,
// `page.tsx:3676`) rather than deriving it from `sections.length` — matched here for parity.
const TOTAL_SECTIONS = 3;

/** Same opacity-pulse shimmer as `ResourceCardSkeleton.tsx`/`MemberCardSkeleton.tsx` — web's own
 * Analytics tab shows skeleton placeholders (`SkeletonBox`) while `fetchAnalyticsSummary()` is in
 * flight; matched here instead of a plain spinner to stay consistent with both sources. */
function Shimmer({ width, height, radius = 6 }: { width: number | `${number}%`; height: number; radius?: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken }, { opacity }]} />;
}

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
 *
 * Re-verified line-by-line against web's real `CompleteProfileTab` (page.tsx:3638-3875) after the
 * user asked for a direct diff — this pass fixed several real mismatches: the header title is
 * dynamic on web (3-tier "Strong"/"Good"/"Needs Work" copy by completion %, not a static string)
 * and the "Step X/Y" subtext format didn't match web's exact copy/denominator. That same pass also
 * added a web-only green "completed" state (checkmark/info icon, green bar fill, green % text) —
 * later found to NOT exist in the mockup at all (see below) and removed again.
 *
 * The Match Score Facts cards' gold accent dash + uppercase `goldDark` label was briefly swapped
 * for a plain icon + normal-case gray label during that same pass, matching web's literal inline
 * styles for that card — wrong per this project's own "mockup for design, web for functionality"
 * rule, since a card's decorative style is a design question, not a functional one. Reverted back
 * to the gold dash/label after the user flagged it against a screenshot: the decoded mockup
 * (`profilelast_decoded.html`, "Match Score Facts" block) specs `--goldl` (`colors.goldLight`) for
 * the 10×2 dash and `--goldd` (`colors.goldDark`) for the uppercase 10px/700/0.06em label — web's
 * own inline styles for this one card just don't match its own mockup here, and design authority
 * stays with the mockup.
 *
 * Profile Completion cards' % text was also moved after the user flagged it sitting in the wrong
 * row: per the mockup (`anCompletion` block, `c.barStyle`/`c.pctLabel`) it belongs in a SEPARATE
 * row below the title/description, directly beside the progress bar — not up in the title row (the
 * checkmark/info icon that used to sit there was this file's own invention, not in the mockup or
 * web, and was dropped rather than replaced with anything, per explicit instruction not to add UI
 * beyond what was asked). The % text is a flat `colors.ink2` in the mockup regardless of completion
 * (`--ink2`, never green/blue) — the bar fill itself stays the literal `#3B82F6` per the user's own
 * earlier explicit direction ("Profile Completion has Progress bar used there same color for
 * progress bar", matching the ring), which overrides the mockup's own `--indigo` fill for that one
 * property only. Rows stay non-interactive per the `editPath` note above.
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

  const sections = summary?.sections ?? [];
  const fallbackPct = sections.length > 0 ? sections.reduce((sum, s) => sum + s.percentage, 0) / sections.length : 0;
  const pct = Math.max(0, Math.min(100, Math.round(summary?.completionPercentage ?? fallbackPct)));
  const sectionsDone = sections.filter(s => s.percentage >= 100).length;

  // Matches web's own three-tier copy exactly (`CompleteProfileTab`'s `strengthLabel`,
  // page.tsx:3663-3666) rather than a single static string.
  const headerTitle = pct >= 80 ? 'Your Profile is Strong' : pct >= 50 ? 'Your Profile is Good' : 'Your Profile Needs Work';

  const facts = [
    { label: 'Inbound', value: summary?.inboundViews ?? 0, desc: 'Profile views this month' },
    { label: 'Outbound', value: summary?.outboundReach ?? 0, desc: 'Outbound reach this month' },
    { label: 'Matches', value: summary?.matchCount ?? 0, desc: 'Profiles matched this month' },
    { label: 'Posts', value: summary?.postCount ?? 0, desc: 'Posts made this month' },
  ];

  return (
    <View style={styles.container}>
      <View>
        <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>{headerTitle}</Text>
        <Text style={[fonts.regular, styles.headerSubtitle, { color: colors.ink3 }]}>
          Higher profile completion improves Match Score accuracy and inbound deal flow.
        </Text>
      </View>

      <View style={[styles.ringCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {loading ? (
          <>
            <Shimmer width={RING_SIZE} height={RING_SIZE} radius={RING_SIZE / 2} />
            <View style={[styles.ringMeta, styles.ringMetaLoading]}>
              <Shimmer width="70%" height={14} />
              <Shimmer width="55%" height={11} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="#EFF0F2" strokeWidth={RING_STROKE} fill="none" />
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
                  `ViewProfileOverviewTab.tsx`) — same literal blue web itself uses here too. */}
              <Text style={[fonts.display, styles.ringPct, { color: '#3B82F6' }]}>{pct}%</Text>
            </View>
            <View style={styles.ringMeta}>
              <Text style={[fonts.semibold, styles.ringTitle, { color: colors.ink }]}>Profile Strength</Text>
              <Text style={[fonts.regular, styles.ringSubtitle, { color: colors.ink3 }]}>
                {pct}% Complete (Step {sectionsDone}/{TOTAL_SECTIONS})
              </Text>
            </View>
          </>
        )}
      </View>

      {(loading || sections.length > 0) && (
        <View style={styles.sectionBlock}>
          <Text style={[fonts.bold, styles.sectionHeader, { color: colors.ink }]}>Profile Completion</Text>
          <View style={styles.sectionList}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.sectionTitleCol}>
                      <Shimmer width="55%" height={13} />
                      <Shimmer width="80%" height={11} />
                    </View>
                    <View style={styles.sectionBottomRow}>
                      <View style={styles.sectionTrack}>
                        <Shimmer width="100%" height={6} radius={3} />
                      </View>
                      <Shimmer width={26} height={11} />
                    </View>
                  </View>
                ))
              : sections.map(section => (
                  <View key={section.label} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.sectionTitleCol}>
                      <Text style={[fonts.bold, styles.sectionTitle, { color: colors.ink }]}>{section.label}</Text>
                      {!!section.description && (
                        <Text style={[fonts.regular, styles.sectionDesc, { color: colors.ink3 }]}>{section.description}</Text>
                      )}
                    </View>
                    <View style={styles.sectionBottomRow}>
                      <View style={[styles.sectionTrack, { backgroundColor: colors.surfaceSunken }]}>
                        <View style={[styles.sectionFill, { width: `${Math.max(0, Math.min(100, section.percentage))}%` }]} />
                      </View>
                      <Text style={[fonts.bold, styles.sectionPct, { color: colors.ink2 }]}>{Math.round(section.percentage)}%</Text>
                    </View>
                  </View>
                ))}
          </View>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <Text style={[fonts.bold, styles.sectionHeader, { color: colors.ink }]}>Match Score Facts</Text>
        <View style={styles.factsGrid}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={[styles.factCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Shimmer width="55%" height={10} />
                  <Shimmer width="40%" height={20} />
                  <Shimmer width="80%" height={10} />
                </View>
              ))
            : facts.map(fact => (
                <View key={fact.label} style={[styles.factCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.factLabelRow}>
                    <View style={[styles.factDash, { backgroundColor: colors.goldLight }]} />
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
  headerTitle: { fontSize: 21, lineHeight: 25, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 5 },
  ringCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringPct: { position: 'absolute', fontSize: 16, letterSpacing: -0.3 },
  ringMeta: { flex: 1, minWidth: 0, gap: 3 },
  ringMetaLoading: { gap: 6 },
  ringTitle: { fontSize: 14.5 },
  ringSubtitle: { fontSize: 11.5, lineHeight: 16 },
  sectionBlock: { gap: 10 },
  sectionHeader: { fontSize: 12.5 },
  sectionList: { gap: 10 },
  sectionCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 13, gap: 9 },
  sectionTitleCol: { gap: 2 },
  sectionTitle: { fontSize: 13 },
  sectionPct: { fontSize: 11, flexShrink: 0 },
  sectionDesc: { fontSize: 10.5, lineHeight: 15 },
  sectionBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  sectionFill: { height: '100%', borderRadius: 3, backgroundColor: '#3B82F6' },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { flexBasis: '47%', flexGrow: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 5 },
  factLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factDash: { width: 10, height: 2, borderRadius: 1 },
  factLabel: { fontSize: 10, letterSpacing: 0.6 },
  factValue: { fontSize: 24, letterSpacing: -0.3 },
  factDesc: { fontSize: 10.5, lineHeight: 14 },
});
