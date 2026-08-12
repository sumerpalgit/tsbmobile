import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Check, CheckCheck, FileText, MoreVertical, Reply } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { avatarColor, formatFileSize, getConversationPreview, getCopyableText, isMessageDeletable, isMessageSeen, parseMessageContent } from '../../types/messages';
import { fetchSharedFeedPreview } from '../../api/messages';
import type { Message, MsgGroup } from '../../types/messages';

// Swipe-to-reply thresholds — same drag-then-snap-back shape as WhatsApp/Telegram (not a
// reveal-and-hold panel like `ConversationRow`'s swipe, since there's no persistent action to
// leave open here — the bubble always springs back, whether or not the swipe crossed the
// threshold). Right-only: `activeOffsetX([-10, 10])` lets the pan activate off a small movement
// in either direction (so it doesn't fight the FlatList's vertical scroll), but `onUpdate` clamps
// to positive values only, matching the single swipe direction used for both incoming (left-
// aligned) and outgoing (right-aligned) bubbles.
const REPLY_SWIPE_MAX = 56;
const REPLY_THRESHOLD = 40;

/** Wraps a bubble with WhatsApp-style swipe-right-to-reply: drag right reveals a reply icon to
 * the bubble's left, crossing `REPLY_THRESHOLD` on release fires `onReply` (the bubble always
 * snaps back to 0, it never stays open — there's nothing to leave revealed). Reply stays on its
 * own swipe gesture rather than folding into the Copy/Edit/Delete sheet — that sheet has its own
 * two triggers instead (long-press on the bubble, or the visible `MoreVertical` button beside it,
 * both wired separately on the bubble itself, see `IncomingBubble`/`OutgoingBubble`). */
function SwipeToReply({ onReply, children }: { onReply?: () => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate(e => {
      translateX.value = Math.max(0, Math.min(REPLY_SWIPE_MAX, e.translationX));
    })
    .onEnd(() => {
      const shouldReply = translateX.value > REPLY_THRESHOLD;
      translateX.value = withTiming(0, { duration: 200 });
      if (shouldReply && onReply) runOnJS(onReply)();
    });

  const bubbleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, translateX.value / REPLY_THRESHOLD) }));

  if (!onReply) return <>{children}</>;

  return (
    <View style={styles.swipeWrap}>
      {/* Purely decorative — invisible at rest but still a native view sitting in the touch
          hierarchy, and its absolute `left: -30` box extends outside the bubble into the space
          where the new "more actions" button lives for outgoing bubbles (button first, bubble
          second in JSX there, so this renders on top and was silently swallowing the tap).
          `pointerEvents="none"` lets every touch pass straight through it — it never needed to be
          interactive itself, the swipe gesture lives on the `GestureDetector`-wrapped bubble
          below, not on this well. */}
      <Animated.View style={[styles.replyIconWell, iconStyle]} pointerEvents="none">
        <Reply size={16} color={colors.gold} strokeWidth={2} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={bubbleStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

/** Centered day-section divider — matches the mockup's `m.isDay` row (a line/label/line). */
export function DayDivider({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={styles.dayRow}>
      <View style={[styles.dayLine, { backgroundColor: colors.borderSoft }]} />
      <Text style={[fonts.semibold, styles.dayLabel, { color: colors.ink2, backgroundColor: colors.surfaceSunken }]}>
        {label}
      </Text>
      <View style={[styles.dayLine, { backgroundColor: colors.borderSoft }]} />
    </View>
  );
}

/** Live "X is typing…" row — pure socket state (`TYPING`/`STOP_TYPING`), nothing persisted or
 * fetched, see `MessagesScreen`'s doc comment. Styled like an `IncomingBubble` (avatar + bubble)
 * but not attached to any real message — `MessagesScreen` appends it as a synthetic trailing
 * `ThreadItem` so it always renders at the bottom of the thread. Three dots pulse in a staggered
 * loop, same technique as `ai-assist/TypingIndicator.tsx` (built with `Animated`/`Reanimated`
 * instead of CSS keyframes — this file already uses Reanimated for `SwipeToReply`). */
export function TypingIndicatorBubble({ senderName }: { senderName: string }) {
  const { colors, radius, borderWidth } = useTheme();
  return (
    <View style={styles.inGroup}>
      <View style={styles.inAvatarSlot}>
        <Avatar name={senderName} size={26} fallbackColor={avatarColor(senderName)} />
      </View>
      <View
        style={[
          styles.inBubble,
          styles.typingBubble,
          { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: borderWidth.thin, borderRadius: radius.xl },
        ]}
      >
        <TypingDot delay={0} color={colors.ink3} />
        <TypingDot delay={200} color={colors.ink3} />
        <TypingDot delay={400} color={colors.ink3} />
      </View>
    </View>
  );
}

function TypingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(0.25, { duration: 660 })), -1, false),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.typingDot, { backgroundColor: color }, style]} />;
}

