import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { Icon } from '../components/icons/Icon';
import { createPlaceholderScreen } from '../screens/PlaceholderScreen';
import { HomeScreen } from '../screens';
import { TAB_ITEMS } from './menuConfig';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Bottom bar — Home, Directory, Post, Matches, Messages.
 *
 * The header is deliberately off: `DrawerNavigator` renders one shared `TopBar`
 * above this navigator so the chrome does not change between tabs and drawer
 * screens.
 */

/**
 * Built once at module scope. Defining these inside the component would hand
 * React a new component type on every render and remount the screen.
 */
const TAB_SCREENS: Record<keyof MainTabParamList, React.ComponentType> = {
  Home: HomeScreen,
  Directory: createPlaceholderScreen({
    title: 'Directory',
    icon: 'directory',
    phase: 'Phase 7',
  }),
  Post: createPlaceholderScreen({
    title: 'Create a Post',
    icon: 'create',
    phase: 'Phase 4',
  }),
  Matches: createPlaceholderScreen({
    title: 'My Matches',
    icon: 'matches',
    phase: 'Phase 5',
  }),
  Messages: createPlaceholderScreen({
    title: 'Messages',
    icon: 'messages',
    phase: 'Phase 6',
  }),
};

function MainNavigator() {
  const { colors, fonts, borderWidth } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          borderTopWidth: borderWidth.thin,
        },
        tabBarLabelStyle: {
          ...fonts.medium,
          fontSize: 10.5,
        },
      }}
    >
      {TAB_ITEMS.map(item => (
        <Tab.Screen
          key={item.name}
          name={item.name}
          component={TAB_SCREENS[item.name]}
          options={{
            tabBarLabel: item.label,
            tabBarIcon: ({ color }) => (
              <Icon name={item.icon} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default MainNavigator;
