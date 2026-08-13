import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Settings index row — icon-chip + title + subtitle + chevron, modeled directly on
 * `ProfileMenuList.tsx`'s own row. Takes a `lucide-react-native` icon component directly rather
 * than the shared `IconName` union (that union is reserved for chrome reused across the tab
 * bar/drawer, not one-off per-screen icons — `ProfileMenuList.tsx` already sets this precedent).
 */
export function SettingsListRow({
  Icon,
  title,
  subtitle,
  onPress,
  last = false,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  onPress: () => void;
  /** Suppresses the bottom border for the last row in a grouped card. */
  last?: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWell, { borderRadius: radius.md, backgroundColor: colors.chip }]}>
        <Icon size={18} color={colors.goldDark} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={15} color={colors.ink3} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
