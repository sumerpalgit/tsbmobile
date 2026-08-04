import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { Icon } from '../../../icons/Icon';
import type { EventItem } from '../../../../types/home';
import type { FeedProfile } from '../../../../api/feed';
import { PostCardDescription } from '../PostCardDescription';
import type { QuickProfileContent } from '../PostCardQuickProfile';
import { formatRelativeTime } from '../../../../utils/formatRelativeTime';

/** `"2026-06-13"` + `"05:57:00"` → `"Jun 13, 2026 · 05:57"` — confirmed against a real rendered
 * overlay screenshot; the time stays in 24-hour `HH:MM` (trimmed from the raw `HH:MM:SS`) rather
 * than converting to 12-hour, matching that reference exactly. */
function formatEventDateTime(dateStr: string, timeStr: string | undefined): string {
  const date = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = timeStr?.slice(0, 5);
  return time ? `${date} · ${time}` : date;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Builds the quick-profile overlay's content for Events (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here) — confirmed against a real rendered overlay
 * screenshot: section title is `event_type` (not `format` — that's a separate "Format" row),
 * rows are Start/End/Timezone/Format/Visibility exactly, and chips (`audience_roles`) render
 * lowercase/unmodified, not capitalized. */
export function getEventQuickProfile(item: EventItem): QuickProfileContent {
  const rows = [
    { label: 'Start', value: formatEventDateTime(item.start_date, item.start_time) },
    { label: 'End', value: formatEventDateTime(item.end_date, item.end_time) },
    { label: 'Timezone', value: item.timezone },
    { label: 'Format', value: item.format },
    { label: 'Visibility', value: item.visibility ? capitalize(item.visibility) : undefined },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  return {
    sectionTitle: item.event_type || item.format,
    rows,
    chips: item.audience_roles ?? [],
  };
}

/**
 * Events — the mockup's one structurally different type: a cover-image block replaces the
 * usual avatar header entirely (no avatar anywhere on the card), with a floating date badge and
 * the type badge/location overlaid on the image itself. `PostCard.tsx` skips the shared
 * `PostCardHeader`/`PostCardFooter` for this type and forwards their callbacks here instead,
 * since this body owns that layout itself.
 *
 * The image bleeds to the card's true edges via negative margins equal to the card's own
 * padding (`15`), rather than restructuring the card shell's padding for one type.
 */
export function EventBody({
  item,
  profile,
  isAnonymous,
  createdAt,
  saved,
  onSave,
  onQuickProfile,
  onPrimaryPress,
  onRsvp,
}: {
  item: EventItem;
  profile: FeedProfile;
  isAnonymous: boolean;
  createdAt: string;
  saved?: boolean;
  onSave?: () => void;
  onQuickProfile?: () => void;
  onPrimaryPress?: () => void;
  onRsvp?: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();

  const startDate = new Date(item.start_date);
  const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = startDate.getDate();
  const isPast = new Date(item.end_date || item.start_date).getTime() < Date.now();

  const durationDays = Math.max(
    1,
    Math.round((new Date(item.end_date).getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) || 1,
  );

  const metaLine = [
    item.hosted_by && `Hosted by ${item.hosted_by}`,
    !isAnonymous && profile.name && `Posted by ${profile.name}`,
    formatRelativeTime(createdAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.coverWrap}>
        {item.cover_image && <Image source={{ uri: item.cover_image }} style={styles.cover} resizeMode="cover" />}
        <LinearGradient
          colors={['rgba(24,46,67,0.28)', 'rgba(24,46,67,0.88)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.dateBadge, { backgroundColor: '#fff' }]}>
          <Text style={[fonts.bold, styles.dateMonth, { color: colors.gold }]}>{month}</Text>
          <Text style={[fonts.bold, styles.dateDay]}>{day}</Text>
        </View>

        <View>
          <View style={[styles.overlayBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Icon name="calendar" size={11} color="#fff" />
            <Text style={[fonts.semibold, styles.overlayBadgeLabel]}>{item.event_type || item.format}</Text>
          </View>
          {!!item.location && (
            <View style={styles.locationRow}>
              <Icon name="pin" size={10} color="rgba(255,255,255,0.82)" />
              <Text style={styles.locationLabel}>{item.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.titleActions}>
          <Pressable
            onPress={onQuickProfile}
            accessibilityRole="button"
            accessibilityLabel="Quick profile"
            style={[styles.iconButton, { backgroundColor: colors.chip }]}
          >
            <Icon name="idCard" size={15} color={colors.goldDark} />
          </Pressable>
          <Pressable onPress={onSave} accessibilityRole="button" accessibilityLabel="Save" style={styles.iconButton}>
            <Icon name="bookmark" size={16} filled={saved} color={saved ? colors.gold : colors.ink3} />
          </Pressable>
        </View>
      </View>

      {!!metaLine && <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>{metaLine}</Text>}

      <PostCardDescription text={item.event_description} />

      <View style={styles.tileRow}>
        <EventTile label="When" value={`${month} ${day}`} />
        <EventTile label="Format" value={item.format} />
        <EventTile label="Duration" value={`${durationDays} ${durationDays === 1 ? 'Day' : 'Days'}`} />
      </View>

      <View style={styles.footerRow}>
        <Pressable
          onPress={onPrimaryPress}
          accessibilityRole="button"
          style={[styles.detailsButton, { backgroundColor: colors.gold }]}
        >
          <Icon name="arrowRightLong" size={14} color="#fff" />
          <Text style={[fonts.bold, styles.footerLabel, { color: '#fff' }]}>View Details</Text>
        </Pressable>

        {isPast ? (
          <View
            style={[styles.pastPill, { backgroundColor: colors.surfaceSunken, borderColor: colors.homeCardBorder }]}
          >
            <Text style={[fonts.semibold, styles.footerLabel, { fontSize: 12, color: colors.ink3 }]}>Event passed</Text>
          </View>
        ) : (
          <Pressable
            onPress={onRsvp}
            accessibilityRole="button"
            style={[styles.detailsButton, { backgroundColor: colors.gold }]}
          >
            <Text style={[fonts.bold, styles.footerLabel, { color: '#fff' }]}>{item.user_rsvped ? "You're going" : 'RSVP'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EventTile({ label, value }: { label: string; value: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
      <Text style={[fonts.bold, styles.tileLabel, { color: colors.ink3 }]}>{label.toUpperCase()}</Text>
      <Text style={[fonts.bold, styles.tileValue, { color: colors.ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 11,
  },
  coverWrap: {
    height: 118,
    marginHorizontal: -15,
    marginTop: -15,
    justifyContent: 'space-between',
    padding: 12,
    overflow: 'hidden',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 50,
    height: 54,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    fontSize: 10,
  },
  // Fixed navy, not a theme color — the mockup hardcodes this literally (`#182E43`, not a CSS
  // var) since the badge itself is always a white card floating on the cover image, regardless
  // of app theme.
  dateDay: {
    fontSize: 22,
    color: '#182E43',
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 7,
  },
  overlayBadgeLabel: {
    fontSize: 10,
    color: '#fff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  locationLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.82)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    lineHeight: 21,
  },
  titleActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  tileLabel: {
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  tileValue: {
    fontSize: 13,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 9,
  },
  detailsButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  // `flex: none`, not `flex: 1` — sized to its own content, not equal-width with the button
  // beside it (confirmed against the source: `flex:none;padding:0 14px`).
  pastPill: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: 13.5,
  },
});
