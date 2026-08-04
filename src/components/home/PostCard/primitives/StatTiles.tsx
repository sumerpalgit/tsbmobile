import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';

export type StatTile = {
  label: string;
  value: string;
  /** Spans the full row instead of sharing half — Find My Match's "Exchange" tile sits alone
   * below a 2-up row of "Want"/"Format", matching the mockup's example exactly. */
  fullWidth?: boolean;
};

/** Uppercase-label/bold-value tiles — `--sunken` background, matches every stat-tile grid in the
 * mockup (Search Capital, Investor Corner, Deal, Job, Find My Match all use this same tile
 * look, just with different label/value pairs and a 2×2 vs 2-then-1 layout), so this is the one
 * place that renders them. */
export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.wrap}>
      {tiles.map(tile => (
        <View
          key={tile.label}
          style={[styles.tile, tile.fullWidth ? styles.fullWidth : styles.halfWidth, { backgroundColor: colors.surfaceSunken }]}
        >
          <Text style={[fonts.bold, styles.label, { color: colors.ink3 }]}>{tile.label.toUpperCase()}</Text>
          <Text style={[fonts.bold, styles.value, { color: colors.ink }]} numberOfLines={2}>
            {tile.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  halfWidth: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  label: {
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
});
