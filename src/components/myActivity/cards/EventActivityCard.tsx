import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { MiniCardShell, MiniCardChip } from './MiniCardShell';
import { MetricStrip } from './MetricStrip';
import { MiniCardActionButton, ActionState } from './MiniCardActionButton';
import { resolveCardCta } from './resolveCardCta';
import type { EventItem } from '../../../types/home';
import type { MiniCardCommonProps } from './cardProps';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Events, for My Activity specifically — matches `EventMiniCard.tsx` (navy band + date/location
 * rows + Format/Visibility/Hosted-By metric strip), a different visual than Home feed's own
 * cover-image `EventBody.tsx`, which stays as-is (out of scope — this card is only used inside
 * My Activity's `ActivityMiniCard` dispatcher). */
export function EventActivityCard({
  item,
  submitRsvp,
  ...common
}: MiniCardCommonProps & { item: EventItem; submitRsvp: () => Promise<void> }) {
  const { colors, fonts } = useTheme();
  const [state, setState] = useState<ActionState>(item.user_rsvped ? 'done' : 'idle');
  const isPast = new Date(item.end_date || item.start_date).getTime() < Date.now();

  const chips: MiniCardChip[] = isPast ? [] : [{ label: 'RSVP Open', variant: 'muted' }];

  const timeRange = item.start_time && item.end_time ? `${item.start_time} – ${item.end_time}` : item.start_time;

  const handlePress = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await submitRsvp();
    } catch {
      // Toast already shown by the mutation's onError.
    }
    setState('done');
  };

  return (
    <MiniCardShell
      feedId={common.feedId}
      username={common.profile.username}
      isOwner={common.isOwner}
      onHide={common.onHide}
      onDeleted={common.onDeleted}
      avatarName={common.profile.name}
      avatarImg={common.profile.profile_img}
      roleType={common.profile.role_type}
      subCategory={common.profile.sub_category}
      company={common.profile.organization}
      city={common.profile.city}
      createdAt={common.createdAt}
      PillIcon={Calendar}
      pillLabel="Event"
      title={item.title || 'Event'}
      titleLines={2}
      chips={chips}
      statusBarSlot={common.statusBarSlot}
      liked={common.liked}
      likeCount={common.likeCount}
      onLike={common.onLike}
      commentCount={common.commentCount}
      onComment={common.onComment}
      ctaSlot={resolveCardCta({
        activeTab: common.activeTab,
        isOwner: common.isOwner,
        totalRequestCount: common.totalRequestCount,
        onViewRequests: common.onViewRequests,
        onViewRequest: common.onViewRequest,
        ownerLabel: 'Your event',
        nativeAction: (
          <MiniCardActionButton
            label="RSVP"
            loadingLabel="RSVPing…"
            doneLabel="RSVP'd ✓"
            state={state}
            onPress={handlePress}
          />
        ),
      })}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: colors.creamBg }]}>
          <Calendar size={13} color={colors.goldDark} />
        </View>
        <View style={styles.rowText}>
          <Text style={[fonts.bold, styles.rowMain, { color: colors.ink }]}>{formatDate(item.start_date)}</Text>
          {!!timeRange && <Text style={[fonts.regular, styles.rowSub, { color: colors.ink3 }]}>{timeRange}</Text>}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: colors.creamBg }]}>
          <MapPin size={13} color={colors.goldDark} />
        </View>
        <Text style={[fonts.regular, styles.rowMain, { color: colors.ink2 }]}>
          {item.location || (item.format?.toLowerCase() === 'online' ? 'Online' : '—')}
        </Text>
      </View>

      <MetricStrip
        metrics={[
          { label: 'Format', value: item.format ? capitalize(item.format) : '—' },
          { label: 'Visibility', value: item.visibility ? capitalize(item.visibility) : 'Public' },
          { label: 'Hosted By', value: item.hosted_by || common.profile.name },
        ]}
      />
    </MiniCardShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowMain: {
    fontSize: 12,
  },
  rowSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
});
