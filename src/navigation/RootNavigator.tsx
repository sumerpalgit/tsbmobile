import React from 'react';
import { Linking } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  Theme as NavTheme,
} from '@react-navigation/native';
import { useTheme } from '../theme';
import { useAuth } from '../store/AuthContext';
import { isLinkedInSignInInFlight } from '../screens/auth/linkedInSignInState';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { AuthStackParamList } from './types';

/**
 * Catches the email/password/LinkedIn deep links (tsb://verify-email?token=...&userId=...,
 * tsb://reset-password?token=..., tsb://linkedin-callback?token=...&complete=...) and routes
 * them to their respective screens — all only reachable while AuthNavigator is mounted (i.e.
 * logged out), which is the only time these links are ever expected to fire. React Navigation
 * parses query params into route params automatically for a plain (non-`:param`) path, so
 * `token`/`userId`/`complete` land on the route params without any extra config here.
 *
 * No https:// prefix yet: that's Universal Links, which needs a hosted
 * apple-app-site-association/assetlinks.json on the web domain — not set up, and can't be
 * for a raw http://IP:port dev backend anyway (Universal Links require https on a real
 * domain). See AndroidManifest.xml / Info.plist for the native tsb:// registration.
 */
const linking: LinkingOptions<AuthStackParamList> = {
  prefixes: ['tsb://'],
  config: {
    screens: {
      VerifyEmail: 'verify-email',
      ResetPassword: 'reset-password',
      LinkedInCallback: 'linkedin-callback',
    },
  },
  // `SocialSignIn`'s `handleLinkedInSignIn` (`authShared.tsx`) already applies the session
  // straight from `InAppBrowser.openAuth`'s own resolved result, so while that's in flight
  // (`isLinkedInSignInInFlight()`) the OS's own automatic redelivery of the same
  // `tsb://linkedin-callback` URL to this (singleTask) activity is redundant — without this it
  // still auto-navigated to `LinkedInCallbackScreen`, flashing its full-screen "Finishing
  // LinkedIn sign-in…" UI on top of Login for a beat even though the button's own spinner
  // already covered the wait. Swallowed only for that one in-flight window; any other
  // `linkedin-callback` delivery (the `InAppBrowser`-unavailable fallback, or a genuine
  // cold-start deep link) passes through untouched.
  subscribe(listener) {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('linkedin-callback') && isLinkedInSignInInFlight()) return;
      listener(url);
    });
    return () => sub.remove();
  },
};

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
    <NavigationContainer theme={navigationTheme} linking={linking}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default RootNavigator;
