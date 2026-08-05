import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** The header's own content height below the safe-area inset — `row`'s `paddingVertical` (top +
 * bottom) plus the icon buttons' fixed height, matching `styles.row`/`styles.iconButton` below
 * exactly. `EventsCalendarPopover` positions itself off `insets.top + HEADER_CONTENT_HEIGHT`
 * rather than measuring the Calendar button at runtime — this header's height never changes with
 * content, so a fixed constant both files agree on is simpler and doesn't depend on getting
 * `measureInWindow` timing/coordinate-space right. Keep this in sync if `row`/`iconButton` change. */
export const HEADER_CONTENT_HEIGHT = 9 + 9 + 38;

/**
 * My Events' own header — replaces the app-wide `TopBar` for just this drawer screen (wired via
 * `options.header` on its `Drawer.Screen` in `DrawerNavigator.tsx`) since the mockup's header
 * (title + theme + calendar + create) has no logo/bell/avatar, and stacking it below the generic
 * `TopBar` would double up the chrome. Matches `myevents_decoded.html` ~line 160.
 */
export function MyEventsHeader({
  onMenuPress,
  onCalendarPress,
  onCreatePress,
}: {
  onMenuPress: () => void;
  onCalendarPress: () => void;
  onCreatePress: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
      <View style={styles.row}>
        <IconButton name="menu" label="Open menu" color={colors.ink} onPress={onMenuPress} />
        <Text style={[fonts.display, styles.title, { color: colors.ink }]} numberOfLines={1}>
          My Events
        </Text>
        <IconButton name={isDark ? 'sun' : 'moon'} label="Toggle theme" color={colors.ink2} onPress={toggleTheme} chip />
        <IconButton name="calendar" label="Calendar view" color={colors.ink2} onPress={onCalendarPress} chip />
        <Pressable
          onPress={onCreatePress}
          accessibilityRole="button"
          accessibilityLabel="Create event"
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
