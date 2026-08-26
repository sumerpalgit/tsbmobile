import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { RequestsStatusBar } from './RequestsStatusBar';
import { SentRequestStatusBar } from './SentRequestStatusBar';
import type { ActivityTab, MyActivityFeedItem } from '../../api/myActivity';

/** Builds the `statusBarSlot` content for `my-posts`/`interacted-posts` — passed straight into
 * `ActivityMiniCard`, rendered INSIDE the card (between the metric strip and the footer), matching
 * web's real per-mini-card `statusBarSlot` position. `liked-posts`/`commented-posts` have no
 * below-card bar at all — the "You liked this — Unlike" strip and the "last comment + Edit" strip
 * were both removed on request; the like toggle and comment count stay reachable via the card's
 * own footer buttons, so no functionality is lost, just the redundant banners. */
export function buildStatusBarSlot(tab: ActivityTab, item: MyActivityFeedItem, onPress?: () => void): React.ReactNode {
  if (tab === 'my-posts') return <MyPostsBar item={item} onPress={onPress} />;
  if (tab === 'interacted-posts') return <InteractedBar item={item} onPress={onPress} />;
  return undefined;
}

function MyPostsBar({ item, onPress }: { item: MyActivityFeedItem; onPress?: () => void }) {
  // Matches `page.tsx`'s own `reqBreakdown` read exactly: the real, backend-computed totals take
  // priority; `recent_requesters` (a preview list, not guaranteed complete) is only a fallback for
  // the total count when `request_breakdown` is missing — never used to derive pending/nda-sent/
  // declined, since filtering a truncated preview list undercounts those once a post has more
  // requesters than the preview holds.
  const breakdown = item.request_breakdown ?? {};
  const pendingCount = breakdown.pending ?? 0;
  const ndaSentCount = breakdown.nda_sent ?? 0;
  const declinedCount = breakdown.declined ?? 0;
  const totalRequestCount = breakdown.total ?? item.recent_requesters?.length ?? 0;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <RequestsStatusBar
        totalRequestCount={totalRequestCount}
        pendingCount={pendingCount}
        ndaSentCount={ndaSentCount}
        declinedCount={declinedCount}
        newRequestCount={pendingCount}
        postStatus={item.is_published === false ? 'draft' : 'live'}
      />
    </Pressable>
  );
}

function rsvpLabel(response?: string): { label: string; dot: string; text: string; bg: string } {
  switch (response) {
    case 'attending':
      return { label: 'Attending', dot: '#059669', text: '#059669', bg: 'rgba(5,150,105,.1)' };
    case 'not_attending':
    case 'not attending':
      return { label: 'Not Attending', dot: '#DC2626', text: '#DC2626', bg: 'rgba(220,38,38,.1)' };
    case 'maybe':
      return { label: 'Maybe', dot: '#D97706', text: '#D97706', bg: 'rgba(217,119,6,.1)' };
    default:
      return { label: "RSVP'd", dot: '#A7852D', text: '#7a6020', bg: 'rgba(180,132,40,.1)' };
  }
}

function InteractedBar({ item, onPress }: { item: MyActivityFeedItem; onPress?: () => void }) {
  const { colors, fonts, borderWidth } = useTheme();

  if (item.interaction_type === 'event_rsvp') {
    const cfg = rsvpLabel(item.interaction_details?.rsvp_response);
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={[styles.bar, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}
      >
        <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
          <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
          <Text style={[fonts.semibold, styles.barText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </Pressable>
    );
  }

  const status = item.interaction_type === 'job_application' ? 'applied' : item.interaction_details?.status ?? 'requested';

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <SentRequestStatusBar status={status} sentAt={item.created_at} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 9,
    paddingHorizontal: 14,
    paddingBottom: 9,
    gap: 10,
  },
  barText: {
    fontSize: 11.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
