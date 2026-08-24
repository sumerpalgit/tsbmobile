import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Toggle-pill row for Role Thesis edit sheets — matches the mockup's `spChip`/single-select chip
 * style exactly (decoded `profilelast_decoded_role.html:4342-4343`): active = filled `--fill`
 * (`colors.hero1`) pill with white bold text, inactive = outlined `--surf2`/`--line2`
 * (`colors.authField`/`colors.authFieldBorder`) pill with `ink2` semibold text. Presentational
 * only — `selected` is an array so ONE component covers both single-select (caller's `onToggle`
 * replaces the whole array with `[option]`) and multi-select (caller's `onToggle` adds/removes
 * from the array) callers, matching how the mockup itself reuses the same chip look for both
 * shapes across its 5 edit sheets.
 */
export function ThesisPillRow({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.row}>
      {options.map(option => {
        const active = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => onToggle(option)}
            style={[
              styles.pill,
              active
                ? { backgroundColor: colors.hero1, borderColor: colors.hero1 }
                : { backgroundColor: colors.authField, borderColor: colors.authFieldBorder },
            ]}
          >
            <Text style={[active ? fonts.bold : fonts.semibold, styles.label, { color: active ? '#fff' : colors.ink2 }]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { height: 38, paddingHorizontal: 15, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12.5 },
});
