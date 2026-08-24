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
  children,
}: {
  label: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.field, style]}>
      <Text style={[fonts.bold, styles.label, { color: colors.ink2 }]}>
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
