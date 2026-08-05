import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import type { MyEventItem } from '../../types/events';
import {
  badgeColors,
  formatTimeRange,
  getEventAccent,
  getEventBadge,
  getEventDateParts,
  getEventTypeLabel,
  isEventPast,
  isVirtualEvent,
} from './eventVisuals';

/**
 * The main My Events list card. Footer buttons are a literal 1:1 port of web's `EventCard`
 * footer (`webSrc/src/app/dashboard/my-events/page.tsx` line 216-244) — no added states, no
 * mockup-only labels. Web branches purely on `isRsvp` × `isVirtual`, plus an owner-only 3rd
 * "Edit" button; there is no `past` branch at all — a past, never-RSVP'd event still renders
 * "RSVP Now" on web, so it does here too:
 *   - not RSVP'd            → [RSVP Now (gold)] [Details (ghost)]
 *   - RSVP'd + virtual      → [Join Event (navy)] [Details (ghost)]
 *   - RSVP'd + not virtual  → [View Details (navy)] [Cancel (red, narrow)]
 *   - + owner               → append [Edit (ghost, narrow)]
 */
export function EventListCard({
  event,
  isRsvped,
  saved,
  isOwner,
  pendingAction = null,
  onOpen,
  onSave,
  onRsvp,
  onCancelRsvp,
  onEdit,
}: {
  event: MyEventItem;
  isRsvped: boolean;
  saved: boolean;
  isOwner: boolean;
  /** Which of this card's confirm-dialog actions ("RSVP Now" or "Cancel") is currently waiting
   * on its `ConfirmDialog` to finish mounting — shows a spinner in that button instead so the tap
   * registers instantly even though the dialog itself takes a moment to appear. `null` when
   * neither is pending (the common case). */
  pendingAction?: 'rsvp' | 'cancel' | null;
  onOpen: () => void;
  onSave: () => void;
  onRsvp: () => void;
  onCancelRsvp: () => void;
  onEdit: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const accent = getEventAccent(event, colors);
  const badge = getEventBadge(event, isRsvped);
  const badgeStyle = badgeColors(badge.kind, colors);
  const { day, month } = getEventDateParts(event);
  const past = isEventPast(event);
  const virtual = isVirtualEvent(event);

  const primary = isRsvped
    ? { label: virtual ? 'Join Event' : 'View Details', kind: 'navy' as const, onPress: onOpen }
    : { label: 'RSVP Now', kind: 'gold' as const, onPress: onRsvp };
  const secondary = isRsvped
    ? virtual
      ? { label: 'Details', kind: 'ghost' as const, onPress: onOpen }
      : { label: 'Cancel', kind: 'red' as const, onPress: onCancelRsvp }
    : { label: 'Details', kind: 'ghost' as const, onPress: onOpen };

  const buttonPalette = {
    navy: { bg: colors.accentSolid, border: colors.accentSolid, text: colors.onAccent },
    gold: { bg: colors.gold, border: colors.gold, text: '#fff' },
    ghost: { bg: colors.surface2, border: colors.border, text: colors.ink2 },
    red: { bg: colors.dangerSurface, border: colors.dangerSurface, text: colors.danger },
  };

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.dateBlock,
              { borderRadius: radius.md },
              past ? { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin } : { backgroundColor: colors.chip },
            ]}
          >
            <Text style={[fonts.display, styles.dateDay, { color: past ? colors.ink3 : colors.goldDark }]}>{day}</Text>
            <Text style={[fonts.bold, styles.dateMonth, { color: past ? colors.ink3 : colors.goldDark }]}>{month}</Text>
          </View>

          <View style={styles.info}>
            <View style={styles.metaRow}>
              <Text style={[fonts.bold, styles.typeLabel, { color: colors.ink3 }]}>{getEventTypeLabel(event).toUpperCase()}</Text>
              <View style={[styles.statusPill, { backgroundColor: badgeStyle.bg, borderRadius: radius.sm }]}>
                <Text style={[fonts.bold, styles.statusText, { color: badgeStyle.fg }]}>{badge.label}</Text>
              </View>
            </View>
            <Text style={[fonts.bold, styles.title, { color: colors.ink }]} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.subRow}>
              <Text style={[fonts.semibold, styles.time, { color: colors.ink2 }]} numberOfLines={1}>
                {formatTimeRange(event)}
              </Text>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <Text style={[fonts.regular, styles.location, { color: colors.ink3 }]} numberOfLines={1}>
                {event.location || (virtual ? 'Virtual Event' : 'Location TBD')}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="Save event"
            hitSlop={6}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            <Icon name="bookmark" size={15} filled={saved} color={saved ? colors.gold : colors.ink3} />
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <ActionButton
            label={primary.label}
            palette={buttonPalette[primary.kind]}
            onPress={primary.onPress}
            radius={radius.md}
            borderWidth={borderWidth.thin}
            fontStyle={fonts.bold}
            fontSize={fontSize.small + 1}
            loading={!isRsvped && pendingAction === 'rsvp'}
          />
          <ActionButton
            label={secondary.label}
            palette={buttonPalette[secondary.kind]}
            onPress={secondary.onPress}
            radius={radius.md}
            borderWidth={borderWidth.thin}
            fontStyle={fonts.semibold}
            fontSize={fontSize.small}
            narrow={secondary.kind === 'red'}
            loading={secondary.kind === 'red' && pendingAction === 'cancel'}
          />
          {isOwner && (
            <ActionButton
              label="Edit"
              palette={buttonPalette.ghost}
              onPress={onEdit}
              radius={radius.md}
              borderWidth={borderWidth.thin}
              fontStyle={fonts.semibold}
              fontSize={fontSize.small}
              narrow
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ActionButton({
  label,
  palette,
  onPress,
  radius,
  borderWidth,
  fontStyle,
  fontSize,
  narrow = false,
  loading = false,
}: {
  label: string;
  palette: { bg: string; border: string; text: string };
  onPress: () => void;
  radius: number;
  borderWidth: number;
  fontStyle: object;
  fontSize: number;
  narrow?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionButton,
        narrow && styles.narrowButton,
        { borderRadius: radius, backgroundColor: palette.bg, borderColor: palette.border, borderWidth },
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <Text numberOfLines={1} style={[fontStyle, styles.actionText, { color: palette.text, fontSize }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.65,
  },
  accentBar: {
    height: 3,
  },
  body: {
    padding: 13,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBlock: {
    width: 46,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 19,
    lineHeight: 20,
  },
  dateMonth: {
    fontSize: 8.5,
    letterSpacing: 0.7,
    marginTop: 2,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  typeLabel: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14.5,
    lineHeight: 19,
    marginTop: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 7,
  },
  time: {
    fontSize: 11.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  location: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
  },
  saveButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    marginRight: -6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  narrowButton: {
    flex: 0.7,
  },
  actionText: {
    fontSize: 12.5,
  },
});
