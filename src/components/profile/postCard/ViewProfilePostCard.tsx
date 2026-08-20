import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, Heart, MapPin, MessageCircle, MoreVertical, Quote } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import type { FeedEngagement, FeedItem } from '../../../api/feed';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { getPostCardContent, PostCardChip } from './postCardContent';
import { PostCardMenuSheet } from './PostCardMenuSheet';

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * View Profile's Posts tab card — REBUILT (2026-08-20, 3rd pass) to match web's REAL mini-card
 * shell exactly, read directly from `webSrc/app/dashboard/components/mini-cards/*.tsx` rather
 * than a research-fork's paraphrase. Two structural bugs from the previous pass are fixed here:
 *
 * 1. The dark band ("navy band" on web) only ever contains a pill (icon+label) + title + up to 2
 *    chips — NOT the description/event-rows/top-reply/poll-options, which the previous pass
 *    wrongly rendered inside it. All of that "special body" content actually lives in a separate
 *    WHITE section below the dark band, ending in a 3-column metric strip (poll is the one
 *    exception — it has a vote tally row instead of a metric strip).
 * 2. The dark band is a FLAT solid fill (`var(--tsb-accent-solid)`, `colors.hero1` here) — not a
 *    gradient. The previous pass used a `LinearGradient` (hero1→hero2), which doesn't match; web
 *    has no gradient anywhere on this card. (Web's dark band also has a decorative radial-gradient
 *    glow in the top-right corner — skipped here as a reasonable simplification: RN has no radial
 *    gradient primitive without another dependency, and it's purely decorative.)
 *
 * Per-`feed_type` content (pill icon/label, header badge style, chips, body kind, metrics) comes
 * from `postCardContent.ts`, mapped directly against the real mini-card source for all 8 feed
 * types (`AtcMiniCard`, `PollMiniCard`, `EventMiniCard`, `JobMiniCard`, `DealCapitalMiniCard`/
 * `DealBuyerMiniCard`, `SearchCapitalMiniCard`, `BackSearcherMiniCard`/`InvestInADealMiniCard`,
 * `FindMyMatchMiniCard`) — see that file's own doc comment for the header-badge/role-row/chip
 * variant reasoning.
 *
 * Footer always shows a static "Your post"/"Your event" pill instead of the real per-type CTA
 * (Reply/RSVP/Apply Now/Cast Vote/...) — this tab only ever shows the signed-in user's own posts,
 * and a live-looking CTA that calls nothing would be dead UI. Likes/comments show real counts but
 * aren't tappable (no tap-to-like/comment anywhere in this app yet — matches this tab's
 * established read-only scope). The 3-dot menu's real actions (delete/hide/copy link) ARE wired —
 * see `PostCardMenuSheet.tsx`.
 */
