import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import type { MyEventItem } from '../../types/events';
import { formatTimeRange, isVirtualEvent } from './eventVisuals';

/** "Next up · in N days" card — shown above the list only for the Upcoming tab with no active
 * search, matching the mockup's `showNext` gate exactly. `daysUntil` is the caller's job since it
 * needs "now" (see `MyEventsScreen`'s selection of the soonest RSVP'd event). */
export function NextUpCard({ event, daysUntil, onPress }: { event: MyEventItem; daysUntil: number; onPress: () => void }) {
  const { colors, fonts, radius, borderWidth } = useTheme();

  const metaLine = [event.location || (isVirtualEvent(event) ? 'Virtual Event' : ''), formatTimeRange(event)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.homeCardBorder,
          borderWidth: borderWidth.thin,
          borderLeftColor: colors.gold,
          borderLeftWidth: 3,
          borderRadius: radius.xl,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <Text style={[fonts.bold, styles.eyebrow, { color: colors.gold }]}>
          NEXT UP · IN {daysUntil} {daysUntil === 1 ? 'DAY' : 'DAYS'}
        </Text>
        <Text style={[fonts.bold, styles.title, { color: colors.ink }]} numberOfLines={1}>
          {event.title}
        </Text>
        {!!metaLine && (
          <Text style={[fonts.regular, styles.meta, { color: colors.ink3 }]} numberOfLines={1}>
            {metaLine}
          </Text>
        )}
      </View>
      <Icon name="chevronRight" size={16} color={colors.ink3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 13,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 13.5,
    marginTop: 5,
  },
  meta: {
    fontSize: 11.5,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.65,
  },
});
