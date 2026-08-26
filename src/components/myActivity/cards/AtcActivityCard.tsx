import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lightbulb, MessageSquareQuote } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { MiniCardShell } from './MiniCardShell';
import { MetricStrip } from './MetricStrip';
import { resolveCardCta } from './resolveCardCta';
import type { AtcItem } from '../../../types/home';
import type { FeedComment } from '../../../api/feed';
import type { MiniCardCommonProps } from './cardProps';

/** `atc_role_types` values → the label shown in the "Asking" metric — matches
 * `AtcMiniCard.tsx`'s `ROLE_LABEL` map. */
const ROLE_LABEL: Record<string, string> = {
  searcher: 'Searchers',
  investor: 'Investors',
  lender: 'Lenders',
  advisor: 'Advisors',
  seller: 'Sellers',
  operator: 'Operators',
  intermediary: 'Intermediaries',
  student: 'Students',
};

function askingLabel(roles: string[]): string {
  if (roles.length === 0) return 'All roles';
  if (roles.length === 1) return ROLE_LABEL[roles[0].toLowerCase()] ?? roles[0];
  return `${roles.length} roles`;
}

/** Ask the Community, for My Activity — matches `AtcMiniCard.tsx`: a "Top Reply" box (the first
 * non-AI comment, or an empty-state prompt) instead of a description, and a Replies/Views/Asking
 * metric strip. `view_count` has no confirmed field on mobile's `AtcItem` (unlike web's raw
 * shape) — shown as "—" rather than fabricated, same convention as this app's other unconfirmed-
 * field fallbacks. "Reply" opens the same comment composer the footer's comment count button
 * does (both point at the same action on web too — a `tsb:viewpost` full-post sheet mobile
 * doesn't have yet, per the plan's Decision 12; reusing the comment composer is the closest real
 * functionality already built, not a guess). `showOwnerPill={false}` — `AtcMiniCard.tsx` has no
 * owner-pill branch at all, so the question's own author still sees the Reply button, not "Your
 * post" (confirmed against web source; matches `JobMiniCard`'s same exception). */
export function AtcActivityCard({
  item,
  comments,
  ...common
}: MiniCardCommonProps & { item: AtcItem; comments: FeedComment[] }) {
  const { colors, fonts } = useTheme();
  const topReply = comments.find(c => !c.is_ai);

  return (
    <MiniCardShell
      feedId={common.feedId}
      username={common.profile.username}
      isOwner={common.isOwner}
      onHide={common.onHide}
      onDeleted={common.onDeleted}
      avatarName={common.profile.name}
      avatarImg={common.profile.profile_img}
      roleType={common.profile.role_type}
      subCategory={common.profile.sub_category}
      company={common.profile.organization}
      city={common.profile.city}
      createdAt={common.createdAt}
      PillIcon={Lightbulb}
      pillLabel="Ask the Community"
      title={item.question_title || item.question_description}
      chips={[{ label: 'Open Question', variant: 'gold' }]}
      statusBarSlot={common.statusBarSlot}
      liked={common.liked}
      likeCount={common.likeCount}
      onLike={common.onLike}
      commentCount={comments.length}
      onComment={common.onComment}
      ctaSlot={resolveCardCta({
        activeTab: common.activeTab,
        isOwner: common.isOwner,
        totalRequestCount: common.totalRequestCount,
        onViewRequests: common.onViewRequests,
        onViewRequest: common.onViewRequest,
        showOwnerPill: false,
        nativeAction: (
          <Pressable onPress={common.onComment} style={[styles.replyButton, { backgroundColor: colors.gold }]}>
            <MessageSquareQuote size={12} color="#fff" strokeWidth={2} />
            <Text style={[fonts.semibold, styles.replyLabel]}>Reply</Text>
          </Pressable>
        ),
      })}
    >
      <View style={[styles.topReply, { backgroundColor: colors.surfaceSunken, borderColor: colors.creamDark }]}>
        {topReply ? (
          <>
            <Text style={[fonts.bold, styles.topReplyLabel, { color: colors.ink3 }]}>TOP REPLY</Text>
            <Text style={[fonts.regular, styles.topReplyText, { color: colors.ink2 }]} numberOfLines={2}>
              {topReply.content}
            </Text>
            <Text style={[fonts.regular, styles.topReplyBy, { color: colors.ink3 }]}>— {topReply.profile.name}</Text>
          </>
        ) : (
          <Text style={[fonts.regular, styles.emptyReply, { color: colors.ink3 }]}>Be the first to reply</Text>
        )}
      </View>

      <MetricStrip
        metrics={[
          { label: 'Replies', value: String(comments.filter(c => !c.is_ai).length) },
          { label: 'Views', value: '—' },
          { label: 'Asking', value: askingLabel(item.atc_role_types ?? []) },
        ]}
      />
    </MiniCardShell>
  );
}

const styles = StyleSheet.create({
  topReply: {
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 3,
  },
  topReplyLabel: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
  topReplyText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  topReplyBy: {
    fontSize: 10.5,
  },
  emptyReply: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 4,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  replyLabel: {
    fontSize: 11.5,
    color: '#fff',
  },
});
