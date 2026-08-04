import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PostCardSkeleton } from './PostCard/PostCardSkeleton';

/** N skeleton cards, matching web's `FeedSkeleton`'s default `count={5}`. Rendered as
 * `HomeScreen`'s `FlatList`'s `ListEmptyComponent` while the first feed fetch is in flight, so
 * opening the app shows loading placeholders instead of a blank screen. */
export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
});
