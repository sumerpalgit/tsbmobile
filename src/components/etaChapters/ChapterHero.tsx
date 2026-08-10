import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';

/** Gradient hero band + stats strip — matches `ETAChapters_decoded.html`'s HERO section
 * (~line 184). Stats are all real (`myChapters.length`, `tabCounts.local/international`) — `–`
 * for a count that hasn't loaded yet, matching web's own `tabCounts.local != null ? ... : '–'`. */
export function ChapterHero({
  myChaptersCount,
  localCount,
  internationalCount,
}: {
  myChaptersCount: number;
  localCount: number | null;
  internationalCount: number | null;
}) {
  const { colors, fonts } = useTheme();

  const stats: { n: string; label: string }[] = [
    { n: String(myChaptersCount), label: 'My chapters' },
    { n: localCount != null ? String(localCount) : '–', label: 'Local' },
    { n: internationalCount != null ? String(internationalCount) : '–', label: 'International' },
  ];

  return (
    <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[fonts.display, styles.title, { color: '#fff' }]}>Find your local room</Text>
      <Text style={[fonts.regular, styles.subtitle, { color: 'rgba(255,255,255,0.62)' }]}>
        Local meetups, expert talks and peer groups across 6 continents
      </Text>

      <View style={[styles.statsRow, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.13)' }]}>
        {stats.map((s, i) => (
          <View
            key={s.label}
            style={[styles.statCell, i < stats.length - 1 && { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.13)' }]}
          >
            <Text style={[fonts.display, styles.statNumber, { color: colors.goldLight }]}>{s.n}</Text>
            <Text style={[fonts.bold, styles.statLabel, { color: 'rgba(255,255,255,0.58)' }]}>{s.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
  },
  title: {
    fontSize: 21,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 4,
    paddingRight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 17,
    lineHeight: 17,
  },
  statLabel: {
    fontSize: 8.5,
    letterSpacing: 0.7,
  },
});
