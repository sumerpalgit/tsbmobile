import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

const AUTH_LOGO = require('../assets/images/AuthLogo.png');

/**
 * TSB wordmark — icon mark (`AuthLogo.png`, same asset the auth/onboarding screens already
 * use) + "TSB" wordmark, matching the app bar reference (`TSB Home FV.html`): icon, bold "TSB",
 * optional "FIND. CONNECT. CLOSE." tagline beneath.
 */

type LogoProps = {
  /** Show the "FIND. CONNECT. CLOSE." tagline beneath the wordmark. */
  showTagline?: boolean;
  size?: 'small' | 'medium' | 'large';
};

const SCALE = {
  small: { mark: 18, word: 16, tagline: 7 },
  medium: { mark: 24, word: 18, tagline: 8 },
  large: { mark: 34, word: 24, tagline: 10 },
} as const;

export function Logo({ showTagline = false, size = 'medium' }: LogoProps) {
  const { colors, fonts, letterSpacing } = useTheme();
  const scale = SCALE[size];
  // Measured height of the "TSB" + tagline text column, used to size the mark so it spans the
  // full block instead of a fixed value that happens to leave gaps above/below. `null` until the
  // first layout pass, so the mark starts at its normal fixed size and grows once measured —
  // avoids the unbounded-Image-source-size bug an `aspectRatio`-only/stretch approach hit here.
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const markSize = showTagline && blockHeight ? blockHeight : scale.mark;

  const onTextLayout = (e: LayoutChangeEvent) => {
    setBlockHeight(e.nativeEvent.layout.height);
  };

  return (
    <View style={styles.container}>
      <Image
        source={AUTH_LOGO}
        resizeMode="contain"
        style={[styles.mark, { width: markSize, height: markSize }]}
      />
      <View onLayout={showTagline ? onTextLayout : undefined}>
        <Text
          style={[
            fonts.display,
            { fontSize: scale.word, color: colors.ink },
            styles.word,
          ]}
        >
          TSB
        </Text>

        {showTagline && (
          <Text
            style={[
              fonts.bold,
              {
                fontSize: scale.tagline,
                color: colors.gold,
                letterSpacing: letterSpacing.wider,
              },
              styles.tagline,
            ]}
          >
            FIND. CONNECT. CLOSE.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mark: {
    marginRight: 6,
  },
  word: {
    includeFontPadding: false,
  },
  tagline: {
    includeFontPadding: false,
    marginTop: 1,
  },
});