/** One `MsgGroup` (consecutive messages from the same sender — matches webSrc's `groupMessages`)
 * — avatar shown once for an incoming group, never for an outgoing one (right-aligned, matches
 * mockup). Each message in the group keeps its own timestamp/bubble. */
export function ThreadMessageGroup({
  group,
  senderName,
  highlightedMessageId,
  otherParticipantLastReadAt,
  onSwipeReply,
  onMessageActions,
  onPressReplyQuote,
}: {
  group: MsgGroup;
  senderName: string;
  highlightedMessageId?: string | null;
  /** Read-receipt timestamp, only meaningful for (and only passed down into) the outgoing side —
   * see `isMessageSeen` in `types/messages.ts`. */
  otherParticipantLastReadAt?: string | null;
  onSwipeReply?: (message: Message, authorName: string) => void;
  onMessageActions?: (message: Message) => void;
  onPressReplyQuote?: (messageId: string) => void;
}) {
  if (group.isMine) {
    return (
      <View style={styles.outGroup}>
        {group.messages.map(m => (
          <OutgoingBubble
            key={m.id}
            message={m}
            highlighted={m.id === highlightedMessageId}
            seen={isMessageSeen(m, otherParticipantLastReadAt)}
            onSwipeReply={onSwipeReply ? () => onSwipeReply(m, 'You') : undefined}
            onMessageActions={onMessageActions ? () => onMessageActions(m) : undefined}
            onPressReplyQuote={onPressReplyQuote}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.inGroup}>
      <View style={styles.inAvatarSlot}>
        <Avatar name={senderName} size={26} fallbackColor={avatarColor(senderName)} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {group.messages.map(m => (
          <IncomingBubble
            key={m.id}
            message={m}
            highlighted={m.id === highlightedMessageId}
            onSwipeReply={onSwipeReply ? () => onSwipeReply(m, senderName) : undefined}
            onMessageActions={onMessageActions ? () => onMessageActions(m) : undefined}
            onPressReplyQuote={onPressReplyQuote}
          />
        ))}
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function IncomingBubble({
  message,
  highlighted,
  onSwipeReply,
  onMessageActions,
  onPressReplyQuote,
}: {
  message: Message;
  highlighted?: boolean;
  onSwipeReply?: () => void;
  onMessageActions?: () => void;
  onPressReplyQuote?: (messageId: string) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const parsed = parseMessageContent(message.message);
  const isDeleted = parsed.type === 'deleted';
  const isCopyable = !isDeleted && !!getCopyableText(parsed);
  const bubble = (
    <SwipeToReply onReply={isDeleted ? undefined : onSwipeReply}>
      <Pressable
        onLongPress={isCopyable ? onMessageActions : undefined}
        style={[
          styles.inBubble,
          {
            backgroundColor: highlighted ? colors.chip : colors.surface,
            borderColor: highlighted ? colors.gold : colors.borderSoft,
            borderWidth: borderWidth.thin,
            borderRadius: radius.xl,
          },
        ]}
      >
        {message.reply_to ? (
          <ReplyQuote
            authorName={message.reply_to.sender_name}
            text={message.reply_to.message}
            light={false}
            onPress={onPressReplyQuote ? () => onPressReplyQuote(message.reply_to!.id) : undefined}
          />
        ) : null}
        <MessageBody message={message} textColor={colors.ink} />
        <Text style={[fonts.semibold, styles.timeIn, { color: colors.ink2, fontSize: fontSize.small - 0.5 }]}>
          {formatTime(message.created_at)}
          {message.edited_at ? ' · Edited' : ''}
        </Text>
      </Pressable>
    </SwipeToReply>
  );
  if (!isCopyable) return bubble;
  return (
    <View style={styles.bubbleRow}>
      {bubble}
      <Pressable onPress={onMessageActions} hitSlop={8} accessibilityLabel="Message actions" style={styles.moreButton}>
        <MoreVertical size={16} color={colors.ink3} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

function OutgoingBubble({
  message,
  highlighted,
  seen,
  onSwipeReply,
  onMessageActions,
  onPressReplyQuote,
}: {
  message: Message;
  highlighted?: boolean;
  /** From `isMessageSeen` — real read-receipt state now (conversation-level
   * `otherParticipantLastReadAt`, not per-message), see `ThreadMessageGroup`. */
  seen?: boolean;
  onSwipeReply?: () => void;
  onMessageActions?: () => void;
  onPressReplyQuote?: (messageId: string) => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const parsed = parseMessageContent(message.message);
  const isDeleted = parsed.type === 'deleted';
  // Own messages open the actions sheet on long-press even when there's nothing copyable in them
  // (an uncaptioned image, say) — Delete has no content-type restriction, so it's still on offer.
  // `isMessageDeletable` also excludes a still-sending optimistic message, so a pending
  // uncaptioned attachment correctly stays non-actionable rather than opening an empty sheet.
  const isActionable = !isDeleted && (!!getCopyableText(parsed) || isMessageDeletable(message));
  const bubble = (
    <SwipeToReply onReply={isDeleted ? undefined : onSwipeReply}>
      <Pressable
        onLongPress={isActionable ? onMessageActions : undefined}
        style={[styles.outBubble, { backgroundColor: highlighted ? colors.goldDark : colors.feedFill, borderRadius: radius.xl }]}
      >
        {message.reply_to ? (
          <ReplyQuote
            authorName={message.reply_to.sender_name}
            text={message.reply_to.message}
            light
            onPress={onPressReplyQuote ? () => onPressReplyQuote(message.reply_to!.id) : undefined}
          />
        ) : null}
        <MessageBody message={message} textColor={colors.feedOnFill} />
        <View style={styles.outMeta}>
          <Text style={[fonts.semibold, styles.timeOut]}>
            {formatTime(message.created_at)}
            {message.edited_at ? ' · Edited' : ''}
          </Text>
          {/* Sent-vs-seen only — no intermediate "delivered" state exists in the real contract.
              Seen is timestamp-based (conversation-level `otherParticipantLastReadAt`), not
              per-message, so every eligible message flips to double-tick at once when it fires —
              that's the real behavior, not a bug. */}
          {!isDeleted &&
            (seen ? (
              <CheckCheck size={13} color={colors.gold} strokeWidth={2.2} />
            ) : (
              <Check size={12} color={colors.goldLight} strokeWidth={2} />
            ))}
        </View>
      </Pressable>
    </SwipeToReply>
  );
  if (!isActionable) return bubble;
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowOut]}>
      <Pressable onPress={onMessageActions} hitSlop={8} accessibilityLabel="Message actions" style={styles.moreButton}>
        <MoreVertical size={16} color={colors.ink3} strokeWidth={1.8} />
      </Pressable>
      {bubble}
    </View>
  );
}

/** `text` is the raw stored string of the quoted original message (server-supplied, via
 * `reply_to.message` — the client only ever sends `reply_to_message_id`, never this string) —
 * for an image/file original that's raw JSON, so it's run through the same
 * `getConversationPreview` used for the inbox's last-message line rather than printed as-is. Tap
 * scrolls to + briefly highlights the original if it's already loaded in the current scrollback;
 * a no-op otherwise (matches web's own limitation — no auto-fetch-to-locate). */
function ReplyQuote({
  authorName,
  text,
  light,
  onPress,
}: {
  authorName: string;
  text: string;
  light: boolean;
  onPress?: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const preview = getConversationPreview(text);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.replyQuote,
        {
          borderLeftColor: light ? 'rgba(255,255,255,0.4)' : colors.gold,
          backgroundColor: light ? 'rgba(255,255,255,0.08)' : colors.surfaceSunken,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[fonts.bold, { fontSize: fontSize.small, color: light ? 'rgba(255,255,255,0.85)' : colors.goldDark }]}
      >
        {authorName}
      </Text>
      <Text numberOfLines={1} style={[fonts.regular, { fontSize: fontSize.small, color: light ? 'rgba(255,255,255,0.7)' : colors.ink2 }]}>
        {preview}
      </Text>
    </Pressable>
  );
}

function MessageBody({ message, textColor }: { message: Message; textColor: string }) {
  const { fonts, fontSize } = useTheme();
  const parsed = parseMessageContent(message.message);

  if (parsed.type === 'text') {
    return <Text style={[fonts.regular, styles.bodyText, { color: textColor, fontSize: fontSize.body }]}>{parsed.text}</Text>;
  }
  if (parsed.type === 'image') {
    return <ImageBody fileUrl={parsed.fileUrl} caption={parsed.text} textColor={textColor} />;
  }
  if (parsed.type === 'file') {
    return <FileBody fileName={parsed.fileName} fileSize={parsed.fileSize} fileUrl={parsed.fileUrl} caption={parsed.text} textColor={textColor} />;
  }
  if (parsed.type === 'deleted') {
    return (
      <Text style={[fonts.regular, styles.bodyText, styles.deletedText, { color: textColor, fontSize: fontSize.body, opacity: 0.65 }]}>
        This message was deleted
      </Text>
    );
  }
  return <SharedFeedBody feedId={parsed.feedId} textColor={textColor} />;
}

/** `caption` is the optional `text` field alongside an image/file message's own JSON fields —
 * sent together as one message now (not a separate text message first), rendered under the
 * image/attachment, same as web. */
function ImageBody({ fileUrl, caption, textColor }: { fileUrl: string; caption?: string; textColor: string }) {
  const { fonts, fontSize, radius } = useTheme();
  if (!fileUrl) return null;
  return (
    <View>
      <Pressable onPress={() => Linking.openURL(fileUrl)}>
        <Image source={{ uri: fileUrl }} style={[styles.image, { borderRadius: radius.lg }]} resizeMode="cover" />
      </Pressable>
      {!!caption && (
        <Text style={[fonts.regular, styles.caption, { color: textColor, fontSize: fontSize.body }]}>{caption}</Text>
      )}
    </View>
  );
}

function FileBody({
  fileName,
  fileSize,
  fileUrl,
  caption,
  textColor,
}: {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  caption?: string;
  textColor: string;
}) {
  const { fonts, fontSize, radius } = useTheme();
  return (
    <View>
      <Pressable onPress={() => fileUrl && Linking.openURL(fileUrl)} style={[styles.fileRow, { borderRadius: radius.md }]}>
        <FileText size={20} color={textColor} strokeWidth={1.6} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[fonts.semibold, { fontSize: fontSize.body, color: textColor }]}>
            {fileName}
          </Text>
          <Text style={[fonts.regular, { fontSize: fontSize.small, color: textColor, opacity: 0.7 }]}>
            {formatFileSize(fileSize)} · Tap to open
          </Text>
        </View>
      </Pressable>
      {!!caption && (
        <Text style={[fonts.regular, styles.caption, { color: textColor, fontSize: fontSize.body }]}>{caption}</Text>
      )}
    </View>
  );
}

function SharedFeedBody({ feedId, textColor }: { feedId: string; textColor: string }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const [preview, setPreview] = useState<{ title: string; snippet: string; authorName: string | null } | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchSharedFeedPreview(feedId).then(result => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [feedId]);

  return (
    <View
      style={[
        styles.sharedFeedCard,
        { borderColor: colors.borderSoft, borderWidth: borderWidth.thin, borderRadius: radius.lg },
      ]}
    >
      <Text style={[fonts.bold, { fontSize: fontSize.small, color: textColor }]}>📎 Shared a post</Text>
      {preview ? (
        <>
          <Text numberOfLines={2} style={[fonts.semibold, { fontSize: fontSize.body, color: textColor, marginTop: 4 }]}>
            {preview.title}
          </Text>
          {preview.snippet ? (
            <Text numberOfLines={2} style={[fonts.regular, { fontSize: fontSize.small, color: textColor, opacity: 0.75, marginTop: 2 }]}>
              {preview.snippet}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrap: {
    position: 'relative',
  },
  replyIconWell: {
    position: 'absolute',
    left: -30,
    top: 0,
    bottom: 0,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dayLine: {
    flex: 1,
    height: 1,
  },
  dayLabel: {
    fontSize: 11,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
  },
  inGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '84%',
    alignSelf: 'flex-start',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    alignSelf: 'flex-start',
  },
  bubbleRowOut: {
    alignSelf: 'flex-end',
  },
  moreButton: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inAvatarSlot: {
    marginBottom: 2,
  },
  outGroup: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '84%',
  },
  inBubble: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomLeftRadius: 5,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 13,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  outBubble: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomRightRadius: 5,
  },
  bodyText: {
    lineHeight: 19,
  },
  deletedText: {
    fontStyle: 'italic',
  },
  timeIn: {
    marginTop: 4,
  },
  outMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeOut: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  replyQuote: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  image: {
    width: 200,
    height: 150,
  },
  caption: {
    lineHeight: 19,
    marginTop: 8,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  sharedFeedCard: {
    padding: 10,
    minWidth: 180,
  },
});
