import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * `$min – $max` field pair for Role Thesis money fields (Business Preferred Revenue/EBITDA,
 * Typical Deal Size) — matches the mockup's exact markup (decoded
 * `profilelast_decoded_role.html:3186-3213`): a `$`-prefixed box each side of a "to" label. Values
 * stay free-text strings (no numeric keyboard forced, matching the mockup's plain `<input>` and
 * `IntermediaryThesis`'s own string typing) — parsed to a number only right before a PUT.
 */
export function ThesisRangeInput({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder: string;
  maxPlaceholder: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.box, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
        <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
        <TextInput
          value={minValue}
          onChangeText={onMinChange}
          placeholder={minPlaceholder}
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.ink }]}
        />
      </View>
      <Text style={[styles.to, { color: colors.ink3 }]}>to</Text>
      <View style={[styles.box, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
        <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
        <TextInput
          value={maxValue}
          onChangeText={onMaxChange}
          placeholder={maxPlaceholder}
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.ink }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', height: 42, paddingHorizontal: 12, borderWidth: 1, borderRadius: 11 },
  dollar: { fontSize: 12.5, marginRight: 4 },
  input: { flex: 1, minWidth: 0, fontSize: 12.5, padding: 0 },
  to: { fontSize: 11.5 },
});
