import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** Directory's own header — replaces the shared `TopBar` for this bottom tab (wired via
 * `focusedTabName === 'Directory'` in `DrawerNavigator.tsx`'s header guard, same treatment as
 * AI Assist/Messages/Profile), per a new reference screenshot: menu, serif "The TSB community"
 * title, theme toggle, and a saved-members bookmark button with an unread-style count badge.
 * Replaces the old `DirectoryHero.tsx` gradient card entirely — the total member count that card
 * showed is dropped since it's already visible on the "All roles" chip in `RoleTypeChipsRow`. */
export function DirectoryHeader({
  onMenuPress,
  savedCount,
  showingSaved,
  onToggleSaved,
}: {
  onMenuPress: () => void;
  savedCount: number;
  showingSaved: boolean;
  onToggleSaved: () => void;
}) {
  const { colors, fonts, borderWidth, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
      <View style={styles.row}>
        <IconButton name="menu" label="Open menu" color={colors.ink} onPress={onMenuPress} />
        <Text style={[fonts.display, styles.title, { color: colors.ink }]} numberOfLines={1}>
          The TSB community
        </Text>
        <IconButton name={isDark ? 'sun' : 'moon'} label="Toggle theme" color={colors.ink2} onPress={toggleTheme} chip />
        <Pressable
          onPress={onToggleSaved}
          accessibilityRole="button"
          accessibilityLabel="Saved members"
          style={({ pressed }) => [
            styles.saveButton,
            showingSaved ? { backgroundColor: colors.gold, borderColor: colors.gold } : { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin },
            pressed && styles.pressed,
          ]}
        >
          <Bookmark size={19} color={showingSaved ? '#fff' : colors.ink2} fill={showingSaved ? '#fff' : 'transparent'} strokeWidth={1.8} />
          {savedCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.gold, borderColor: colors.surface }]}>
              <Text style={[fonts.bold, styles.badgeText, { color: '#fff' }]}>{savedCount > 9 ? '9+' : savedCount}</Text>
            </View>
          )}
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
    fontSize: 19,
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9.5,
  },
  pressed: {
    opacity: 0.65,
  },
});
