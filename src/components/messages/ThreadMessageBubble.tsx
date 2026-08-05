import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, FileText } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { avatarColor, formatFileSize, parseMessageContent } from '../../types/messages';
import { fetchSharedFeedPreview } from '../../api/messages';
import type { Message, MsgGroup } from '../../types/messages';

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

/** One `MsgGroup` (consecutive messages from the same sender — matches webSrc's `groupMessages`)
 * — avatar shown once for an incoming group, never for an outgoing one (right-aligned, matches
 * mockup). Each message in the group keeps its own timestamp/bubble. */
export function ThreadMessageGroup({ group, senderName }: { group: MsgGroup; senderName: string }) {
  if (group.isMine) {
    return (
      <View style={styles.outGroup}>
        {group.messages.map(m => (
          <OutgoingBubble key={m.id} message={m} />
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
          <IncomingBubble key={m.id} message={m} />
        ))}
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function IncomingBubble({ message }: { message: Message }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  return (
    <View
      style={[
        styles.inBubble,
        { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: borderWidth.thin, borderRadius: radius.xl },
      ]}
    >
      {message.reply_to ? <ReplyQuote authorName={message.reply_to.sender_name} text={message.reply_to.message} light={false} /> : null}
      <MessageBody message={message} textColor={colors.ink} />
      <Text style={[fonts.semibold, styles.timeIn, { color: colors.ink2, fontSize: fontSize.small - 0.5 }]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

function OutgoingBubble({ message }: { message: Message }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <View style={[styles.outBubble, { backgroundColor: colors.feedFill, borderRadius: radius.xl }]}>
      {message.reply_to ? <ReplyQuote authorName={message.reply_to.sender_name} text={message.reply_to.message} light /> : null}
      <MessageBody message={message} textColor={colors.feedOnFill} />
      <View style={styles.outMeta}>
        <Text style={[fonts.semibold, styles.timeOut]}>{formatTime(message.created_at)}</Text>
        {/* Static "sent" indicator, not a real seen/delivered state — webSrc has no read-receipt
            backend at all (no WS event, no seen-at field), so this can't reflect real data. */}
        <Check size={12} color={colors.goldLight} strokeWidth={2} />
      </View>
    </View>
  );
}

function ReplyQuote({ authorName, text, light }: { authorName: string; text: string; light: boolean }) {
  const { colors, fonts, fontSize } = useTheme();
  const parsed = parseMessageContent(text);
  const preview = parsed.type === 'text' ? parsed.text : parsed.type === 'shared_feed' ? 'Shared post' : parsed.fileName;
  return (
    <View
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
    </View>
  );
}

function MessageBody({ message, textColor }: { message: Message; textColor: string }) {
  const { fonts, fontSize } = useTheme();
  const parsed = parseMessageContent(message.message);

  if (parsed.type === 'text') {
    return <Text style={[fonts.regular, styles.bodyText, { color: textColor, fontSize: fontSize.body }]}>{parsed.text}</Text>;
  }
  if (parsed.type === 'image') {
    return <ImageBody fileUrl={parsed.fileUrl} />;
  }
  if (parsed.type === 'file') {
    return <FileBody fileName={parsed.fileName} fileSize={parsed.fileSize} fileUrl={parsed.fileUrl} textColor={textColor} />;
  }
  return <SharedFeedBody feedId={parsed.feedId} textColor={textColor} />;
}

function ImageBody({ fileUrl }: { fileUrl: string }) {
  const { radius } = useTheme();
  if (!fileUrl) return null;
  return (
    <Pressable onPress={() => Linking.openURL(fileUrl)}>
      <Image source={{ uri: fileUrl }} style={[styles.image, { borderRadius: radius.lg }]} resizeMode="cover" />
    </Pressable>
  );
}

function FileBody({
  fileName,
  fileSize,
  fileUrl,
  textColor,
}: {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  textColor: string;
}) {
  const { fonts, fontSize, radius } = useTheme();
  return (
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
  outBubble: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomRightRadius: 5,
  },
  bodyText: {
    lineHeight: 19,
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
