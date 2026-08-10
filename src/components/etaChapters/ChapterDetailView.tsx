import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fetchChapterEvents } from '../../api/eta';
import { CHAPTER_GRADIENTS, getChapterGradientIdx, getChapterPlace } from './etaChapterVisuals';
import { MAX_ACTIVE_ETA_CHAPTERS } from './PrimaryMembershipsBanner';
import type { EtaChapterTab } from '../../hooks/useMyEtaChapters';
import type { ChapterEvent, EtaGroup } from '../../types/etaChapters';

/** Full-screen chapter detail — real content only. Matches `ETAChapters_decoded.html`'s
 * "CHAPTER DETAIL" overlay (~line 405) for layout, but drops its "Chapter lead"/tags cards (no
 * `lead`/`tags` field exists on the real `Group` type) and its fictional 3-tier badge/notice
 * copy ("Primary member" vs "Observer" vs not-a-member — the mockup invents a distinct
 * "joined-but-not-primary observer" state; the real system only has member/not-member, and
 * being a member always means primary, per web's own footer copy "Primary member · Can post &
 * participate"). Also has no reachable trigger in the mockup itself (`detailId` is only ever set
 * to `null` in the source) — wired here to a natural tap target instead (see `EtaChaptersScreen`).
 * `shareDetail` fakes a clipboard toast on web's mockup; this uses RN's real native `Share` API
 * instead, a straightforward improvement over a placeholder-grade stub, not new scope. */
