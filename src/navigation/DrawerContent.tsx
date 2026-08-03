import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Icon, IconName } from '../components/icons/Icon';
import { Logo } from '../components/Logo';
import { useAuth } from '../store/AuthContext';
import { DRAWER_ITEMS } from './menuConfig';

/**
 * Side menu contents.
 *
 * Styling follows the website sidebar (`webSrc/src/app/dashboard/layout.tsx`):
 * gold icon, 10px-radius rows, hairline dividers between groups, and the
 * account actions pinned to the bottom.
 *
 * Active row treatment matches `globals.css`:
 *   light → solid navy fill, white label
 *   dark  → translucent gold wash with a 3px gold leading bar
 * The web uses a horizontal gradient for the dark wash; a flat tint is used
 * here to avoid pulling in a gradient dependency for one surface.
 */

export function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation, state } = props;
  const { colors, spacing, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  // `Tabs` is index 0 of the drawer; anything else means a drawer screen is
  // showing and should be highlighted.
  const activeRouteName = state.routeNames[state.index];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: spacing.lg,
            borderBottomColor: colors.borderSoft,
            borderBottomWidth: borderWidth.thin,
          },
        ]}
      >
        <Logo size="medium" showTagline />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        {DRAWER_ITEMS.map((item, index) => {
          if (item.kind === 'divider') {
            return (
              <View
                key={`divider-${index}`}
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.creamBorderBold,
                    marginVertical: spacing.sm,
                    marginHorizontal: spacing.lg,
                  },
                ]}
              />
            );
          }

          if (item.kind === 'action') {
            return (
              <MenuRow
                key="signOut"
                label={item.label}
                icon={item.icon}
                tone="danger"
                onPress={() => {
                  navigation.closeDrawer();
                  logout();
                }}
              />
            );
          }

          return (
            <MenuRow
              key={item.name}
              label={item.label}
              icon={item.icon}
              isActive={activeRouteName === item.name}
              onPress={() => navigation.navigate(item.name)}
            />
          );
        })}
      </ScrollView>

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

function MenuRow({
  label,
  icon,
  isActive = false,
  tone = 'default',
  onPress,
}: {
  label: string;
  icon: IconName;
  isActive?: boolean;
  tone?: 'default' | 'danger';
  onPress: () => void;
}) {
  const { colors, textStyles, radius, spacing, isDark } = useTheme();

  const isDanger = tone === 'danger';

  const backgroundColor = isActive
    ? isDark
      ? 'rgba(201,168,76,0.14)'
      : colors.accentSolid
    : 'transparent';

  const labelColor = isDanger
    ? colors.danger
    : isActive
    ? isDark
      ? colors.goldLight
      : colors.onAccent
    : colors.ink;

  const iconColor = isDanger
    ? colors.danger
    : isActive
    ? isDark
      ? colors.goldLight
      : colors.goldLight
    : colors.gold;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.row,
        {
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor:
            pressed && !isActive
              ? isDanger
                ? colors.dangerSurface
                : colors.cream
              : backgroundColor,
        },
      ]}
    >
      {/* Dark-mode active rows get the gold leading bar from globals.css. */}
      {isActive && isDark && (
        <View style={[styles.activeBar, { backgroundColor: colors.gold }]} />
      )}

      <Icon name={icon} size={20} color={iconColor} />
      <Text
        style={[
          isActive ? textStyles.navItemActive : textStyles.navItem,
          { color: labelColor, marginLeft: spacing.lg },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
