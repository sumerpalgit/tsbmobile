import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';

/**
 * Hero band — title/subtitle + a 4-stat row (Registered / Saved / Days to next event / Attended),
 * matching web's stat row exactly (`my-events/page.tsx:867-885`) — the mockup's own `stats` array
 * (`myevents_decoded.html` ~line 1458) only has 3, dropping "Days to next event"; this restores it.
 */
export function EventsHero({
  registeredCount,
  savedCount,
  daysToNextEvent,
  attendedCount,
}: {
  registeredCount: number;
  savedCount: number;
  daysToNextEvent: number | string;
  attendedCount: number;
}) {
  const { colors, fonts } = useTheme();

  const stats = [
    { label: 'Registered', value: registeredCount },
    { label: 'Saved', value: savedCount },
    { label: 'Days to next event', value: daysToNextEvent },
    { label: 'Attended', value: attendedCount },
  ];

  return (
    <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[fonts.display, styles.title]}>Your event dashboard</Text>
      <Text style={[fonts.regular, styles.subtitle]}>Track registrations and manage your calendar</Text>

      <View style={[styles.statsRow, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.13)' }]}>
        {stats.map((stat, index) => (
          <View
            key={stat.label}
            style={[styles.statCell, index > 0 && { borderLeftColor: 'rgba(255,255,255,0.13)', borderLeftWidth: 1 }]}
          >
            <Text style={[fonts.display, styles.statValue, { color: colors.goldLight }]}>{stat.value}</Text>
            <Text style={[fonts.bold, styles.statLabel]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 12,
  },
  title: {
    fontSize: 21,
    lineHeight: 24,
    color: '#fff',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 17,
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 8.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.58)',
    // Without this, only single-line labels (Registered/Saved/Attended) read as centered — they're
    // centered purely because `statCell`'s `alignItems: 'center'` centers the whole text block,
    // not because the text itself is. "Days to next event" is long enough to wrap onto two lines,
    // and wrapped lines default to left-aligned relative to each other, so it visibly didn't match
    // the other three.
    textAlign: 'center',
  },
});
