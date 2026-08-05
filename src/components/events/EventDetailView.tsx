import React from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import type { MyEventItem } from '../../types/events';
import {
  badgeColors,
  formatFullDate,
  formatTimeRange,
  getEventAccent,
  getEventBadge,
  getEventDateParts,
  getEventTypeLabel,
  isVirtualEvent,
} from './eventVisuals';

/**
 * Event detail content — a single view (no collapsed/expanded split like web's modal), matching
 * the mockup's one-state `detailOpen` overlay (`myevents_decoded.html` ~line 332-476). Plain
 * screen content now, not a `Modal` overlay — this used to own its own `Modal` +
 * `Animated.timing` slide-in (matching `FilterPanel.tsx`'s pattern), but moved to a dedicated
 * pushed screen (`EventDetailScreen.tsx`, registered in `AppNavigator.tsx`) after `Modal`'s
 * coordinate-space quirks caused a real, hard-to-pin-down bug: `useSafeAreaInsets()` read inside
 * a `Modal` isn't reliable on Android in every case, which showed up as the hero banner touching
 * the very top of the screen "in some cases" — not a spacing mistake, a `Modal` problem. Same
 * transformation `CreateEventWizard.tsx` already went through for the same reason.
 *
 * No attendee "going" faces row — that's fabricated demo data in the mockup with no backing field
 * on `MyEventItem` or `/api/event/filter-list`, so it's deliberately omitted rather than invented.
 */
