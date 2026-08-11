import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** My Resources' own header — replaces the app-wide `TopBar` for just this drawer screen (wired
 * via `options.header` on its `Drawer.Screen` in `DrawerNavigator.tsx`), same reasoning/template
 * as `MyEventsHeader.tsx`. Matches `Resources.html`'s header (~line 163) — its back arrow becomes
 * a menu button here (opens the drawer) since this screen is reached via the drawer, not a
 * stack push, same reinterpretation `MyEventsHeader` already made. */
export function ResourcesHeader({
  onMenuPress,
  onContributePress,
}: {
  onMenuPress: () => void;
  onContributePress: () => void;
}) {
  const { colors, fonts, fontSize, borderWidth, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
      <View style={styles.row}>
        <IconButton name="menu" label="Open menu" color={colors.ink} onPress={onMenuPress} />
        <Text style={[fonts.display, styles.title, { color: colors.ink }]} numberOfLines={1}>
          My Resources
        </Text>
        <IconButton name={isDark ? 'sun' : 'moon'} label="Toggle theme" color={colors.ink2} onPress={toggleTheme} chip />
        <Pressable
          onPress={onContributePress}
          accessibilityRole="button"
          accessibilityLabel="Contribute a resource"
          style={({ pressed }) => [styles.contributeButton, { backgroundColor: colors.gold }, pressed && styles.pressed]}
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
    fontSize: 20,
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
