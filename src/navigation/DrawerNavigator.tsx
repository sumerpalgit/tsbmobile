import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { TopBar } from '../components/TopBar';
import { createPlaceholderScreen } from '../screens/PlaceholderScreen';
import { EtaChaptersScreen, MyEventsScreen } from '../screens';
import MainNavigator from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { AppStackParamList, DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

/**
 * Side menu wrapping the bottom tabs.
 *
 * One `TopBar` is installed as the drawer's header, so it stays put across both
 * tab switches and drawer navigations — matching the website, where
 * `DashboardNavbar` sits above the whole dashboard shell.
 */

const SCREENS: Record<
  keyof Omit<DrawerParamList, 'Tabs'>,
  React.ComponentType
> = {
  EtaChapters: EtaChaptersScreen,
  MyMatches: createPlaceholderScreen({
    title: 'My Matches',
    icon: 'matches',
    phase: 'Phase 5',
  }),
  MyEvents: MyEventsScreen,
  AiToolkit: createPlaceholderScreen({
    title: 'AI Toolkit',
    icon: 'toolkit',
    phase: 'Phase 7',
  }),
  Settings: createPlaceholderScreen({
    title: 'Settings',
    icon: 'settings',
    phase: 'Phase 7',
  }),
};

function DrawerNavigator() {
  const { colors, sizes } = useTheme();
  // The drawer sits inside AppStack, so Notifications and Profile are reached
  // through the parent stack rather than the drawer itself.
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <Drawer.Navigator
      drawerContent={props => <DrawerContent {...props} />}
      screenOptions={({ navigation, route }) => {
        // `route` is the focused `Tabs` drawer route while a bottom tab is showing — read the
        // nested tab name the same way `DrawerContent` does, so the avatar (which just opens the
        // Profile tab) can hide itself while already on that tab. Defaults to 'Home' (the first
        // tab) since `getFocusedRouteNameFromRoute` returns undefined before any nested
        // navigation has happened yet.
        const focusedTabName =
          route.name === 'Tabs' ? getFocusedRouteNameFromRoute(route) ?? 'Home' : undefined;

        return {
          drawerType: 'front',
          drawerStyle: {
            width: sizes.drawerWidth,
            backgroundColor: colors.surface,
          },
          sceneStyle: { backgroundColor: colors.pageBg },
          overlayColor: 'rgba(0,0,0,0.4)',
          // AI Assist and Messages each render their own header (`AiHeader`/`MessagesHeader`,
          // matching their own mockups) instead of the generic `TopBar` above. Unlike My Events
          // (a drawer screen, so it can set `headerShown: false` per `Drawer.Screen`), both are
          // *bottom tabs* nested inside the single `Tabs` screen that owns this shared header.
          //
          // `headerShown: focusedTabName !== 'AiAssist'` alone does NOT hide it here — on-device
          // testing showed the shared `TopBar` still rendering (stacked above `AiHeader`) even
          // though `focusedTabName` was correctly 'AiAssist' in that same render (proven by
          // `showAvatar` below reacting correctly in the very same options object). Whatever the
          // cause — `@react-navigation/drawer` v7 apparently doesn't re-derive the header's
          // reserved layout slot from a nested tab's focus change, even though it does re-invoke
          // `header:`'s render function — returning `null` from `header:` itself is what actually
          // works, so that's the guard here instead of `headerShown`. Same treatment extended to
          // `'Messages'` without re-testing the `headerShown` route again — no reason to expect
          // a different navigator behavior for a second tab making the identical request.
          header: () => (focusedTabName === 'AiAssist' || focusedTabName === 'Messages' ? null : (
            <TopBar
              onMenuPress={() => navigation.openDrawer()}
              onBellPress={() => stackNavigation.navigate('Notifications')}
              onAvatarPress={() => stackNavigation.navigate('Profile')}
              showAvatar={focusedTabName !== 'Home'}
            />
          )),
        };
      }}
    >
      <Drawer.Screen name="Tabs" component={MainNavigator} />
      {(
        Object.keys(SCREENS) as Array<keyof Omit<DrawerParamList, 'Tabs'>>
      ).map(name => (
        <Drawer.Screen
          key={name}
          name={name}
          component={SCREENS[name]}
          // My Events and ETA Chapters each render their own header (`MyEventsHeader`/
          // `EtaChaptersHeader`, matching their own mockups) instead of the generic `TopBar`
          // above, so they own `openDrawer()`/screen-specific actions without a cross-component
          // bridge — same reasoning as `MyEvents`, and no `focusedTabName` workaround needed
          // since both are plain `Drawer.Screen`s, not nested inside the `Tabs` screen the way
          // AI Assist/Messages are.
          options={name === 'MyEvents' || name === 'EtaChapters' ? { headerShown: false } : undefined}
        />
      ))}
    </Drawer.Navigator>
  );
}

export default DrawerNavigator;
