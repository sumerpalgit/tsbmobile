import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

/**
 * Solid gold CTA button with a built-in loading-label swap — currently used
 * by `LoginScreen`/`SignupScreen`'s "Login"/"Create account" buttons, but not
 * auth-specific itself, so it lives here rather than in `screens/auth/authShared.tsx`
 * for any future screen to reuse.
 */

type PrimaryButtonProps = {
  label: string;
  /** Shown instead of `label` while `loading` is true. */
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Design defaults this to Login/Signup's `.01em` (`0.15`) — Forgot Password's CTAs specify no letter-spacing, so pass `0` there. */
  letterSpacing?: number;
  onPress: () => void;
};

export function PrimaryButton({
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  letterSpacing = 0.15,
  onPress,
}: PrimaryButtonProps) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? colors.goldDark : colors.gold,
          opacity: loading || disabled ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[fonts.bold, { fontSize: fontSize.authSubmit, color: colors.onAccent, letterSpacing }]}>
        {loading ? loadingLabel ?? label : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
