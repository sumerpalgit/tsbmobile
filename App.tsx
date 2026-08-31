/**
 * TSB Mobile
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SplashScreen } from './src/screens';
import { RootNavigator } from './src/navigation';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { SocketProvider } from './src/store/SocketContext';
import { ThemeProvider, useTheme } from './src/theme';
import { queryClient } from './src/config/queryClient';
import { usePush } from './src/services/push';

function AppContent() {
  const { colors, isDark, isThemeLoaded } = useTheme();
  const { isAuthLoaded } = useAuth();
  const [isSplashVisible, setSplashVisible] = useState(true);

  // Push notifications: creates the Android channel, registers the foreground/tap handlers, and
  // (once signed in) requests permission and logs the FCM token. Lives here rather than in
  // `App` because it reads `useAuth`, which is only available below `AuthProvider`.
  usePush();

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hold the splash until the saved theme and stored auth token have both been
  // read, otherwise the first frame can flash the wrong palette or bounce an
  // already-logged-in user through the login screen before either resolves.
  const showSplash = isSplashVisible || !isThemeLoaded || !isAuthLoaded;

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
      {/*
        Baseline for screens that don't set their own — SplashScreen,
        LoginScreen and SignupScreen each render their own <StatusBar> to
        match their (fixed-navy) top background, overriding this one for as
        long as they're mounted.
      */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      {showSplash ? <SplashScreen /> : <RootNavigator />}
    </View>
  );
}

function App() {
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    // Required by the drawer's swipe gesture — must wrap the whole tree.
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <SafeAreaProvider>
                <AppContent />
                <Toast />
              </SafeAreaProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
