import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';

/** Optional cover image — only `event.cover_image` has one so far, but kept generic (plain
 * `imageUri`) rather than event-specific, so any other type that gains an image field later
 * (or `deal.teaser_pdf`, once that's rendered as a preview rather than a download link) reuses
 * this instead of a new media component. Renders nothing when there's no image. */
export function PostCardMedia({ imageUri }: { imageUri?: string | null }) {
  const { radius } = useTheme();

  if (!imageUri) {
    return null;
  }

  return <Image source={{ uri: imageUri }} resizeMode="cover" style={[styles.image, { borderRadius: radius.lg }]} />;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
