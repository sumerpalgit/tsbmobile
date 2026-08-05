import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** Per-tab empty state — icon, title, hint, CTA. Modeled on `EtaEmptyState.tsx`'s dashed-border
 * card pattern but using the general (non-onboarding) theme tokens and adding a CTA button,
 * matching the mockup's `isEmpty` block (`myevents_decoded.html` ~line 305). */
export function EventsEmptyState({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconBadge, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
        <Icon name="calendar" size={22} color={colors.ink3} strokeWidth={1.4} />
      </View>
      <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>
      <Text style={[fonts.regular, styles.hint, { fontSize: fontSize.body, color: colors.ink2 }]}>{hint}</Text>
      {!!actionLabel && !!onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.action, { backgroundColor: colors.accentSolid, borderRadius: radius.lg }, pressed && styles.pressed]}
        >
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.onAccent }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 24,
  },
  iconBadge: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    marginTop: 15,
  },
  hint: {
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 240,
  },
  action: {
    height: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  pressed: {
    opacity: 0.65,
  },
});
