import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { MessageSquare, Settings, Star } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { CHAPTER_GRADIENTS, getChapterGradientIdx, getChapterPlace, getEventsLabel } from './etaChapterVisuals';
import type { EtaGroup } from '../../types/etaChapters';

/** "My chapters" horizontal carousel — matches `ETAChapters_decoded.html` (~line 220). Real
 * fields only (`memberCount`/`eventCount`/`city`/`countryCode`) — no fabricated "going" faces or
 * lead/tags, same simplification precedent as My Events. */
export function MyChaptersCarousel({
  chapters,
  onOpenChatList,
  onChat,
  onSettings,
}: {
  chapters: EtaGroup[];
  onOpenChatList: () => void;
  onChat: (chapter: EtaGroup) => void;
  onSettings: (chapter: EtaGroup) => void;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();

  if (chapters.length === 0) return null;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[fonts.display, styles.sectionTitle, { color: colors.ink }]}>My chapters</Text>
        <Pressable
          onPress={onOpenChatList}
          accessibilityRole="button"
          accessibilityLabel="Open my chapter chats"
          style={[styles.countBadge, { backgroundColor: colors.chip, borderRadius: radius.sm }]}
        >
          <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>{chapters.length}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {chapters.map(chapter => (
          <MyChapterCard key={chapter.id} chapter={chapter} onChat={() => onChat(chapter)} onSettings={() => onSettings(chapter)} />
        ))}
      </ScrollView>
    </View>
  );
}

function MyChapterCard({ chapter, onChat, onSettings }: { chapter: EtaGroup; onChat: () => void; onSettings: () => void }) {
  const { colors, fonts, fontSize, radius, elevation } = useTheme();
  const gradientIdx = getChapterGradientIdx(chapter.name);
  const gradient = CHAPTER_GRADIENTS[gradientIdx];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl }, elevation('sm')]}>
      <View style={styles.cover}>
        {chapter.groupImageUrl ? (
          <FastImage source={{ uri: chapter.groupImageUrl, priority: FastImage.priority.normal }} style={StyleSheet.absoluteFillObject} resizeMode={FastImage.resizeMode.cover} />
        ) : (
          <LinearGradient colors={[gradient.from, gradient.to]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        <View style={[StyleSheet.absoluteFillObject, styles.coverOverlay]} />
        <View style={[styles.primaryBadge, { backgroundColor: colors.goldLight }]}>
          <Star size={9} color="#182E43" fill="#182E43" />
          <Text style={[fonts.bold, styles.primaryBadgeText, { color: '#182E43' }]}>PRIMARY</Text>
        </View>
        <View style={styles.coverText}>
          <Text style={[fonts.display, styles.chapterName, { color: '#fff' }]} numberOfLines={1}>
            {chapter.name}
          </Text>
          <Text style={[fonts.regular, styles.chapterPlace, { color: 'rgba(255,255,255,0.78)' }]} numberOfLines={1}>
            {getChapterPlace(chapter, 'Chapter')}
          </Text>
        </View>
      </View>

      <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
        <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink }]}>{chapter.memberCount ?? 0} members</Text>
        <View style={[styles.dot, { backgroundColor: colors.border }]} />
        <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]}>{getEventsLabel(chapter.eventCount)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onChat}
          style={({ pressed }) => [styles.chatButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }, pressed && { opacity: 0.7 }]}
        >
          <MessageSquare size={14} color={colors.feedOnFill} strokeWidth={1.6} />
          <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>Chat</Text>
        </Pressable>
        <Pressable
          onPress={onSettings}
          accessibilityLabel="Chapter settings"
          style={({ pressed }) => [
            styles.settingsButton,
            { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Settings size={16} color={colors.ink2} strokeWidth={1.6} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scrollContent: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  card: {
    width: 246,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    height: 130,
  },
  coverOverlay: {
    backgroundColor: 'rgba(12,21,32,0.35)',
  },
  primaryBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  coverText: {
    position: 'absolute',
    left: 13,
    right: 13,
    bottom: 10,
  },
  chapterName: {
    fontSize: 20,
  },
  chapterPlace: {
    fontSize: 10.5,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    paddingTop: 8,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 38,
  },
  settingsButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
