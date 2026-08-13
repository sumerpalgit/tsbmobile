import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** ETA Chapters' own header — replaces the app-wide `TopBar` for this drawer screen, same
 * reasoning as `MyEventsHeader.tsx` (the mockup's header has no logo/bell/avatar). Matches
 * `ETAChapters_decoded.html`'s header row (~line 162), minus the "Manage memberships" star
 * button — removed per explicit request; that action is still reachable via
 * `PrimaryMembershipsBanner`'s own "Manage" button on the dashboard, so nothing is stranded. */
export function EtaChaptersHeader({
  onMenuPress,
  onAddPress,
}: {
  onMenuPress: () => void;
  onAddPress: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
      ]}
    >
      <View style={styles.row}>
        <IconButton name="menu" label="Open menu" color={colors.ink} onPress={onMenuPress} />
        <Text style={[fonts.display, styles.title, { color: colors.ink }]} numberOfLines={1}>
          ETA Chapters
        </Text>
        <IconButton name={isDark ? 'sun' : 'moon'} label="Toggle theme" color={colors.ink2} onPress={toggleTheme} chip />
        <Pressable
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel="Add chapter"
          style={({ pressed }) => [styles.createButton, { backgroundColor: colors.gold, borderRadius: radius.md }, pressed && styles.pressed]}
        >
          <Text style={[fonts.bold, styles.plusGlyph, { fontSize: fontSize.h3, color: '#fff' }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function IconButton({
  name,
  label,
  color,
  onPress,
  chip = false,
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  label: string;
  color: string;
  onPress: () => void;
  chip?: boolean;
}) {
  const { colors, radius, borderWidth } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { borderRadius: radius.md },
        chip && { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={name} size={19} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusGlyph: {
    marginTop: -2,
  },
  pressed: {
    opacity: 0.65,
  },
});
