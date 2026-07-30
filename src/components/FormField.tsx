import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme';

/**
 * Labeled text field with a leading icon, error state, and an optional
 * trailing element (e.g. a password eye-toggle) or footer (e.g. a
 * password-strength meter) — used by `LoginScreen`/`SignupScreen`'s email,
 * password, full-name and confirm-password fields. Wraps a plain
 * `TextInput`; screens keep owning their `react-hook-form` `Controller`/
 * validation and just pass the field's `value`/`onChangeText`/`onBlur`
 * through like any other `TextInput` prop.
 */

type FormFieldProps = Omit<TextInputProps, 'placeholderTextColor'> & {
  label: string;
  icon: React.ReactNode;
  /** Element next to the label, e.g. a "Forgot password?" link. */
  labelRight?: React.ReactNode;
  /** Trailing element inside the field, e.g. a password eye-toggle button. */
  rightElement?: React.ReactNode;
  error?: string;
  /** Shown below the field instead of `error` when there's no error — e.g. a password-strength meter. */
  footer?: React.ReactNode;
};

export function FormField({
  label,
  icon,
  labelRight,
  rightElement,
  error,
  footer,
  ...inputProps
}: FormFieldProps) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>{label}</Text>
        {labelRight}
      </View>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.authField,
            borderColor: error ? colors.authFieldBorderError : colors.authFieldBorder,
            borderWidth: borderWidth.thin,
          },
        ]}
      >
        {icon}
        <TextInput
          style={[fonts.regular, styles.input, { color: colors.ink, fontSize: fontSize.ui }]}
          placeholderTextColor={colors.authMuted}
          {...inputProps}
        />
        {rightElement}
      </View>
      {error ? (
        <Text style={[fonts.regular, styles.fieldError, { color: colors.authErrorText }]}>{error}</Text>
      ) : (
        footer
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 13,
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 0,
    height: '100%',
  },
  fieldError: {
    fontSize: 11.5,
    marginTop: 5,
  },
});
