import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme as NavTheme,
} from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../store/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

/**
 * Feeds the TSB palette into React Navigation so the surfaces it paints itself
 * (screen backgrounds during transitions, the drawer scrim) match the app
 * rather than the library defaults.
 */
function RootNavigator() {
  const { isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();

  const navigationTheme: NavTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.gold,
      background: colors.pageBg,
      card: colors.surface,
      text: colors.ink,
      border: colors.border,
      notification: colors.gold,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default RootNavigator;
