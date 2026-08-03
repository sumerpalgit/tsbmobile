import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
};

export function TopBar({
  onMenuPress,
  onBellPress,
  onAvatarPress,
  unreadCount = 0,
  userName,
  profileImageUri,
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
          <IconButton
            name="menu"
            accessibilityLabel="Open menu"
            onPress={onMenuPress}
            color={colors.ink2}
          />
          <View style={{ marginLeft: spacing.xs }}>
            <Logo size="small" />
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
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
  color: string;
  accessibilityLabel: string;
}) {
  const { colors, sizes, radius } = useTheme();

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
          borderRadius: radius.pill,
          backgroundColor: pressed ? colors.cream : 'transparent',
        },
      ]}
    >
      <Icon name={name} size={20} color={color} />
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
