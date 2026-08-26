import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import type { ActivityTab, ActivityTabStats, MyActivityCounts } from '../../api/myActivity';

type Tile = { val: number; lbl: string };

/** Ported from `webSrc/app/dashboard/components/activity/ActivityHeroStats.tsx`'s `getTiles()` —
 * same 5 labels/values per tab, including the 3 hardcoded-`0` tiles on `liked-posts`/
 * `commented-posts` (literally `val: 0` in web's own source, not a loading artifact — plan
 * Decision 1). Per-tile semantic coloring (web's amber/green/gold) is dropped: the mockup
 * (`my_activities_decoded.html`'s `statCell`) renders every value in the same gold, uniformly —
 * UI styling is the mockup's call, not web's. */
function getTiles(tab: ActivityTab, stats: ActivityTabStats | null, counts: MyActivityCounts): Tile[] {
  switch (tab) {
    case 'liked-posts':
      return [
        { val: stats?.liked.total ?? counts.liked, lbl: 'Total liked' },
        { val: stats?.liked.thisMonth ?? 0, lbl: 'This month' },
        { val: 0, lbl: 'From searchers' },
        { val: 0, lbl: 'From sellers' },
        { val: 0, lbl: 'Now closed' },
      ];
    case 'commented-posts':
      return [
        { val: stats?.commented.total ?? counts.commented, lbl: 'Total comments' },
        { val: stats?.commented.thisMonth ?? 0, lbl: 'This month' },
        { val: 0, lbl: 'Replies received' },
        { val: 0, lbl: 'Awaiting reply' },
        { val: 0, lbl: 'Threads closed' },
      ];
    case 'my-posts':
      return [
        { val: stats?.received.pending ?? 0, lbl: 'Pending action' },
        { val: stats?.received.total ?? counts.received, lbl: 'Total received' },
        { val: stats?.received.signed ?? 0, lbl: 'Accepted' },
        { val: stats?.received.declined ?? 0, lbl: 'Declined' },
        { val: stats?.received.applied ?? 0, lbl: 'Job applicants' },
      ];
    case 'interacted-posts':
      return [
        { val: stats?.sent.awaiting ?? 0, lbl: 'Awaiting response' },
        { val: stats?.sent.total ?? counts.sent, lbl: 'Total sent' },
        { val: stats?.sent.ndaReceived ?? 0, lbl: 'NDA received' },
        { val: stats?.sent.signed ?? 0, lbl: 'NDA signed' },
        { val: stats?.sent.thisMonth ?? 0, lbl: 'This month' },
      ];
  }
}

/** Exact heading/subtitle text per tab, from the mockup's own `TABS` array
 * (`my_activities_decoded.html`) — not from web, which has no equivalent per-tab hero copy. */
const TAB_META: Record<ActivityTab, { heading: string; subtitle: string }> = {
  'liked-posts': { heading: 'Liked Posts', subtitle: "Posts, deals and events you've liked across the community" },
  'commented-posts': { heading: 'Commented Posts', subtitle: "Posts you've left a comment on" },
  'my-posts': { heading: 'Received Requests', subtitle: 'Requests from other members waiting on your response' },
  'interacted-posts': { heading: 'Sent Requests', subtitle: "Requests you've sent and their current status" },
};

/** The full hero band — dark gradient, per-tab serif heading + subtitle, and a translucent stat
 * strip — matching the mockup's hero (`ResourcesHero.tsx`/`ChapterHero.tsx` are this app's
 * established precedent for this gradient-hero-with-stat-strip pattern, `colors.hero1`/`hero2`
 * already exist for it). The mockup's eyebrow row above the heading is `display:none` in its own
 * source, so it's dropped here too, same as those two.
 *
 * Deliberate mobile-native departure from the mockup's own `overflow-x:auto` single-line strip:
 * on a real ~360dp-wide phone, 5 single-line cells (labels as long as "Awaiting response") don't
 * fit — the 5th cell got cut off, only reachable by scrolling, which read as "only 4 stats" at a
 * glance. Even `flex:1` columns with 2-line labels (`numberOfLines={2}`) keep all 5 visible at
 * once with no scroll needed — same data, same look, just laid out for a fixed-width screen
 * instead of a hover-scrollable one. */
export function ActivityHero({
  activeTab,
  tabStats,
  tabCounts,
}: {
  activeTab: ActivityTab;
  tabStats: ActivityTabStats | null;
  tabCounts: MyActivityCounts;
}) {
  const { colors, fonts } = useTheme();
  const tiles = getTiles(activeTab, tabStats, tabCounts);
  const meta = TAB_META[activeTab];

  return (
    <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.wrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[fonts.display, styles.title]}>{meta.heading}</Text>
      <Text style={styles.subtitle}>{meta.subtitle}</Text>

      <View style={[styles.stripOuter, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.13)' }]}>
        {tiles.map((tile, i) => (
          <View key={tile.lbl} style={[styles.cell, i < tiles.length - 1 && styles.cellDivider]}>
            <Text style={[fonts.display, styles.cellValue, { color: colors.goldLight }]}>{tile.val}</Text>
            <Text style={styles.cellLabel} numberOfLines={2}>
              {tile.lbl.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    letterSpacing: -0.2,
    marginTop: 7,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.62)',
    marginTop: 4,
    paddingRight: 12,
  },
  stripOuter: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    marginTop: 12,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  cellDivider: {
    borderRightColor: 'rgba(255,255,255,0.13)',
    borderRightWidth: 1,
  },
  cellValue: {
    fontSize: 16,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 10,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.58)',
  },
});
