import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const APP_ICON = require('../assets/images/appIcon.png');

/**
 * Splash screen. Uses the brand navy in both themes — the website likewise
 * forces light styling on pre-auth pages (`PublicLightEnforcer`), so the first
 * frame is consistent no matter the OS setting. `authPanel`/`onAccent` are the
 * same fixed-regardless-of-theme tokens the Login/Signup hero uses, so this
 * screen's colours never need a second definition.
 */
function SplashScreen() {
  const { colors, fonts, letterSpacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.authPanel }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.authPanel} />
      <Image source={APP_ICON} style={styles.mark} resizeMode="cover" />
      <Text
        style={[
          fonts.bold,
          styles.tagline,
          { letterSpacing: letterSpacing.wider, color: colors.onAccent },
        ]}
      >
        FIND. CONNECT. CLOSE.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    // Matches the size Android's own SplashScreen API renders the app icon
    // at (measured ~1.69x this screen's own earlier 112dp) — the OS doesn't
    // let that size be configured, so this screen matches it instead.
    width: 190,
    height: 190,
    borderRadius: 56,
  },
  tagline: {
    marginTop: 20,
    fontSize: 10,
  },
});

export default SplashScreen;
