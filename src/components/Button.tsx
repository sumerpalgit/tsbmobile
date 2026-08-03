import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './icons/Icon';

/**
 * Variant button with an optional leading icon — matches the app bar/drawer/home reference
 * (`TSB Home FV.html`)'s Filters panel footer ("Clear" / "Apply") exactly. Distinct from
 * `PrimaryButton` (a fixed-height, label-only, full-bleed auth CTA) since this needs an icon
 * slot and both a full-width and an auto-width mode — generic so any screen needing a
 * primary/secondary button pair with icons can reuse it instead of building its own.
 */
export function Button({
  label,
  icon,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  onPress,
}: {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'secondary';
  /** Fills its container's width instead of sizing to content. */
  fullWidth?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors, fonts, fontSize, borderWidth, elevation } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        {
          borderWidth: isPrimary ? 0 : borderWidth.thin,
          borderColor: colors.border,
          backgroundColor: isPrimary ? colors.gold : colors.surface,
          opacity: disabled ? 0.5 : 1,
        },
        isPrimary && elevation('sm'),
      ]}
    >
      {icon && (
        <Icon name={icon} size={13} color={isPrimary ? colors.onGold : colors.ink2} strokeWidth={1.7} />
      )}
      <Text
        style={[
          isPrimary ? fonts.bold : fonts.semibold,
          {
            fontSize: isPrimary ? fontSize.subtitle : fontSize.body,
            color: isPrimary ? colors.onGold : colors.ink2,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  fullWidth: {
    flex: 1,
  },
});
