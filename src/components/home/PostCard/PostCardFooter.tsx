import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Icon, IconName } from '../../icons/Icon';

/**
 * The bottom CTA area — two shapes seen across the mockup's card examples: a single full-width
 * gold button (ATC's "Answer") when there's no `secondary`, or a side-by-side pair — outlined
 * "View Details"/"Details" + a gold primary with a trailing icon (Find My Match's "View
 * Details" + "Express Interest", most other types' "Details" + "Apply Now"/"Request CIM"/...) —
 * when there is. One component for both instead of two near-duplicates.
 */
export function PostCardFooter({
  primaryLabel,
  primaryIcon,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: {
  primaryLabel: string;
  primaryIcon: IconName;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}) {
  const { colors, fonts, elevation } = useTheme();

  return (
    <View style={styles.row}>
      {secondaryLabel && (
        <Pressable
          onPress={onSecondaryPress}
          accessibilityRole="button"
          style={[styles.button, styles.secondary, { backgroundColor: colors.surfaceSunken, borderColor: colors.feedCardLine }]}
        >
          <Text style={[fonts.semibold, styles.label, { color: colors.ink2 }]}>{secondaryLabel}</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onPrimaryPress}
        accessibilityRole="button"
        style={[styles.button, styles.primary, { backgroundColor: colors.gold }, elevation('md')]}
      >
        <Icon name={primaryIcon} size={14} color="#fff" />
        <Text style={[fonts.bold, styles.label, { color: '#fff' }]}>{primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondary: {
    borderWidth: 1,
  },
  primary: {
    flex: 1.3,
  },
  label: {
    fontSize: 13.5,
  },
});
