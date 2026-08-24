import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Field label wrapper for Role Thesis edit sheets — matches the mockup's uppercase field-label
 * style exactly (e.g. decoded `profilelast_decoded_role.html:3368`: 10px/700/uppercase/
 * letter-spacing .08em, `--ink2`, red `*` when required).
 */
export function ThesisField({
  label,
  required,
  style,
  /** Reserves height for this many label lines so two side-by-side fields whose labels wrap
   * differently (e.g. "Deals closed" vs "Total deal value facilitated") still line their inputs
   * up on the same row — `alignItems: 'flex-end'` on the row doesn't work here specifically
   * because the input isn't the last element in the column (a hint line follows it below), so the
   * fix has to happen at the label instead. Omit for the common case (input is the column's last
   * element) — those align correctly by giving the ROW itself `alignItems: 'flex-end'` instead,
   * no reservation needed. */
  labelLines,
  children,
}: {
  label: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  labelLines?: number;
  children: React.ReactNode;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text style={[fonts.bold, styles.label, labelLines != null && { minHeight: labelLines * 13 }, { color: colors.ink2 }]}>
        {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
});
