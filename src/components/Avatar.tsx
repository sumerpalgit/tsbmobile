import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useTheme } from '../theme';

/**
 * Profile avatar — photo when available, otherwise initials on the navy
 * gradient used by the web navbar (`from-[#3a5573] to-[#5a7995]`). RN has no
 * gradient primitive without another dependency, so the mid-tone of that ramp
 * is used as a flat fill.
 */

type AvatarProps = {
  name?: string | null;
  imageUri?: string | null;
  size?: number;
  /** Overrides `colors.avatarFallback` — `PostCardHeader` passes `colors.feedFill` to match
   * `TSB Home FV.html`'s feed-card avatar exactly, a different flat tone than the fallback
   * used elsewhere (`TopBar`, `DrawerContent`). */
  fallbackColor?: string;
  /** Overrides `colors.onAccent` — paired with `fallbackColor` (`colors.feedOnFill` for feed
   * cards). */
  textColor?: string;
};

export function Avatar({ name, imageUri, size = 36, fallbackColor, textColor }: AvatarProps) {
  const { colors, fonts, borderWidth } = useTheme();
  // Some profile photos are uploaded as `.svg` (a real, if unusual, case seen in live data) —
  // RN's `Image` only decodes raster formats (PNG/JPEG/WebP/GIF) and silently renders nothing
  // for an SVG source, so those need `react-native-svg`'s own URI renderer instead. `failed`
  // covers the general case too (any image, SVG or not, that 404s/fails to load falls back to
  // initials instead of staying blank).
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUri]);

  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isSvg = !!imageUri && /\.svg(\?|#|$)/i.test(imageUri);
  const showImage = !!imageUri && !failed;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackColor ?? colors.avatarFallback,
          borderColor: colors.border,
          borderWidth: borderWidth.thick,
        },
      ]}
    >
      {showImage ? (
        isSvg ? (
          <SvgUri uri={imageUri!} width={size} height={size} onError={() => setFailed(true)} />
        ) : (
          <Image
            source={{ uri: imageUri! }}
            style={{ width: size, height: size }}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <Text
          style={[
            fonts.semibold,
            { fontSize: size * 0.39, color: textColor ?? colors.onAccent },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
