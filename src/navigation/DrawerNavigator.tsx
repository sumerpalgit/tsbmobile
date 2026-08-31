import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  getFocusedRouteNameFromRoute,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { TopBar } from '../components/TopBar';
import { useMe } from '../hooks/useMe';
import { useNotificationsUnreadCount } from '../hooks/useNotifications';
import { createPlaceholderScreen } from '../screens/PlaceholderScreen';
import {
  EtaChaptersScreen,
  MyActivitiesScreen,
  MyEventsScreen,
  MyResourcesScreen,
} from '../screens';
import MainNavigator from './MainNavigator';
import { DrawerContent } from './DrawerContent';
import { SuggestFeatureSheet } from '../components/SuggestFeatureSheet';
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
  MyActivities: MyActivitiesScreen,
  MyEvents: MyEventsScreen,
  MyResources: MyResourcesScreen,
};

function DrawerNavigator() {
  const { colors, sizes } = useTheme();
  // The drawer sits inside AppStack, so Notifications and Profile are reached
  // through the parent stack rather than the drawer itself.
  const stackNavigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  // Same source `ProfileScreen`/`DrawerContent` already use for the real logged-in user's photo —
  // this TopBar's own avatar was rendering the generic "U" fallback instead of it (never wired).
  const { data: me } = useMe();
  const { data: unreadCount } = useNotificationsUnreadCount();
  // Owned here rather than inside `DrawerContent`: opening the sheet closes the drawer, and a
  // `Modal` rendered from the drawer's own (now hidden) content subtree is unreliable ground.
  // This navigator stays mounted across both, so the sheet does too.
  const [suggestOpen, setSuggestOpen] = useState(false);

  return (
    <>
      <Drawer.Navigator
        drawerContent={props => (
          <DrawerContent
            {...props}
            onSuggestFeature={() => setSuggestOpen(true)}
          />
        )}
        screenOptions={({ navigation, route }) => {
          // `route` is the focused `Tabs` drawer route while a bottom tab is showing — read the
          // nested tab name the same way `DrawerContent` does, so the avatar (which just opens the
          // Profile tab) can hide itself while already on that tab. Defaults to 'Home' (the first
          // tab) since `getFocusedRouteNameFromRoute` returns undefined before any nested
          // navigation has happened yet.
          const focusedTabName =
            route.name === 'Tabs'
              ? getFocusedRouteNameFromRoute(route) ?? 'Home'
              : undefined;

          return {
            drawerType: 'front',
            drawerStyle: {
              width: sizes.drawerWidth,
              backgroundColor: colors.surface,
            },
            sceneStyle: { backgroundColor: colors.pageBg },
            overlayColor: 'rgba(0,0,0,0.4)',
            // AI Assist, Messages, Profile and Directory each render their own header (`AiHeader`/
            // `MessagesHeader`/`ProfileScreen`'s own `TopBar` instance/`DirectoryHeader`) instead of
            // the generic `TopBar` above. Unlike My Events (a drawer screen, so it can set
            // `headerShown: false` per `Drawer.Screen`), all four are *bottom tabs* nested inside the
            // single `Tabs` screen that owns this shared header.
            //
            // `headerShown: focusedTabName !== 'AiAssist'` alone does NOT hide it here — on-device
            // testing showed the shared `TopBar` still rendering (stacked above `AiHeader`) even
            // though `focusedTabName` was correctly 'AiAssist' in that same render (proven by
            // `showAvatar` below reacting correctly in the very same options object). Whatever the
            // cause — `@react-navigation/drawer` v7 apparently doesn't re-derive the header's
            // reserved layout slot from a nested tab's focus change, even though it does re-invoke
            // `header:`'s render function — returning `null` from `header:` itself is what actually
            // works, so that's the guard here instead of `headerShown`. Same treatment extended to
            // `'Messages'`, `'Profile'` and `'Directory'` without re-testing the `headerShown` route
            // again — no reason to expect a different navigator behavior for another tab making the
            // identical request.
            header: () =>
              focusedTabName === 'AiAssist' ||
              focusedTabName === 'Messages' ||
              focusedTabName === 'Profile' ||
              focusedTabName === 'Directory' ? null : (
                <TopBar
                  onMenuPress={() => navigation.openDrawer()}
                  onBellPress={() => stackNavigation.navigate('Notifications')}
                  onAvatarPress={() => stackNavigation.navigate('Profile')}
                  unreadCount={unreadCount ?? 0}
                  userName={me?.name}
                  profileImageUri={me?.profileImg}
                  // Home's own mockup header (menu/logo/theme/bell only, no profile icon) excludes the
                  // avatar — Directory no longer reaches this branch at all now that it owns its own
                  // header above.
                  showAvatar={focusedTabName !== 'Home'}
                />
              ),
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
            // My Events, ETA Chapters, and My Resources each render their own header
            // (`MyEventsHeader`/`EtaChaptersHeader`/`ResourcesHeader`, matching their own mockups)
            // instead of the generic `TopBar` above, so they own `openDrawer()`/screen-specific
            // actions without a cross-component bridge — same reasoning as `MyEvents`, and no
            // `focusedTabName` workaround needed since all three are plain `Drawer.Screen`s, not
            // nested inside the `Tabs` screen the way AI Assist/Messages are.
            options={
              name === 'MyEvents' ||
              name === 'EtaChapters' ||
              name === 'MyResources' ||
              name === 'MyActivities'
                ? { headerShown: false }
                : undefined
            }
          />
        ))}
      </Drawer.Navigator>

      <SuggestFeatureSheet
        visible={suggestOpen}
        onClose={() => setSuggestOpen(false)}
      />
    </>
  );
}

export default DrawerNavigator;