export function EventDetailView({
  event,
  isRsvped,
  onClose,
  onRsvp,
  onCancelRsvp,
}: {
  event: MyEventItem;
  isRsvped: boolean;
  onClose: () => void;
  onRsvp: () => void;
  onCancelRsvp: () => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const accent = getEventAccent(event, colors);
  const badge = getEventBadge(event, isRsvped);
  const badgeStyle = badgeColors(badge.kind, colors);
  const { day, month } = getEventDateParts(event);
  const virtual = isVirtualEvent(event);
  const hostInitials =
    (event.hosted_by || '')
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const detailRows: { label: string; value: string }[] = [
    { label: 'Start', value: formatFullDate(event.start_date) },
    { label: 'End', value: formatFullDate(event.end_date) },
  ];
  if (event.timezone) detailRows.push({ label: 'Timezone', value: event.timezone });
  detailRows.push({ label: 'Event type', value: getEventTypeLabel(event) });
  if (event.format) detailRows.push({ label: 'Format', value: event.format });
  if (event.visibility) detailRows.push({ label: 'Visibility', value: event.visibility });

  const openLink = () => {
    if (!event.event_link) return;
    const url = event.event_link.startsWith('http') ? event.event_link : `https://${event.event_link}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <View style={styles.backIcon}>
            <Icon name="chevronRight" size={18} color={colors.ink} strokeWidth={2} />
          </View>
        </Pressable>
        <Text style={[fonts.bold, styles.headerTitle, { color: colors.ink2 }]}>Event details</Text>
        <Pressable
          onPress={() => Toast.show({ type: 'success', text1: 'Link copied!' })}
          accessibilityRole="button"
          accessibilityLabel="Share"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Icon name="share" size={17} color={colors.ink2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {event.cover_image ? (
            <Image source={{ uri: event.cover_image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[colors.hero1, colors.hero2]} style={StyleSheet.absoluteFillObject} />
          )}
          <LinearGradient colors={['rgba(24,46,67,0.5)', 'rgba(24,46,67,0.86)']} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.accentStrip, { backgroundColor: accent }]} />

          <View style={styles.heroContent}>
            <View style={styles.heroBadges}>
              <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.sm }]}>
                <Text style={[fonts.bold, styles.typeBadgeText]}>{getEventTypeLabel(event)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg, borderRadius: radius.sm }]}>
                <Text style={[fonts.bold, styles.statusBadgeText, { color: badgeStyle.fg }]}>{badge.label}</Text>
              </View>
            </View>
            <Text style={[fonts.display, styles.heroTitle]} numberOfLines={3}>
              {event.title}
            </Text>
            <View style={styles.heroDateRow}>
              <View style={[styles.heroDateBlock, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: radius.md }]}>
                <Text style={[fonts.display, styles.heroDateDay, { color: colors.goldLight }]}>{day}</Text>
                <Text style={[fonts.bold, styles.heroDateMonth, { color: colors.goldLight }]}>{month}</Text>
              </View>
              <View style={{ minWidth: 0 }}>
                <Text style={[fonts.semibold, styles.heroDateText]}>{formatFullDate(event.start_date)}</Text>
                <Text style={[fonts.regular, styles.heroTimeText]}>{formatTimeRange(event)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {!!event.event_description && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
              <Text style={[fonts.regular, styles.description, { color: colors.ink2 }]}>{event.event_description}</Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl, padding: 0, overflow: 'hidden' }]}>
            <View style={styles.detailGrid}>
              {detailRows.map((row, index) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailCell,
                    { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
                    index % 2 === 0 ? { borderRightColor: colors.border, borderRightWidth: borderWidth.thin } : null,
                  ]}
                >
                  <Text style={[fonts.bold, styles.detailLabel, { color: colors.ink3 }]}>{row.label.toUpperCase()}</Text>
                  <Text style={[fonts.semibold, styles.detailValue, { color: colors.ink }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            {!!event.location && (
              <View style={[styles.locationRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[fonts.bold, styles.detailLabel, { color: colors.ink3 }]}>LOCATION</Text>
                  <Text style={[fonts.semibold, styles.detailValue, { color: colors.ink }]}>{event.location}</Text>
                </View>
                <Pressable
                  onPress={() => Toast.show({ type: 'info', text1: 'Opening map…' })}
                  style={({ pressed }) => [
                    styles.smallButton,
                    { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.md },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[fonts.semibold, styles.smallButtonText, { color: colors.ink2 }]}>{virtual ? 'Copy link' : 'Map'}</Text>
                </Pressable>
              </View>
            )}

            {!!event.event_link && (
              <View style={styles.locationRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[fonts.bold, styles.detailLabel, { color: colors.ink3 }]}>EVENT LINK</Text>
                  <Pressable onPress={openLink} style={({ pressed }) => [pressed && styles.pressed]}>
                    <Text style={[fonts.semibold, styles.linkValue, { color: colors.gold }]} numberOfLines={1}>
                      {event.event_link}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {!!event.visibility && (
            <View style={[styles.noticeRow, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
              <Icon name="account" size={15} color={colors.ink3} />
              <Text style={[fonts.regular, styles.noticeText, { color: colors.ink2 }]}>
                {event.visibility === 'private' ? (
                  <>This event is <Text style={fonts.semibold}>private</Text> — visible only via the registration link.</>
                ) : event.visibility === 'public' ? (
                  <>This event is visible to <Text style={fonts.semibold}>everyone on TSB</Text>.</>
                ) : (
                  <>This event is visible to <Text style={fonts.semibold}>{event.visibility}</Text>.</>
                )}
              </Text>
            </View>
          )}

          {!!event.hosted_by && (
            <View style={[styles.card, styles.hostCard, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
              <View style={[styles.hostAvatar, { backgroundColor: colors.accentSolid, borderRadius: radius.md }]}>
                <Text style={[fonts.bold, styles.hostInitials, { color: colors.onAccent }]}>{hostInitials}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[fonts.bold, styles.detailLabel, { color: colors.ink3 }]}>HOSTED BY</Text>
                <Text style={[fonts.semibold, styles.hostName, { color: colors.ink }]} numberOfLines={1}>
                  {event.hosted_by}
                </Text>
              </View>
              <Pressable
                onPress={() => Toast.show({ type: 'info', text1: 'Coming soon' })}
                style={({ pressed }) => [
                  styles.smallButton,
                  { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.md },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[fonts.semibold, styles.smallButtonText, { color: colors.ink2 }]}>View</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
        {isRsvped ? (
          <Pressable
            onPress={onCancelRsvp}
            style={({ pressed }) => [styles.footerButton, { backgroundColor: colors.dangerSurface, borderRadius: radius.xl }, pressed && styles.pressed]}
          >
            <Text style={[fonts.bold, styles.footerButtonText, { color: colors.danger }]}>Cancel RSVP</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onRsvp}
            style={({ pressed }) => [styles.footerButton, { backgroundColor: colors.gold, borderRadius: radius.xl }, pressed && styles.pressed]}
          >
            <Text style={[fonts.bold, styles.footerButtonText, { color: '#fff' }]}>RSVP now</Text>
          </Pressable>
        )}
        {!!event.event_link && (
          <Pressable
            onPress={openLink}
            style={({ pressed }) => [styles.footerButton, { backgroundColor: colors.accentSolid, borderRadius: radius.xl }, pressed && styles.pressed]}
          >
            {virtual && <Icon name="link" size={13} color={colors.onAccent} />}
            <Text style={[fonts.bold, styles.footerButtonText, { color: colors.onAccent }]}>
              {virtual ? 'Join event' : 'View Details'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    transform: [{ scaleX: -1 }],
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
  },
  hero: {
    height: 200,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  heroContent: {
    padding: 18,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 29,
    color: '#fff',
    marginTop: 10,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  heroDateBlock: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDateDay: {
    fontSize: 19,
    lineHeight: 20,
  },
  heroDateMonth: {
    fontSize: 8.5,
    letterSpacing: 0.7,
    marginTop: 2,
  },
  heroDateText: {
    fontSize: 13,
    color: '#fff',
  },
  heroTimeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  body: {
    padding: 16,
    gap: 13,
  },
  card: {
    padding: 14,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailCell: {
    width: '50%',
    padding: 12,
  },
  detailLabel: {
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
  detailValue: {
    fontSize: 13,
    marginTop: 6,
  },
  linkValue: {
    fontSize: 13,
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 13,
  },
  smallButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    fontSize: 11.5,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: {
    fontSize: 13,
  },
  hostName: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  footerButtonText: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.65,
  },
});
