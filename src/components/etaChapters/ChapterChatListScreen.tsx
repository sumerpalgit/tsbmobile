import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fetchBulkChapterPrefs } from '../../api/eta';
import { CHAPTER_GRADIENTS, getChapterGradientIdx, getChapterInitials, getChapterPlace } from './etaChapterVisuals';
import type { EtaGroup } from '../../types/etaChapters';

/** Chapter-chat switcher — matches `ETAChapters_decoded.html`'s "CHAPTER CHAT LIST" (~line 698).
 * My chapters sorted pinned-first (seeded from `fetchBulkChapterPrefs`, matching web's own
 * mount-time seed for this sort — pinning itself is toggled from the per-chapter notification
 * prefs modal, Phase 4), plus the first 8 not-yet-joined chapters with inline Join, filtered by
 * an un-debounced client-side text match (matches the mockup — this is a local filter over
 * already-fetched lists, not a server search, so no debounce is needed). */
export function ChapterChatListScreen({
  visible,
  myChapters,
  availableChapters,
  onClose,
  onOpenChapter,
  onJoinChapter,
}: {
  visible: boolean;
  myChapters: EtaGroup[];
  availableChapters: EtaGroup[];
  onClose: () => void;
  onOpenChapter: (chapter: EtaGroup) => void;
  onJoinChapter: (chapter: EtaGroup) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    fetchBulkChapterPrefs()
      .then(prefs => setPinnedIds(new Set(prefs.filter(p => p.pinned).map(p => p.groupId))))
      .catch(() => {});
  }, [visible]);

  const sortedMyChapters = useMemo(
    () => [...myChapters].sort((a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id))),
    [myChapters, pinnedIds],
  );

  const trimmedQuery = query.trim().toLowerCase();
  const filteredAvailable = useMemo(
    () => availableChapters.filter(c => !trimmedQuery || c.name.toLowerCase().includes(trimmedQuery)).slice(0, 8),
    [availableChapters, trimmedQuery],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <Pressable onPress={onClose} accessibilityLabel="Back" style={styles.backButton}>
            <ChevronLeft size={20} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.ink3 }]}>MEMBER CHAT</Text>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>My ETA Chapters</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {sortedMyChapters.map(chapter => (
            <Pressable key={chapter.id} onPress={() => onOpenChapter(chapter)} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <ChapterAvatar name={chapter.name} size={46} />
              <View style={styles.rowText}>
                <Text style={[fonts.bold, styles.rowName, { color: colors.ink }]} numberOfLines={1}>
                  {chapter.name}
                </Text>
                <View style={styles.presenceRow}>
                  <View style={[styles.presenceDot, { backgroundColor: colors.success }]} />
                  <Text style={[fonts.regular, styles.rowSub, { color: colors.ink3 }]} numberOfLines={1}>
                    {getChapterPlace(chapter, 'Chapter')} · Active now
                  </Text>
                </View>
              </View>
              <ChevronRight size={13} color={colors.ink3} strokeWidth={1.6} />
            </Pressable>
          ))}

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[fonts.bold, styles.dividerLabel, { color: colors.ink3 }]}>AVAILABLE</Text>
          </View>

          <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl }]}>
            <Search size={14} color={colors.ink3} strokeWidth={1.6} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search chapters…"
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.searchInput, { fontSize: fontSize.body, color: colors.ink }]}
            />
          </View>

          {filteredAvailable.map(chapter => (
            <View key={chapter.id} style={[styles.availableRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <ChapterAvatar name={chapter.name} size={38} />
              <Text style={[fonts.bold, styles.availableName, { color: colors.ink }]} numberOfLines={1}>
                {chapter.name}
              </Text>
              <Pressable onPress={() => onJoinChapter(chapter)}>
                <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>Join</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ChapterAvatar({ name, size }: { name: string; size: number }) {
  const gradient = CHAPTER_GRADIENTS[getChapterGradientIdx(name)];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: gradient.from, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'DMSerifDisplay-Regular', fontSize: size * 0.32, color: '#fff' }}>{getChapterInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 1,
  },
  title: {
    fontSize: 17,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 14,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  presenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowSub: {
    fontSize: 11.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  dividerLine: {
    width: 14,
    height: 1,
  },
  dividerLabel: {
    fontSize: 10,
    letterSpacing: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 42,
    paddingHorizontal: 13,
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  availableName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
  },
});
