import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import type { FeedEngagement } from '../../../api/feed';

/**
 * Like/comment/share row — copied exactly from `TSB Home FV.html`'s feed cards: the count sits
 * inline next to each icon (no separate stats line above this row, unlike an earlier, wrong
 * first pass), share is pushed to the far right via `margin-left:auto`, and there's no save
 * button here at all — that lives up in `PostCardHeader` instead, matching the mockup. Purely
 * presentational for now: each handler is optional and simply omitted until the matching API
 * (`POST /api/likes/toggle`, `/api/comments`, `/api/chat/share-feed`) is wired up.
 */
export function PostCardActions({
  engagement,
  onLike,
  onComment,
  onShare,
}: {
  engagement: FeedEngagement | undefined;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}) {
  const { colors, fonts, borderWidth } = useTheme();
  const liked = engagement?.likes.liked ?? false;

  return (
    <View style={[styles.row, { borderTopColor: colors.feedCardLine, borderTopWidth: borderWidth.thin }]}>
      <Pressable onPress={onLike} accessibilityRole="button" accessibilityLabel="Like" style={styles.button}>
        <Icon name="heart" size={16} filled={liked} color={liked ? colors.gold : colors.ink3} />
        <Text style={[fonts.semibold, styles.label, { color: liked ? colors.gold : colors.ink3 }]}>
          {engagement?.likes.count ?? 0}
        </Text>
      </Pressable>

      <Pressable onPress={onComment} accessibilityRole="button" accessibilityLabel="Comment" style={styles.button}>
        <Icon name="comment" size={16} color={colors.ink3} />
        <Text style={[fonts.semibold, styles.label, { color: colors.ink3 }]}>{engagement?.comments.length ?? 0}</Text>
      </Pressable>

      <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share" style={styles.shareButton}>
        <Icon name="share" size={16} color={colors.ink3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 11,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareButton: {
    marginLeft: 'auto',
  },
  label: {
    fontSize: 12.5,
  },
});
