import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAuth } from '../store/AuthContext';
import { Icon, IconName } from '../components/icons/Icon';
import { Avatar } from '../components/Avatar';
import { useMe } from '../hooks/useMe';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import { DRAWER_ITEMS } from './menuConfig';
import type { AppStackParamList } from './types';

/**
 * Side menu contents — header (account avatar/name/role, close button) and item list match the
 * app bar/drawer reference (`TSB Home FV.html`), replacing the earlier logo-header version.
 * Item list itself comes from `menuConfig.ts`'s `DRAWER_ITEMS` (see its doc comment for how it
 * differs from Phase 0's original plan). Sign Out is a fixed footer row below the scrollable
 * list (not a `DRAWER_ITEMS` entry — it's an action, not a navigation destination, and needs its
 * own danger-red styling `MenuRow` doesn't support), same confirm-dialog treatment as the
 * Profile screen's own Sign out row (`ProfileScreen.tsx`) rather than signing out immediately.
 * No footer/upsell card otherwise — not part of the app.
 */

export function DrawerContent({
  onSuggestFeature,
  ...props
}: DrawerContentComponentProps & { onSuggestFeature: () => void }) {
  const { navigation, state } = props;
  const {
    colors,
    fonts,
    fontSize,
    spacing,
    radius,
    borderWidth,
    letterSpacing,
  } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const { logout } = useAuth();
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);

  // `Tabs` is index 0 of the drawer; anything else means a drawer screen is
  // showing and should be highlighted.
  const activeRouteName = state.routeNames[state.index];
  // `getFocusedRouteNameFromRoute` is React Navigation's own utility for exactly this — reading
  // a nested navigator's truly-focused route name. Hand-rolling this by reading `route.state`
  // directly missed React Navigation's internal cached child-state, so it could report a stale
  // tab (always showing whichever tab was active when the drawer content last remounted, not
  // the one actually open) — this utility reads the right, live source instead.
  const activeTabName =
    activeRouteName === 'Tabs'
      ? getFocusedRouteNameFromRoute(state.routes[state.index])
      : undefined;

  const profile = me?.profile as Record<string, unknown> | undefined;
  const roleType = String(profile?.roleType ?? profile?.role_type ?? '').trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            borderBottomColor: colors.borderSoft,
            borderBottomWidth: borderWidth.thin,
          },
        ]}
      >
        <Avatar name={me?.name} imageUri={me?.profileImg} size={44} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={[
              fonts.bold,
              { fontSize: fontSize.subtitle, color: colors.ink },
            ]}
            numberOfLines={1}
          >
            {me?.name || 'Your Account'}
          </Text>
          {!!roleType && (
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: colors.chip,
                  borderRadius: radius.sm,
                  marginTop: spacing.xxs,
                },
              ]}
            >
              <Text
                style={[
                  fonts.bold,
                  {
                    fontSize: fontSize.badge,
                    color: colors.goldDark,
                    letterSpacing: letterSpacing.wide,
                  },
                ]}
              >
                {roleType.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => navigation.closeDrawer()}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          hitSlop={8}
          style={styles.closeButton}
        >
          <Icon name="close" size={14} color={colors.ink3} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          gap: 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        {DRAWER_ITEMS.map(item => {
          if (item.kind === 'divider') return null;

          if (item.kind === 'tab') {
            return (
              <MenuRow
                key={item.name}
                label={item.label}
                icon={item.icon}
                isActive={activeTabName === item.name}
                onPress={() => {
                  navigation.navigate('Tabs', { screen: item.name });
                  navigation.closeDrawer();
                }}
              />
            );
          }

          if (item.kind === 'stackScreen') {
            return (
              <MenuRow
                key={item.name}
                label={item.label}
                icon={item.icon}
                isActive={false}
                onPress={() => {
                  navigation
                    .getParent<NativeStackNavigationProp<AppStackParamList>>()
                    ?.navigate(item.name);
                  navigation.closeDrawer();
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

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: spacing.sm,
            borderTopColor: colors.borderSoft,
            borderTopWidth: borderWidth.thin,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            navigation.closeDrawer();
            onSuggestFeature();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.cream : 'transparent' },
          ]}
        >
          <Icon name="lightbulb" size={21} color={colors.goldDark} />
          <Text
            style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}
            numberOfLines={1}
          >
            Suggest a Feature
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSignOutConfirmOpen(true)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.cream : 'transparent' },
          ]}
        >
          <LogOut size={21} color={colors.danger} strokeWidth={1.8} />
          <Text
            style={[
              fonts.bold,
              { fontSize: fontSize.ui, color: colors.danger },
            ]}
            numberOfLines={1}
          >
            Sign out
          </Text>
        </Pressable>
      </View>

      <View style={{ height: insets.bottom }} />

      <ConfirmDialog
        visible={signOutConfirmOpen}
        title="Sign out?"
        message="You'll need to sign in again to access your account."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setSignOutConfirmOpen(false);
          navigation.closeDrawer();
          logout();
        }}
        onCancel={() => setSignOutConfirmOpen(false)}
      />
    </View>
  );
}

function MenuRow({
  label,
  icon,
  isActive = false,
  onPress,
}: {
  label: string;
  icon: IconName;
  isActive?: boolean;
  onPress: () => void;
}) {
  const { colors, textStyles } = useTheme();

  // Row chrome (padding/radius/gap/active background) matches the app bar/drawer reference
  // (`TSB Home FV.html`) exactly: `padding:11px 12px;border-radius:12px;gap:13px`, active
  // background `var(--chip)` (`colors.chip`), icon colour `var(--goldd)` (`colors.goldDark`) —
  // same treatment in both light and dark mode, no left-bar/dark-mode-specific variant.
  const backgroundColor = isActive ? colors.chip : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor:
            pressed && !isActive ? colors.cream : backgroundColor,
        },
      ]}
    >
      <Icon name={icon} size={21} color={colors.goldDark} />
      <Text
        style={[
          isActive ? textStyles.navItemActive : textStyles.navItem,
          { color: colors.ink },
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  footer: {
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
});
