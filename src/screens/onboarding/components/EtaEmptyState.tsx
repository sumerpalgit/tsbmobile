import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** Shown in place of the "Suggested ETAs" list when a search matches nothing — also what a real
 * "get ETA Chapters" API returning an empty result set renders into, once that's wired up. */
export function EtaEmptyState() {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
      <SearchX size={20} color={colors.obInk3} strokeWidth={1.6} />
      <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.obInk }]}>No chapters found</Text>
      <Text style={[fonts.regular, styles.subtitle, { color: colors.obInk3 }]}>
        Try a different city or search term.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
});
