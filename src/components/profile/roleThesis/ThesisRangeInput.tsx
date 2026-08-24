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
/** Memoized — see `ThesisPillRow`'s own doc comment on why (sheets with several of these mounted
 * side by side, e.g. Lending Criteria's revenue/EBITDA/deal-size trio, would otherwise all
 * re-render on every keystroke in an unrelated field in the same sheet). Callers should pass their
 * `onMinChange`/`onMaxChange` as direct state-setter references (e.g. `onMinChange={setMinRevenue}`)
 * rather than a fresh inline arrow each render, or this memoization has nothing to bail out on. */
export const ThesisRangeInput = React.memo(function ThesisRangeInputImpl({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
  /** Lender's Interest Rate Range reuses this same component for a percentage, not currency — web
   * itself has this exact quirk (its own `RangeInput` is hardcoded `$`-only, reused as-is for a %
   * field). Rather than replicate the visual mismatch, this exposes the leading glyph so a
   * percentage caller can pass `prefix=""` and rely on `suffix="%"` instead. */
  prefix = '$',
  suffix = '',
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder: string;
  maxPlaceholder: string;
  prefix?: string;
  suffix?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.box, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
        {!!prefix && <Text style={[styles.dollar, { color: colors.ink3 }]}>{prefix}</Text>}
        <TextInput
          value={minValue}
          onChangeText={onMinChange}
          placeholder={minPlaceholder}
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.ink }]}
        />
        {!!suffix && <Text style={[styles.suffix, { color: colors.ink3 }]}>{suffix}</Text>}
      </View>
      <Text style={[styles.to, { color: colors.ink3 }]}>to</Text>
      <View style={[styles.box, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
        {!!prefix && <Text style={[styles.dollar, { color: colors.ink3 }]}>{prefix}</Text>}
        <TextInput
          value={maxValue}
          onChangeText={onMaxChange}
          placeholder={maxPlaceholder}
          placeholderTextColor={colors.ink3}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.ink }]}
        />
        {!!suffix && <Text style={[styles.suffix, { color: colors.ink3 }]}>{suffix}</Text>}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', height: 42, paddingHorizontal: 12, borderWidth: 1, borderRadius: 11 },
  dollar: { fontSize: 12.5, marginRight: 4 },
  suffix: { fontSize: 12.5, marginLeft: 4 },
  input: { flex: 1, minWidth: 0, fontSize: 12.5, padding: 0 },
  to: { fontSize: 11.5 },
});