export function ViewProfilePostCard({
  feedItem,
  engagement,
  onHide,
  onDeleted,
}: {
  feedItem: FeedItem;
  engagement: FeedEngagement | undefined;
  onHide: () => void;
  onDeleted: () => void;
}) {
  const { colors, fonts, borderWidth, elevation } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const content = getPostCardContent(feedItem, engagement);
  const likeCount = engagement?.likes.count ?? 0;
  const commentCount = engagement?.comments.length ?? 0;
  const PillIcon = content.pillIcon;

  const roleLabel = feedItem.profile.role_type ? capitalize(feedItem.profile.role_type) : '';
  const metaLine = [...content.metaParts, formatRelativeTime(feedItem.created_at)].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin }, elevation('sm')]}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Avatar name={feedItem.profile.name} imageUri={feedItem.profile.profile_img} size={38} />
        <View style={styles.headerMeta}>
          <View style={styles.nameRow}>
            <Text style={[fonts.bold, styles.author, { color: colors.ink }]} numberOfLines={1}>
              {feedItem.profile.name}
            </Text>
            {content.headerBadge.kind !== 'none' && (
              <HeaderBadge kind={content.headerBadge.kind} text={content.headerBadge.text} />
            )}
          </View>

          {(roleLabel || content.roleRowCombo) && (
            <View style={styles.roleRow}>
              {!!roleLabel && <Text style={[fonts.bold, styles.roleText, { color: content.roleColor }]}>{roleLabel}</Text>}
              {content.roleRowCombo && !!feedItem.profile.sub_category && (
                <>
                  <Text style={[styles.roleDivider, { color: colors.border }]}> | </Text>
                  <Text style={[fonts.semibold, styles.subCategoryComboText, { color: colors.ink3 }]}>{feedItem.profile.sub_category}</Text>
                </>
              )}
            </View>
          )}

          {!!metaLine && (
            <Text style={[fonts.regular, styles.meta, { color: colors.ink3 }]} numberOfLines={1}>
              {metaLine}
            </Text>
          )}
        </View>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.menuButton}>
          <MoreVertical size={15} color={colors.ink3} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* ── DARK BAND ──────────────────────────────────────────────────── */}
      <View style={[styles.darkBand, { backgroundColor: colors.hero1 }]}>
        <View style={styles.pill}>
          <PillIcon size={11} color={colors.goldLight} strokeWidth={1.8} />
          <Text style={[fonts.regular, styles.pillText]}>{content.pillLabel}</Text>
        </View>

        <Text style={[fonts.display, styles.title]} numberOfLines={content.titleClampLines}>
          {content.title}
        </Text>

        {content.chips.length > 0 && (
          <View style={styles.chipsRow}>
            {content.chips.map(chip => (
              <Chip key={chip.text} chip={chip} colors={colors} />
            ))}
          </View>
        )}
      </View>

      {/* ── WHITE BODY ─────────────────────────────────────────────────── */}
      <View style={styles.whiteBody}>
        {content.bodyKind === 'description' && !!content.description && (
          <Text style={[fonts.regular, styles.description, { color: colors.ink2 }]} numberOfLines={3}>
            {content.description}
          </Text>
        )}

        {content.bodyKind === 'event' && content.event && (
          <View style={styles.eventBlock}>
            <View style={styles.eventRow}>
              <View style={[styles.eventIconBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
                <Calendar size={13} color={colors.goldDark} strokeWidth={1.6} />
              </View>
              <View style={styles.eventTextCol}>
                <Text style={[fonts.bold, styles.eventPrimary, { color: colors.ink }]} numberOfLines={1}>{content.event.dateLabel}</Text>
                {!!content.event.timeLabel && (
                  <Text style={[fonts.regular, styles.eventSecondary, { color: colors.ink3 }]} numberOfLines={1}>{content.event.timeLabel}</Text>
                )}
              </View>
            </View>
            <View style={styles.eventRow}>
              <View style={[styles.eventIconBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
                <MapPin size={13} color={colors.goldDark} strokeWidth={1.6} />
              </View>
              <View style={styles.eventTextCol}>
                <Text style={[fonts.bold, styles.eventPrimary, { color: colors.ink }]} numberOfLines={1}>{content.event.location}</Text>
              </View>
            </View>
          </View>
        )}

        {content.bodyKind === 'atc' && content.atc && (
          content.atc.hasReply ? (
            <View style={[styles.topReplyTile, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
              <View style={styles.topReplyLabelRow}>
                <Quote size={10} color={colors.goldDark} strokeWidth={2} />
                <Text style={[fonts.bold, styles.topReplyLabel, { color: colors.ink3 }]}>TOP REPLY</Text>
              </View>
              <Text style={[fonts.regular, styles.topReplyText, { color: colors.ink2 }]} numberOfLines={2}>
                {content.atc.text}
              </Text>
              <Text style={[fonts.regular, styles.topReplyByline, { color: colors.ink3 }]} numberOfLines={1}>
                — <Text style={[fonts.bold, { color: colors.ink }]}>{content.atc.author}</Text>
                {content.atc.role ? ` · ${content.atc.role}` : ''}
              </Text>
            </View>
          ) : (
            <View style={[styles.topReplyTile, styles.topReplyEmpty, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
              <Text style={[fonts.regular, styles.topReplyEmptyText, { color: colors.ink3 }]}>Be the first to reply</Text>
            </View>
          )
        )}

        {content.bodyKind === 'poll' && content.poll && (
          <View style={styles.pollOptions}>
            {content.poll.options.map(opt => (
              <View key={opt.label} style={[styles.pollRow, { borderColor: colors.border }]}>
                {content.poll!.hasVoted && (
                  <View style={[styles.pollFill, { width: `${opt.pct}%`, backgroundColor: colors.surfaceSunken }]} />
                )}
                <View style={[styles.pollRadio, { borderColor: colors.border }]} />
                <Text style={[fonts.regular, styles.pollLabel, { color: colors.ink }]} numberOfLines={1}>{opt.label}</Text>
                {content.poll!.hasVoted && (
                  <Text style={[fonts.bold, styles.pollPct, { color: colors.ink }]}>{opt.pct}%</Text>
                )}
              </View>
            ))}
            <View style={[styles.pollTally, { borderTopColor: colors.border }]}>
              <Text style={[fonts.regular, styles.pollTallyText, { color: colors.ink3 }]}>
                <Text style={[fonts.bold, { color: colors.ink }]}>{content.poll.totalVotes}</Text> votes
              </Text>
            </View>
          </View>
        )}

        {content.metrics.length > 0 && (
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            {content.metrics.map((s, i) => (
              <View
                key={s.label}
                style={[
                  styles.statCell,
                  i < content.metrics.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border, paddingRight: 8 },
                  i > 0 && { paddingLeft: 10 },
                ]}
              >
                <View style={[styles.statDash, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.semibold, styles.statLabel, { color: colors.ink3 }]} numberOfLines={1}>{s.label.toUpperCase()}</Text>
                <Text style={[fonts.bold, styles.statValue, { color: colors.ink }]} numberOfLines={1}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <View style={styles.footerStat}>
          <Heart size={13} color={colors.ink3} strokeWidth={1.7} />
          <Text style={[fonts.regular, styles.footerStatText, { color: colors.ink3 }]}>{likeCount}</Text>
        </View>
        <View style={styles.footerStat}>
          <MessageCircle size={13} color={colors.ink3} strokeWidth={1.7} />
          <Text style={[fonts.regular, styles.footerStatText, { color: colors.ink3 }]}>{commentCount}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.ownerPill, { backgroundColor: colors.surfaceSunken }]}>
          <Text style={[fonts.bold, styles.ownerPillText, { color: colors.ink3 }]}>{content.footerNote}</Text>
        </View>
      </View>

      <PostCardMenuSheet
        visible={menuOpen}
        feedId={feedItem.id}
        onClose={() => setMenuOpen(false)}
        onHide={onHide}
        onDeleted={onDeleted}
      />
    </View>
  );
}

function HeaderBadge({ kind, text }: { kind: 'pill' | 'dot'; text: string }) {
  const { colors, fonts } = useTheme();
  if (kind === 'pill') {
    return (
      <View style={[styles.badgePill, { backgroundColor: colors.chip, borderColor: 'rgba(176,138,46,0.3)' }]}>
        <View style={[styles.badgeDot, { backgroundColor: colors.gold }]} />
        <Text style={[fonts.bold, styles.badgePillText, { color: colors.goldDark }]}>{text}</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeDotRow}>
      <View style={[styles.badgeDot, { backgroundColor: colors.gold }]} />
      <Text style={[fonts.bold, styles.badgeDotText, { color: colors.goldDark }]}>{text}</Text>
    </View>
  );
}

function Chip({ chip, colors }: { chip: PostCardChip; colors: ReturnType<typeof useTheme>['colors'] }) {
  const { fonts } = useTheme();
  const goldStyle = { color: colors.goldDark, backgroundColor: colors.chip, borderColor: 'rgba(176,138,46,0.3)' };
  const mutedStyle = { color: 'rgba(255,255,255,0.92)', backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.35)' };
  const s = chip.variant === 'gold' ? goldStyle : mutedStyle;
  return (
    <View style={[styles.chip, { backgroundColor: s.backgroundColor, borderColor: s.borderColor }]}>
      <Text style={[fonts.bold, styles.chipText, { color: s.color }]}>{chip.text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 11 },
  headerMeta: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  author: { fontSize: 13 },
  roleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  roleText: { fontSize: 10, letterSpacing: 0.5 },
  roleDivider: { fontSize: 10 },
  subCategoryComboText: { fontSize: 11 },
  meta: { fontSize: 10.5, marginTop: 2 },
  menuButton: { flexShrink: 0, width: 26, height: 26, alignItems: 'center', justifyContent: 'center', marginTop: 1 },

  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexShrink: 0 },
  badgePillText: { fontSize: 8, letterSpacing: 0.5 },
  badgeDotRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  badgeDotText: { fontSize: 8.5, letterSpacing: 0.6 },
  badgeDot: { width: 4.5, height: 4.5, borderRadius: 2.5, flexShrink: 0 },

  darkBand: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 14, gap: 9 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  pillText: { fontSize: 10, color: 'rgba(255,255,255,0.92)' },
  title: { fontSize: 17, lineHeight: 21, color: '#fff', letterSpacing: -0.25 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 8.5, letterSpacing: 0.6 },

  whiteBody: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 11, gap: 8 },
  description: { fontSize: 12, lineHeight: 19 },

  eventBlock: { gap: 7 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  eventIconBox: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, flexShrink: 0 },
  eventTextCol: { flex: 1, minWidth: 0 },
  eventPrimary: { fontSize: 12 },
  eventSecondary: { fontSize: 10.5, marginTop: 1 },

  topReplyTile: { borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, padding: 9 },
  topReplyLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  topReplyLabel: { fontSize: 8, letterSpacing: 0.7 },
  topReplyText: { fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 3 },
  topReplyByline: { fontSize: 9.5, marginTop: 4 },
  topReplyEmpty: { alignItems: 'center', paddingVertical: 10 },
  topReplyEmptyText: { fontSize: 11, fontStyle: 'italic' },

  pollOptions: { gap: 4 },
  pollRow: { position: 'relative', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 6, minHeight: 30 },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 8 },
  pollRadio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  pollLabel: { flex: 1, fontSize: 11.5 },
  pollPct: { fontSize: 11 },
  pollTally: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, marginTop: 2 },
  pollTallyText: { fontSize: 11 },

  statsRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11 },
  statCell: { flex: 1, minWidth: 0 },
  statDash: { width: 16, height: 2.5, borderRadius: 2, marginBottom: 5 },
  statLabel: { fontSize: 8, letterSpacing: 0.6 },
  statValue: { fontSize: 11.5, marginTop: 2, letterSpacing: -0.15 },

  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 11, paddingHorizontal: 13 },
  footerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerStatText: { fontSize: 11 },
  ownerPill: { height: 28, paddingHorizontal: 11, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ownerPillText: { fontSize: 10.5 },
});