export function ChapterDetailView({
  visible,
  chapter,
  tab,
  isMember,
  primaryUsedCount,
  pendingAcceptedAt,
  isJoining,
  isLeaving,
  onClose,
  onJoin,
  onOpenChat,
  onPreview,
  onLeave,
}: {
  visible: boolean;
  chapter: EtaGroup | null;
  tab: EtaChapterTab;
  isMember: boolean;
  /** How many of the user's 3 primary slots are currently in use — drives the "you're at your
   * limit" notice copy for non-members. Not `chapter`-specific, the caller's `myChapters.length`. */
  primaryUsedCount: number;
  pendingAcceptedAt: string | null;
  isJoining: boolean;
  isLeaving: boolean;
  onClose: () => void;
  onJoin: () => void;
  onOpenChat: () => void;
  onPreview: () => void;
  onLeave: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [nextEvent, setNextEvent] = useState<ChapterEvent | null>(null);

  useEffect(() => {
    if (!visible || !chapter) {
      setNextEvent(null);
      return;
    }
    let cancelled = false;
    fetchChapterEvents([chapter.id])
      .then(events => {
        if (cancelled) return;
        const now = Date.now();
        const upcoming = events
          .filter(e => e.startDate && new Date(e.startDate).getTime() > now)
          .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
        setNextEvent(upcoming[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setNextEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, chapter]);

  if (!chapter) return null;

  const gradient = CHAPTER_GRADIENTS[getChapterGradientIdx(chapter.name)];
  const foundedYear = (() => {
    const d = new Date(chapter.createdAt);
    return Number.isNaN(d.getTime()) ? '—' : String(d.getFullYear());
  })();

  const stats = [
    { n: String(chapter.memberCount ?? 0), label: 'Members' },
    { n: String(chapter.eventCount ?? 0), label: 'Meetups' },
    { n: foundedYear, label: 'Founded' },
  ];

  const badgeLabel = isMember ? 'Primary member' : tab === 'international' ? 'International' : 'Local chapter';
  const atCap = !isMember && !pendingAcceptedAt && primaryUsedCount >= MAX_ACTIVE_ETA_CHAPTERS;
  const notice = isMember
    ? "You're a member here — you can post, RSVP and join chapter discussions."
    : pendingAcceptedAt
    ? ''
    : atCap
    ? "Joining lets you post, RSVP and participate — you're at your 3-chapter limit, so joining will ask you to replace one."
    : 'Joining lets you post, RSVP and participate in chapter discussions.';

  const nextMeetupText = nextEvent
    ? `${nextEvent.title ?? 'Meetup'}${nextEvent.location ? ` · ${nextEvent.location}` : ''}`
    : 'No meetup scheduled yet';

  const handleShare = () => {
    Share.share({ message: `Check out the ${chapter.name} ETA Chapter on TSB.` }).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <Pressable onPress={onClose} accessibilityLabel="Back" style={styles.headerButton}>
            <ArrowLeft size={18} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
          <Text style={[fonts.semibold, styles.headerTitle, { color: colors.ink2 }]} numberOfLines={1}>
            {chapter.name} chapter
          </Text>
          <Pressable onPress={handleShare} accessibilityLabel="Share" style={styles.headerButton}>
            <Share2 size={16} color={colors.ink2} strokeWidth={1.6} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.cover}>
            {chapter.groupImageUrl ? (
              <FastImage source={{ uri: chapter.groupImageUrl, priority: FastImage.priority.normal }} style={StyleSheet.absoluteFillObject} resizeMode={FastImage.resizeMode.cover} />
            ) : (
              <LinearGradient colors={[gradient.from, gradient.to]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            )}
            <View style={[StyleSheet.absoluteFillObject, styles.coverOverlay]} />
            <View style={styles.coverText}>
              <View style={[styles.badge, { backgroundColor: isMember ? colors.goldLight : 'rgba(255,255,255,0.2)' }]}>
                <Text style={[fonts.bold, styles.badgeText, { color: isMember ? '#182E43' : '#fff' }]}>{badgeLabel.toUpperCase()}</Text>
              </View>
              <Text style={[fonts.display, styles.coverName, { color: '#fff' }]}>{chapter.name}</Text>
              <Text style={[fonts.regular, styles.coverPlace, { color: 'rgba(255,255,255,0.78)' }]}>{getChapterPlace(chapter, 'Chapter')}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={[styles.statsRow, { backgroundColor: colors.border, borderColor: colors.border, borderRadius: radius.xl }]}>
              {stats.map(s => (
                <View key={s.label} style={[styles.statCell, { backgroundColor: colors.surface }]}>
                  <Text style={[fonts.display, styles.statNumber, { color: colors.ink }]}>{s.n}</Text>
                  <Text style={[fonts.bold, styles.statLabel, { color: colors.ink3 }]}>{s.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>

            {!!chapter.description && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
                <Text style={[fonts.bold, styles.cardLabel, { color: colors.ink3 }]}>ABOUT</Text>
                <Text style={[fonts.regular, styles.cardBody, { color: colors.ink2 }]}>{chapter.description}</Text>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
              <View style={styles.nextMeetupRow}>
                <View style={[styles.iconWell, { backgroundColor: colors.chip, borderRadius: radius.lg }]}>
                  <Calendar size={16} color={colors.goldDark} strokeWidth={1.6} />
                </View>
                <View style={styles.nextMeetupBody}>
                  <Text style={[fonts.bold, styles.cardLabel, { color: colors.ink3 }]}>NEXT MEETUP</Text>
                  <Text style={[fonts.semibold, styles.nextMeetupText, { color: colors.ink }]}>{nextMeetupText}</Text>
                </View>
              </View>
            </View>

            {!!notice && (
              <View style={[styles.noticeRow, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
                <Text style={[fonts.regular, styles.noticeText, { color: colors.ink2 }]}>{notice}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
          {isMember ? (
            <Pressable
              onPress={onLeave}
              disabled={isLeaving}
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, opacity: isLeaving ? 0.6 : 1 }]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.danger }]}>{isLeaving ? 'Leaving…' : 'Leave chapter'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onPreview} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl }]}>
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Preview</Text>
            </Pressable>
          )}

          <Pressable
            onPress={isMember ? onOpenChat : onJoin}
            disabled={isJoining || !!pendingAcceptedAt}
            style={[styles.primaryButton, { backgroundColor: colors.gold, borderRadius: radius.xl, opacity: isJoining || pendingAcceptedAt ? 0.6 : 1 }]}
          >
            <Text style={[fonts.bold, { fontSize: fontSize.title, color: '#fff' }]}>
              {pendingAcceptedAt ? 'Pending' : isMember ? 'Open member chat' : isJoining ? 'Joining…' : 'Join chapter'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  headerButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  cover: {
    height: 172,
    justifyContent: 'flex-end',
  },
  coverOverlay: {
    backgroundColor: 'rgba(12,21,32,0.35)',
  },
  coverText: {
    padding: 16,
    paddingBottom: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  coverName: {
    fontSize: 26,
    marginTop: 8,
  },
  coverPlace: {
    fontSize: 11.5,
    marginTop: 4,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 1,
    overflow: 'hidden',
    borderWidth: 1,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 11,
  },
  statNumber: {
    fontSize: 17,
  },
  statLabel: {
    fontSize: 8.5,
    letterSpacing: 0.8,
  },
  card: {
    padding: 14,
  },
  cardLabel: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  cardBody: {
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 6,
  },
  nextMeetupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextMeetupBody: {
    flex: 1,
    minWidth: 0,
  },
  nextMeetupText: {
    fontSize: 12.5,
    marginTop: 4,
  },
  noticeRow: {
    padding: 13,
  },
  noticeText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    gap: 9,
    padding: 16,
  },
  secondaryButton: {
    flex: 0,
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
