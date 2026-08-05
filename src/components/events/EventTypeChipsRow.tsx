import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme';

/** Horizontal scroll "All types" + per-type chip row above the list, filtered to types actually
 * present in the current tab — matches the mockup's `typeChips` (`myevents_decoded.html`
 * ~line 1230), a solid-fill selected state (`--fill`) rather than `Pill`'s gold-outline one, so
 * built bespoke instead of reusing `Pill` directly. */
export function EventTypeChipsRow({
  types,
  selected,
  onSelect,
}: {
  types: string[];
  selected: string | null;
  onSelect: (type: string | null) => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();

  const chip = (label: string, active: boolean, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderRadius: radius.lg, borderWidth: borderWidth.thin },
        active
          ? { backgroundColor: colors.accentSolid, borderColor: colors.accentSolid }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[fonts.semibold, styles.label, { color: active ? colors.onAccent : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chip('All types', selected === null, () => onSelect(null), 'all')}
      {types.map(type => chip(type, selected === type, () => onSelect(type), type))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 10,
  },
  chip: {
    height: 32,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});
