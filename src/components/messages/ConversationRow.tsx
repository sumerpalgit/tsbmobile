import React, { forwardRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { MoreVertical } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { avatarColor, getConversationPreview } from '../../types/messages';
import type { Conversation } from '../../types/messages';

// The mockup's reveal width (152) fit two buttons (More + Delete, 76 each) — with only "More"
// left (see decision #1: Delete has no real backend), a single 152-wide button reads oversized,
// so the reveal now sizes to roughly one button's width instead of the original two-button span.
const SWIPE_W = 84;
const OPEN_THRESHOLD = SWIPE_W * 0.4;

export type ConversationRowHandle = {
  /** Swipes the row open then closed, unprompted — a one-time visual hint (played on the first
   * row by `ConversationList` each time the inbox loads) that rows are swipeable at all. */
  playHint: () => void;
};

/** Swipeable conversation row — matches the mockup's pointer-drag swipe-to-reveal exactly
 * (152dp reveal width, 40% snap-open threshold), built with `react-native-gesture-handler`'s
 * `Gesture.Pan()` + `react-native-reanimated` (first custom gesture in this app; both
 * dependencies already present, `App.tsx` already wraps the tree in `GestureHandlerRootView`).
 * `activeOffsetX([-10, 10])` is the RN-native equivalent of the mockup's own `_moved` flag — a
 * small tap passes through to the row's `Pressable`, only a real horizontal drag activates the
 * pan, so tapping to open a conversation still works without fighting the gesture.
 *
 * Reveals a single "More" action (opens `ConversationOptionsSheet`) — mockup's "Delete" is
 * dropped, see the plan's decision #1 (no real delete-conversation endpoint exists on web).
 *
 * Each row's swipe state is local (not lifted to the parent list) — a small, deliberate
 * simplification vs. the mockup's single-row-open-at-a-time enforcement; multiple rows could
 * technically be left swiped open at once, which the mockup prevents. Flagged here rather than
 * silently dropped. */
export const ConversationRow = forwardRef<
  ConversationRowHandle,
  {
    conversation: Conversation;
    isOnline: boolean;
    onOpen: () => void;
    onMore: () => void;
  }
>(function ConversationRowInner({ conversation, isOnline, onOpen, onMore }, ref) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const closeSwipe = () => {
    translateX.value = withTiming(0, { duration: 220 });
  };

  useImperativeHandle(ref, () => ({
    playHint: () => {
      translateX.value = withSequence(
        withTiming(-SWIPE_W, { duration: 320 }),
        withDelay(450, withTiming(0, { duration: 320 })),
      );
    },
  }));

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate(e => {
      translateX.value = Math.min(0, Math.max(-SWIPE_W, startX.value + e.translationX));
    })
    .onEnd(() => {
      const open = translateX.value < -OPEN_THRESHOLD;
      translateX.value = withTiming(open ? -SWIPE_W : 0, { duration: 220 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Fully hides the reveal panel at rest instead of relying on the foreground to cover it —
  // Android doesn't always clip an absolutely-positioned sibling against the container's rounded
  // corners reliably, which let a sliver of the "More" button peek through as a stray border even
  // when the row was closed. Zero opacity means there's nothing to peek through, regardless.
  const revealStyle = useAnimatedStyle(() => ({
    opacity: translateX.value === 0 ? 0 : 1,
  }));

  const isUnread = conversation.unreadCount > 0;
  const preview = getConversationPreview(conversation.latestMessage?.message);
  const time = formatListTime(conversation.latestMessage?.created_at);

  return (
    <View style={[styles.container, { borderRadius: radius.xl, backgroundColor: colors.surfaceSunken }]}>
      <Animated.View style={[styles.revealActions, revealStyle]}>
        <Pressable
          onPress={() => {
            closeSwipe();
            onMore();
          }}
          style={[
            styles.moreButton,
            { backgroundColor: colors.feedFill, borderTopRightRadius: radius.xl, borderBottomRightRadius: radius.xl },
          ]}
        >
          <MoreVertical size={18} color="#fff" strokeWidth={1.8} />
          <Text style={[fonts.bold, styles.moreLabel]}>More</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.foreground,
            { borderRadius: radius.xl, backgroundColor: isUnread ? colors.surface : colors.pageBg },
            animatedStyle,
          ]}
        >
          <Pressable onPress={onOpen} style={styles.rowContent}>
            <View style={styles.avatarWrap}>
              <Avatar
                name={conversation.name}
                imageUri={conversation.profileImg}
                size={46}
                fallbackColor={avatarColor(conversation.name)}
              />
              {isOnline && (
                <View style={[styles.presenceDot, { backgroundColor: colors.success, borderColor: colors.surface }]} />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.rowTopLine}>
                <Text
                  numberOfLines={1}
                  style={[
                    isUnread ? fonts.bold : fonts.semibold,
                    styles.name,
                    { fontSize: fontSize.subtitle, color: colors.ink },
                  ]}
                >
                  {conversation.name}
                </Text>
                {isUnread && (
                  <View style={[styles.unreadBadge, { borderRadius: radius.pill, backgroundColor: colors.gold }]}>
                    <Text style={[fonts.bold, styles.unreadText]}>
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  isUnread ? fonts.semibold : fonts.regular,
                  styles.preview,
                  { color: isUnread ? colors.ink : colors.ink3 },
                ]}
              >
                {preview || 'No messages yet'}
              </Text>
            </View>
            <Text style={[fonts.semibold, styles.time, { color: colors.ink2 }]}>{time}</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

/** Matches webSrc's `formatListTime` shape closely enough for the inbox row (same-day → time,
 * else short date) without pulling in a date library. */
function formatListTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  revealActions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE_W,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  moreButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  moreLabel: {
    fontSize: 11,
    color: '#fff',
  },
  foreground: {
    width: '100%',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 10,
    color: '#fff',
  },
  preview: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
  time: {
    fontSize: 11,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
});
