import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import type { HeroStat } from '../../utils/myMatchesStats';

/**
 * My Matches hero band — dark gradient, per-tab serif heading + subtitle, and a translucent
 * 5-cell stat strip.
 *
 * Deliberately a copy of `myActivity/ActivityHero.tsx`'s structure and literal values rather than
 * a port of web's own hero. This app already has four of these bands (`ActivityHero`,
 * `ResourcesHero`, `ChapterHero`, `EventsHero`) that agree with each other on every measurement;
 * matching web's instead (26px serif, 5 differently-coloured stat values, a decorative radial
 * glow) would make My Matches the one screen whose hero looks different from the rest of the app.
 *
 * The `rgba(255,255,255,*)` literals are intentional and match the other four: this strip sits on
 * a fixed-dark gradient in both light and dark themes, so translucent white is correct here and
 * `colors.ink`/`colors.surface` would invert wrongly.
 *
 * One difference from web worth noting: web tints each stat value separately (gold, amber, green,
 * rose). Every hero in this app renders all values in the same `goldLight`, and that uniformity is
 * the house style — so the per-stat colours are dropped, same call `ActivityHero` made.
 */

export function MyMatchesHero({
  heading,
  subtitle,
  stats,
}: {
  heading: string;
  subtitle: string;
  stats: HeroStat[];
}) {
  const { colors, fonts } = useTheme();

  return (
    <LinearGradient
      colors={[colors.hero1, colors.hero2]}
      style={styles.wrap}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      <Text style={[fonts.display, styles.title]}>{heading}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.stripOuter}>
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            style={[styles.cell, i < stats.length - 1 && styles.cellDivider]}>
            <Text style={[fonts.display, styles.cellValue, { color: colors.goldLight }]}>
              {stat.value}
            </Text>
            <Text style={styles.cellLabel} numberOfLines={2}>
              {stat.label.toUpperCase()}
            </Text>
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
  stripOuter: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.13)',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  cellDivider: {
    borderRightColor: 'rgba(255,255,255,0.13)',
    borderRightWidth: 1,
  },
  cellValue: {
    fontSize: 16,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 10,
    // Labels here run to three words ("Posts with Matches"), so they wrap. `alignItems: 'center'`
    // centres the text block but not the wrapped lines relative to each other — same fix
    // `EventsHero` needed for "Days to next event".
    textAlign: 'center',
    color: 'rgba(255,255,255,0.58)',
  },
});
