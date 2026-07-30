import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

/**
 * TSB wordmark.
 *
 * The website renders `/logoD.png` (inverted to white in dark mode). That asset
 * is not in this repo, so this is a type-set stand-in using the brand display
 * face. When the real artwork arrives, replace the body of this component with
 * an <Image> — no call site needs to change.
 */

type LogoProps = {
  /** Show the "FIND. CONNECT. CLOSE." tagline beneath the wordmark. */
  showTagline?: boolean;
  size?: 'small' | 'medium' | 'large';
};

const SCALE = {
  small: { mark: 15, word: 13, tagline: 7 },
  medium: { mark: 19, word: 15, tagline: 8 },
  large: { mark: 30, word: 22, tagline: 10 },
} as const;

export function Logo({ showTagline = false, size = 'medium' }: LogoProps) {
  const { colors, fonts, letterSpacing } = useTheme();
  const scale = SCALE[size];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text
          style={[
            fonts.display,
            { fontSize: scale.mark, color: colors.gold },
            styles.mark,
          ]}
        >
          TSB
        </Text>
        <Text
          style={[
            fonts.display,
            { fontSize: scale.word, color: colors.ink },
            styles.word,
          ]}
        >
          The Search Bridge
        </Text>
      </View>

      {showTagline && (
        <Text
          style={[
            fonts.bold,
            {
              fontSize: scale.tagline,
              color: colors.ink3,
              letterSpacing: letterSpacing.wider,
            },
            styles.tagline,
          ]}
        >
          FIND. CONNECT. CLOSE.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mark: {
    marginRight: 6,
  },
  word: {
    includeFontPadding: false,
  },
  tagline: {
    marginTop: 1,
  },
});
