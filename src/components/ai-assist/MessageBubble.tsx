import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Copy, MoreHorizontal, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import type { Message, MessageReaction } from '../../types/ai-assist';

/** One transcript entry — user bubble (right, navy fill, plain text) or AI bubble (left, spark
 * avatar + card, markdown body, Copy/Like/Dislike/More action row). Matches the mockup's
 * `msg.isUser` / generic-AI-card structure (the mockup's separate hardcoded "QoE" card is demo
 * content only — every real AI reply renders through this same generic card). */
export function MessageBubble({
  message,
  reaction,
  onCopy,
  onReact,
  onMore,
}: {
  message: Message;
  reaction?: MessageReaction | null;
  onCopy: () => void;
  onReact: (reaction: MessageReaction) => void;
  onMore: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const markdownStyles = useMarkdownStyles();

  if (message.isUser) {
    return (
      <View style={styles.userRow}>
        <View
          style={[
            styles.userBubble,
            { backgroundColor: colors.feedFill, borderRadius: radius.xl },
            elevation('sm'),
          ]}
        >
          <Text style={[fonts.regular, styles.userText, { color: colors.feedOnFill }]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <View style={[styles.avatar, { backgroundColor: colors.gold, borderRadius: radius.md }]}>
        <Icon name="aiAssist" size={15} color="#fff" />
      </View>
      <View
        style={[
          styles.aiCard,
          elevation('sm'),
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSoft,
            borderWidth: borderWidth.thin,
            borderRadius: radius.xl,
          },
        ]}
      >
        {message.text ? (
          <Markdown style={markdownStyles}>{message.text}</Markdown>
        ) : (
          <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink3 }]}>…</Text>
        )}

        <View style={[styles.actionsRow, { borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin }]}>
          <ActionButton label="Copy" wide onPress={onCopy}>
            <Copy size={13} color={colors.ink2} strokeWidth={1.5} />
          </ActionButton>
          <ActionButton label="Like" active={reaction === 'like'} onPress={() => onReact('like')}>
            <ThumbsUp size={13} color={reaction === 'like' ? colors.goldDark : colors.ink2} strokeWidth={1.5} />
          </ActionButton>
          <ActionButton label="Dislike" active={reaction === 'dislike'} onPress={() => onReact('dislike')}>
            <ThumbsDown size={13} color={reaction === 'dislike' ? colors.goldDark : colors.ink2} strokeWidth={1.5} />
          </ActionButton>
          <Pressable
            onPress={onMore}
            accessibilityRole="button"
            accessibilityLabel="More actions"
            style={({ pressed }) => [
              styles.moreButton,
              {
                marginLeft: 'auto',
                borderColor: colors.borderSoft,
                borderWidth: borderWidth.thin,
                borderRadius: radius.lg,
                backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
              },
            ]}
          >
            <MoreHorizontal size={15} color={colors.ink2} strokeWidth={1.6} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  wide,
  active,
  onPress,
  children,
}: {
  label: string;
  wide?: boolean;
  active?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.actionButton,
        wide && styles.actionButtonWide,
        {
          borderRadius: radius.lg,
          borderWidth: borderWidth.thin,
          borderColor: active ? colors.goldLight : colors.borderSoft,
          backgroundColor: active ? colors.chip : pressed ? colors.surfaceSunken : colors.surface,
        },
      ]}
    >
      {children}
      {wide && (
        <Text style={[fonts.semibold, styles.actionLabel, { color: active ? colors.goldDark : colors.ink2 }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Style keys match `react-native-markdown-display`'s node names (`heading1`, `paragraph`,
 * `list_item`, `code_inline`, `fence`, `strong`, `blockquote`, `table`, ...), not RN's own
 * StyleSheet element names. */
function useMarkdownStyles() {
  const { colors, fontSize } = useTheme();

  return useMemo(
    () => ({
      body: { color: colors.ink, fontSize: fontSize.body, fontFamily: 'DMSans-Regular' },
      heading1: { fontSize: fontSize.h3, fontFamily: 'DMSans-Bold', marginTop: 8, marginBottom: 6, color: colors.ink },
      heading2: { fontSize: fontSize.title, fontFamily: 'DMSans-Bold', marginTop: 8, marginBottom: 6, color: colors.ink },
      heading3: { fontSize: fontSize.subtitle, fontFamily: 'DMSerifDisplay-Regular', marginTop: 6, marginBottom: 4, color: colors.ink },
      strong: { fontFamily: 'DMSans-SemiBold' },
      em: { fontStyle: 'italic' as const },
      bullet_list: { marginVertical: 4 },
      ordered_list: { marginVertical: 4 },
      list_item: { marginBottom: 2 },
      code_inline: {
        backgroundColor: colors.cream,
        color: colors.ink,
        fontFamily: 'DMSans-Medium',
        fontSize: fontSize.small,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
      },
      fence: {
        backgroundColor: colors.cream,
        color: colors.ink,
        fontFamily: 'DMSans-Regular',
        fontSize: fontSize.small,
        borderRadius: 8,
        padding: 10,
      },
      code_block: {
        backgroundColor: colors.cream,
        color: colors.ink,
        fontFamily: 'DMSans-Regular',
        fontSize: fontSize.small,
        borderRadius: 8,
        padding: 10,
      },
      blockquote: {
        borderLeftColor: colors.border,
        borderLeftWidth: 3,
        paddingLeft: 10,
        marginVertical: 4,
      },
      table: { borderColor: colors.border, borderWidth: 1, borderRadius: 6 },
      th: { backgroundColor: colors.cream, padding: 6, fontFamily: 'DMSans-SemiBold' },
      td: { padding: 6 },
      link: { color: colors.gold },
    }),
    [colors, fontSize],
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  userText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  avatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiCard: {
    flex: 1,
    minWidth: 0,
    padding: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 15,
    paddingTop: 12,
  },
  actionButton: {
    minHeight: 40,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionButtonWide: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  actionLabel: {
    fontSize: 11,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
