import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Open-search-input row — matches `Resources.html`'s search state (~line 200). Swapped in for
 * `ResourceSegmentedTabs` when search is open (mutually exclusive, not layered on top). */
export function ResourceSearchBar({
  value,
  onChangeText,
  onDone,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onDone: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: 13 }]}>
        <Search size={15} color={colors.gold} strokeWidth={1.8} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search resources…"
          placeholderTextColor={colors.ink3}
          autoFocus
          style={[fonts.regular, styles.input, { fontSize: fontSize.body, color: colors.ink }]}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} accessibilityLabel="Clear search" style={[styles.clearButton, { backgroundColor: colors.surfaceSunken }]}>
            <X size={13} color={colors.ink3} strokeWidth={1.9} />
          </Pressable>
        )}
      </View>
      <Pressable onPress={onDone} accessibilityLabel="Done" style={({ pressed }) => [pressed && styles.pressed]}>
        <Text style={[fonts.semibold, styles.doneText, { color: colors.ink2 }]}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.65,
  },
});
