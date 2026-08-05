import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';

/**
 * Hero band — title/subtitle + a 3-stat row (Registered / Saved / Attended), matching the
 * mockup's `stats` array exactly (`myevents_decoded.html` ~line 1458) — not web's 4-stat version
 * (which adds "Days to next event").
 */
export function EventsHero({
  registeredCount,
  savedCount,
  attendedCount,
}: {
  registeredCount: number;
  savedCount: number;
  attendedCount: number;
}) {
  const { colors, fonts } = useTheme();

  const stats = [
    { label: 'Registered', value: registeredCount },
    { label: 'Saved', value: savedCount },
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
  },
});
