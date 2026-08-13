import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { Eye, Star } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { CHAPTER_GRADIENTS, getChapterGradientIdx, getChapterInitials, getChapterPlace, getChapterStatus, getEventsLabel } from './etaChapterVisuals';
import type { EtaChapterTab } from '../../hooks/useMyEtaChapters';
import type { EtaGroup } from '../../types/etaChapters';
import type { ChapterListView } from './ChapterListControls';

function formatAcceptedAt(iso: string | null): string {
  if (!iso) return 'soon';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'soon';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** One chapter card in the "All Chapters" grid/rows list — matches `ETAChapters_decoded.html`'s
 * LIST section (~line 320) for layout, web's `AllChapterCard` (`my-eta-chapters/page.tsx:1978`)
 * for behavior/copy. Drops the icon-only button web itself renders next to "Member Chat" with
 * no `onClick` — confirmed dead in web, same "don't port non-functional UI" rule as elsewhere. */
export function AllChapterCard({
  chapter,
  tab,
  view,
  isMember,
  pendingAcceptedAt,
  isJoining,
  onOpen,
  onJoin,
  onPreview,
}: {
  chapter: EtaGroup;
  tab: EtaChapterTab;
  view: ChapterListView;
  isMember: boolean;
  pendingAcceptedAt: string | null;
  isJoining: boolean;
  onOpen: () => void;
  onJoin: () => void;
  onPreview: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const grid = view === 'grid';
  const gradientIdx = getChapterGradientIdx(chapter.name);
  const gradient = CHAPTER_GRADIENTS[gradientIdx];
  const initials = getChapterInitials(chapter.name);
  const memberCount = chapter.memberCount ?? 0;
  const eventsLabel = getEventsLabel(chapter.eventCount);
  const status = getChapterStatus(chapter);
  const statusColors = status.tone === 'ok' ? { bg: colors.successSurface, text: colors.success } : { bg: colors.surfaceSunken, text: colors.ink3 };

  return (
    <View
      style={[
        styles.card,
        grid ? styles.cardGrid : styles.cardRow,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl },
      ]}
    >
      <Pressable onPress={onOpen} style={grid ? styles.headGrid : styles.headRow}>
        <View style={[grid ? styles.thumbGrid : styles.thumbRow, { borderRadius: grid ? 0 : radius.lg }]}>
          {chapter.groupImageUrl ? (
            <FastImage source={{ uri: chapter.groupImageUrl, priority: FastImage.priority.normal }} style={StyleSheet.absoluteFillObject} resizeMode={FastImage.resizeMode.cover} />
          ) : (
            <LinearGradient colors={[gradient.from, gradient.to]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          )}
          {grid && <View style={[StyleSheet.absoluteFillObject, styles.gridOverlay]} />}
          <Text style={[fonts.display, grid ? styles.monoGrid : styles.monoRow, { color: '#fff' }]}>{initials}</Text>
          {isMember && (
            <View style={[styles.memberBadge, grid ? styles.memberBadgeGrid : styles.memberBadgeRow, { backgroundColor: colors.goldLight }]}>
              <Star size={8} color="#182E43" fill="#182E43" />
              <Text style={[fonts.bold, styles.memberBadgeText, { color: '#182E43' }]}>PRIMARY</Text>
            </View>
          )}
        </View>

        <View style={grid ? styles.textGrid : styles.textRow}>
          <View style={styles.nameRow}>
            <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>
              {chapter.name}
            </Text>
            <View style={[styles.statusChip, { backgroundColor: statusColors.bg }]}>
              <Text style={[fonts.bold, styles.statusChipText, { color: statusColors.text }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={[fonts.regular, styles.place, { color: colors.ink3 }]} numberOfLines={1}>
            {getChapterPlace(chapter, tab === 'international' ? 'International' : 'Local')}
          </Text>
          <View style={grid ? styles.metaColGrid : styles.metaRow}>
            <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>{memberCount} members</Text>
            {!grid && <View style={[styles.dot, { backgroundColor: colors.border }]} />}
            <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]} numberOfLines={1}>
              {eventsLabel}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionsRow}>
        {pendingAcceptedAt ? (
          <View style={[styles.pendingBadge, { backgroundColor: '#FEF3C7', borderRadius: radius.lg }]}>
            <Text style={[fonts.semibold, styles.pendingText, { color: '#92400E' }]}>Pending until {formatAcceptedAt(pendingAcceptedAt)}</Text>
          </View>
        ) : isMember ? (
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => [styles.joinButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }, pressed && { opacity: 0.75 }]}
          >
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>Member chat</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={onJoin}
              disabled={isJoining}
              style={({ pressed }) => [
                grid ? styles.joinButtonGrid : styles.joinButton,
                { backgroundColor: colors.feedFill, borderRadius: radius.lg, opacity: isJoining ? 0.6 : pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>{isJoining ? 'Joining…' : 'Join'}</Text>
            </Pressable>
            <Pressable
              onPress={onPreview}
              accessibilityLabel="Preview chapter chat"
              style={({ pressed }) => [
                grid ? styles.previewButtonGrid : styles.previewButton,
                { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.lg, borderWidth: borderWidth.thin },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Eye size={14} color={colors.goldDark} strokeWidth={1.6} />
              {!grid && <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.goldDark }]}>Preview</Text>}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  // `flex: 1` alone doesn't force a 2-per-row layout inside a `flexWrap: 'wrap'` row — with no
  // width/basis, Yoga just squeezes every sibling onto one line and shrinks them equally (the
  // "12 me/mb/ers" bug). Grid cards need an explicit percentage width; row/list cards need to
  // fill their (non-wrapping, single-column) parent instead.
  cardGrid: {
    width: '48%',
  },
  cardRow: {
    width: '100%',
  },
  headGrid: {
    flexDirection: 'column',
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
  },
  thumbGrid: {
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbRow: {
    flex: 0,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridOverlay: {
    backgroundColor: 'rgba(12,21,32,0.28)',
  },
  monoGrid: {
    fontSize: 17,
    letterSpacing: 0.5,
  },
  monoRow: {
    fontSize: 14,
  },
  memberBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 20,
  },
  memberBadgeGrid: {
    top: 8,
    right: 8,
  },
  memberBadgeRow: {
    top: -4,
    right: -4,
  },
  memberBadgeText: {
    fontSize: 7,
    letterSpacing: 0.5,
  },
  textGrid: {
    padding: 12,
  },
  textRow: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
  },
  statusChip: {
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusChipText: {
    fontSize: 8,
    letterSpacing: 0.4,
  },
  place: {
    fontSize: 11.5,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaColGrid: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 7,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 13,
  },
  joinButton: {
    flex: 1.4,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonGrid: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
  },
  previewButtonGrid: {
    flex: 0,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: 11,
  },
});
