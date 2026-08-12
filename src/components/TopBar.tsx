import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Icon } from './icons/Icon';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

/**
 * Top bar — Phase 0 item 3, "Top bar: Logo, notification bell, profile picture".
 *
 * Layout follows `webSrc/src/components/DashboardNavbar.tsx`: logo left; theme
 * toggle, bell with unread badge, then avatar on the right. The web keeps its
 * hamburger last, but on a phone the drawer button belongs on the leading edge,
 * so it sits before the logo here.
 */

type TopBarProps = {
  onMenuPress: () => void;
  onBellPress: () => void;
  onAvatarPress: () => void;
  /** 0 hides the badge. Wired to the real endpoint in Phase 6. */
  unreadCount?: number;
  userName?: string | null;
  profileImageUri?: string | null;
  /** Hides the trailing avatar — used on the Home tab, where it would just open the Profile tab
   * that's already reachable from the bottom bar. */
  showAvatar?: boolean;
  /** Swaps the leading button from the drawer hamburger to a back arrow (`onMenuPress` still
   * fires, just meaning "go back" instead of "open drawer" — the caller decides which). Needed by
   * `ProfileScreen`, which renders its own `TopBar` in two different navigator contexts: as the
   * Profile tab (a drawer sibling exists, hamburger opens it) and as a direct stack push from the
   * shared `TopBar`'s own avatar button (no drawer in that context, so a back arrow is correct
   * instead — see `ProfileScreen`'s own doc comment). */
  backMode?: boolean;
};

export function TopBar({
  onMenuPress,
  onBellPress,
  onAvatarPress,
  unreadCount = 0,
  userName,
  profileImageUri,
  showAvatar = true,
  backMode = false,
}: TopBarProps) {
  const { colors, fonts, sizes, spacing, borderWidth, isDark, toggleTheme } =
    useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSoft,
          borderBottomWidth: borderWidth.thin,
        },
      ]}
    >
      <View style={[styles.bar, { height: sizes.topBar }]}>
        <View style={styles.leading}>
          {backMode ? (
            <Pressable
              onPress={onMenuPress}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [
                styles.iconButton,
                { width: sizes.iconButton, height: sizes.iconButton, backgroundColor: pressed ? colors.cream : 'transparent' },
              ]}
            >
              <ChevronLeft size={22} color={colors.ink2} strokeWidth={1.8} />
            </Pressable>
          ) : (
            <IconButton
              name="menu"
              accessibilityLabel="Open menu"
              onPress={onMenuPress}
              color={colors.ink2}
              chip={false}
            />
          )}
          <View style={{ marginLeft: spacing.xs }}>
            <Logo size="small" showTagline />
          </View>
        </View>

        <View style={styles.trailing}>
          <IconButton
            name={isDark ? 'sun' : 'moon'}
            accessibilityLabel={
              isDark ? 'Switch to light mode' : 'Switch to dark mode'
            }
            onPress={toggleTheme}
            color={colors.ink3}
            chip
          />

          <View>
            <IconButton
              name="bell"
              accessibilityLabel={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : 'Notifications'
              }
              onPress={onBellPress}
              color={colors.ink3}
              chip
            />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.gold,
                    borderColor: colors.surface,
                  },
                ]}
                // The count is already announced by the bell's label.
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Text
                  style={[
                    fonts.bold,
                    styles.badgeText,
                    { color: colors.onGold },
                  ]}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>

          {showAvatar && (
            <Pressable
              onPress={onAvatarPress}
              accessibilityRole="button"
              accessibilityLabel="Profile menu"
              hitSlop={4}
            >
              <Avatar
                name={userName}
                imageUri={profileImageUri}
                size={sizes.avatar}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function IconButton({
  name,
  onPress,
  color,
  accessibilityLabel,
  chip = false,
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
  color: string;
  accessibilityLabel: string;
  /** Persistent light rounded-square background + border, matching the app bar reference's
   * theme-toggle/bell buttons — the menu button stays bare (background only on press) since
   * the reference shows it without any button chrome. */
  chip?: boolean;
}) {
  const { colors, sizes, radius, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: sizes.iconButton,
          height: sizes.iconButton,
          borderRadius: chip ? 12 : radius.pill,
          borderWidth: chip ? borderWidth.thin : 0,
          borderColor: colors.border,
          backgroundColor: chip
            ? pressed
              ? colors.cream
              : colors.surfaceSunken
            : pressed
            ? colors.cream
            : 'transparent',
        },
      ]}
    >
      <Icon name={name} size={chip ? 19 : 21} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
});
