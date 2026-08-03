import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { TopBar } from '../components/TopBar';
import { createPlaceholderScreen } from '../screens/PlaceholderScreen';
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
  EtaChapters: createPlaceholderScreen({
    title: 'ETA Chapters',
    icon: 'etaChapters',
    phase: 'Phase 7',
  }),
  MyMatches: createPlaceholderScreen({
    title: 'My Matches',
    icon: 'matches',
    phase: 'Phase 5',
  }),
  MyEvents: createPlaceholderScreen({
    title: 'My Events',
    icon: 'events',
    phase: 'Phase 7',
  }),
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
      screenOptions={({ navigation }) => ({
        drawerType: 'front',
        drawerStyle: {
          width: sizes.drawerWidth,
          backgroundColor: colors.surface,
        },
        sceneStyle: { backgroundColor: colors.pageBg },
        overlayColor: 'rgba(0,0,0,0.4)',
        header: () => (
          <TopBar
            onMenuPress={() => navigation.openDrawer()}
            onBellPress={() => stackNavigation.navigate('Notifications')}
            onAvatarPress={() => stackNavigation.navigate('Profile')}
          />
        ),
      })}
    >
      <Drawer.Screen name="Tabs" component={MainNavigator} />
      {(
        Object.keys(SCREENS) as Array<keyof Omit<DrawerParamList, 'Tabs'>>
      ).map(name => (
        <Drawer.Screen key={name} name={name} component={SCREENS[name]} />
      ))}
    </Drawer.Navigator>
  );
}

export default DrawerNavigator;
