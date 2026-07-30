/**
 * TSB Mobile
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/screens';
import { RootNavigator } from './src/navigation';
import { AuthProvider } from './src/store/AuthContext';
import { ThemeProvider, useTheme } from './src/theme';

function AppContent() {
  const { colors, isDark, isThemeLoaded } = useTheme();
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplashVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Hold the splash until the saved theme has been read, otherwise the first
  // frame can flash the wrong palette before the stored preference applies.
  const showSplash = isSplashVisible || !isThemeLoaded;

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
      {/*
        Baseline for screens that don't set their own — SplashScreen,
        LoginScreen and SignupScreen each render their own <StatusBar> to
        match their (fixed-navy) top background, overriding this one for as
        long as they're mounted.
      */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      {showSplash ? (
        <SplashScreen />
      ) : (
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      )}
    </View>
  );
}

function App() {
  return (
    // Required by the drawer's swipe gesture — must wrap the whole tree.
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
