import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import type { MyResourceStats } from '../../hooks/useResources';

/** Matches `Resources.html`'s hero band (~line 182) — title/subtitle + a 3-cell stat strip for
 * the current user's own contribution stats (`GET /resource/my`, matching web's
 * `myDownloads`/`myContributed`/`myViews`). The mockup's eyebrow row is `display:none` in its own
 * source (~line 183), so it's dropped here too. */
export function ResourcesHero({ stats }: { stats: MyResourceStats }) {
  const { colors, fonts } = useTheme();

  const cells: { value: number; label: string }[] = [
    { value: stats.totalDownloads, label: 'Downloaded' },
    { value: stats.contributed, label: 'Contributed' },
    { value: stats.totalViews, label: 'Your views' },
  ];

  return (
    <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.wrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={[fonts.display, styles.title]}>ETA knowledge library</Text>
      <Text style={styles.subtitle}>Templates, checklists and articles shared by the community</Text>

      <View style={[styles.statStrip, { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.13)' }]}>
        {cells.map((c, i) => (
          <View
            key={c.label}
            style={[styles.statCell, i < cells.length - 1 && { borderRightColor: 'rgba(255,255,255,0.13)', borderRightWidth: 1 }]}
          >
            <Text style={[fonts.display, styles.statValue, { color: colors.goldLight }]}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label.toUpperCase()}</Text>
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
  statStrip: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    marginTop: 12,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 17,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.58)',
  },
});
