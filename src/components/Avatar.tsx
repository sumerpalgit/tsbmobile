import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
};

export function Avatar({ name, imageUri, size = 36 }: AvatarProps) {
  const { colors, fonts, borderWidth } = useTheme();

  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.avatarFallback,
          borderColor: colors.border,
          borderWidth: borderWidth.thick,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            fonts.semibold,
            { fontSize: size * 0.39, color: colors.onAccent },
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
