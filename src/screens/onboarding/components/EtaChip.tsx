import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** Removable pill for one selected ETA chapter, in the "Selected Cities" row of Step 2. */
export function EtaChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <Pressable
      onPress={onRemove}
      style={[styles.chip, { backgroundColor: colors.obChip, borderColor: colors.obGoldLight }]}
    >
      <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.obGold }]}>{name}</Text>
      <X size={8} color={colors.obGold} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
