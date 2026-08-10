import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { Plus, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fetchEtaGroupMessages } from '../../api/eta';
import { CHAPTER_GRADIENTS, getChapterGradientIdx } from './etaChapterVisuals';
import type { EtaGroup } from '../../types/etaChapters';
import type { Message } from '../../types/messages';

/** Read-only teaser preview before joining — matches `ETAChapters_decoded.html`'s "CHAT PREVIEW
 * SHEET" (~line 653), backed by real data (`fetchEtaGroupMessages(id, 1, 10)`, same as web's
 * `handlePreviewGroup`). The mockup fades/blurs its preview content via a CSS `mask-image`
 * gradient plus `filter:blur()` on individual elements — RN has no blur primitive without a new
 * native dependency, so this reproduces the same "increasingly obscured toward the bottom"
 * teaser effect with a `LinearGradient` fade mask over the message list plus reduced opacity on
 * the last couple of bubbles, rather than pulling in a blur library for one cosmetic effect. */
export function ChapterPreviewSheet({
  visible,
  chapter,
  isJoining,
  onClose,
  onJoin,
}: {
  visible: boolean;
  chapter: EtaGroup | null;
  isJoining: boolean;
  onClose: () => void;
  onJoin: () => void;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !chapter) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchEtaGroupMessages(chapter.id, 1, 10)
      .then(({ messages: msgs }) => {
        if (!cancelled) setMessages(msgs);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, chapter]);

  if (!chapter) return null;
  const gradient = CHAPTER_GRADIENTS[getChapterGradientIdx(chapter.name)];

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]}
        >
          <View style={styles.cover}>
            {chapter.groupImageUrl ? (
              <FastImage source={{ uri: chapter.groupImageUrl, priority: FastImage.priority.normal }} style={StyleSheet.absoluteFillObject} resizeMode={FastImage.resizeMode.cover} />
            ) : (
              <LinearGradient colors={[gradient.from, gradient.to]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            )}
            <View style={[StyleSheet.absoluteFillObject, styles.coverOverlay]} />
            <Pressable onPress={onClose} accessibilityLabel="Close" style={styles.closeButton}>
              <X size={13} color="#fff" strokeWidth={1.8} />
            </Pressable>
            <View style={styles.coverText}>
              <Text style={[fonts.display, styles.coverName, { color: '#fff' }]} numberOfLines={1}>
                {chapter.name}
              </Text>
              <Text style={[fonts.semibold, styles.coverMembers, { color: 'rgba(255,255,255,0.82)' }]}>
                {chapter.memberCount ?? 0} Members
              </Text>
            </View>
          </View>

          <View style={[styles.body, { backgroundColor: colors.pageBg }]}>
            {loading ? null : messages.length === 0 ? (
              <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>
                No messages yet — be the first to start the conversation!
              </Text>
            ) : (
              <View style={styles.previewWrap}>
                {messages.slice(0, 3).map((m, i) => (
                  <View key={m.id} style={[styles.previewRow, i >= 1 && { opacity: 0.6 }, i >= 2 && { opacity: 0.35 }]}>
                    <View style={styles.previewMetaRow}>
                      <View style={[styles.previewAvatar, { backgroundColor: colors.avatarFallback }]} />
                      <View style={[styles.previewNameBar, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={[styles.previewBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text numberOfLines={2} style={[fonts.regular, styles.previewText, { color: colors.ink2 }]}>
                        {m.message}
                      </Text>
                    </View>
                  </View>
                ))}
                <LinearGradient
                  colors={['transparent', colors.pageBg]}
                  style={styles.fadeMask}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  pointerEvents="none"
                />
              </View>
            )}
          </View>

          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <Text style={[fonts.regular, styles.footerText, { color: colors.ink3 }]}>
              Join to see the full conversation and participate in <Text style={[fonts.bold, { color: colors.ink }]}>{chapter.name}</Text>.
            </Text>
            <Pressable
              onPress={onJoin}
              disabled={isJoining}
              style={[styles.joinButton, { backgroundColor: colors.gold, borderRadius: radius.lg, opacity: isJoining ? 0.6 : 1 }]}
            >
              <Plus size={13} color="#fff" strokeWidth={1.9} />
              <Text style={[fonts.bold, { fontSize: fontSize.small, color: '#fff' }]}>{isJoining ? 'Joining…' : 'Join chapter'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9,17,26,0.55)',
  },
  sheet: {
    maxHeight: '80%',
    overflow: 'hidden',
  },
  cover: {
    height: 120,
    justifyContent: 'flex-end',
  },
  coverOverlay: {
    backgroundColor: 'rgba(9,17,26,0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(9,17,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    padding: 16,
    paddingRight: 52,
    paddingBottom: 12,
  },
  coverName: {
    fontSize: 21,
    letterSpacing: -0.3,
  },
  coverMembers: {
    fontSize: 11.5,
    marginTop: 3,
  },
  body: {
    padding: 16,
    minHeight: 120,
  },
  emptyText: {
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 34,
  },
  previewWrap: {
    gap: 14,
    position: 'relative',
  },
  previewRow: {
    gap: 5,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.55,
  },
  previewNameBar: {
    width: 62,
    height: 11,
    borderRadius: 5,
  },
  previewBubble: {
    alignSelf: 'flex-start',
    marginLeft: 34,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '85%',
  },
  previewText: {
    fontSize: 12.5,
  },
  fadeMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 16,
    paddingTop: 12,
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    lineHeight: 17,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 15,
  },
});
