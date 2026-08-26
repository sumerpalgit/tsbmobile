import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart3, Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { MiniCardShell } from './MiniCardShell';
import { resolveCardCta } from './resolveCardCta';
import type { PollItem } from '../../../types/home';
import type { MiniCardCommonProps } from './cardProps';

/** Poll, for My Activity — matches `PollMiniCard.tsx`'s option-rows + tally-row body (no
 * metric strip, no description) and its 3-state CTA cycle (Cast Vote → View results → Edit
 * vote), which doesn't fit the shared `MiniCardActionButton`'s idle/loading/done shape so it's
 * bespoke here. Vote submission itself is fire-and-forget (`onVote`, the same
 * `useMutation`-backed `submitPollVote` every other screen uses) — no local optimistic tally
 * math, matching this app's "invalidate + refetch" convention rather than web's own manual
 * `poll_results` splicing. */
export function PollActivityCard({
  item,
  onVote,
  ...common
}: MiniCardCommonProps & { item: PollItem; onVote: (optionIndex: number) => void }) {
  const { colors, fonts } = useTheme();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(item.user_voted_index ?? null);
  const [showResults, setShowResults] = useState(item.user_voted_index != null);

  const results = item.poll_results ?? [];
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
  const leaderIdx = results.reduce((best, r, i) => (r.votes > (results[best]?.votes ?? -1) ? i : best), 0);

  const handleCta = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (selectedIdx === null) return;
    if (item.user_voted_index !== selectedIdx) onVote(selectedIdx);
    setShowResults(true);
  };

  const ctaLabel = showResults ? 'Edit vote' : selectedIdx !== null ? 'View results' : 'Cast Vote';
  const CtaIcon = showResults ? RotateCcw : Check;

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
      PillIcon={BarChart3}
      pillLabel="Community Poll"
      title={item.question}
      statusBarSlot={common.statusBarSlot}
      liked={common.liked}
      likeCount={common.likeCount}
      onLike={common.onLike}
      commentCount={common.commentCount}
      onComment={common.onComment}
      ctaSlot={resolveCardCta({
        activeTab: common.activeTab,
        isOwner: common.isOwner,
        totalRequestCount: common.totalRequestCount,
        onViewRequests: common.onViewRequests,
        onViewRequest: common.onViewRequest,
        nativeAction: (
          <Pressable
            onPress={handleCta}
            disabled={selectedIdx === null && !showResults}
            style={[
              styles.ctaButton,
              { backgroundColor: selectedIdx === null && !showResults ? colors.creamBorderBold : colors.gold },
            ]}
          >
            <CtaIcon size={11} color="#fff" strokeWidth={2.2} />
            <Text style={[fonts.semibold, styles.ctaLabel]}>{ctaLabel}</Text>
          </Pressable>
        ),
      })}
    >
      <View style={styles.options}>
        {item.options.map((option, i) => {
          const votes = results[i]?.votes ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const chosen = selectedIdx === i;
          const isLeader = showResults && totalVotes > 0 && i === leaderIdx;
          return (
            <Pressable
              key={option}
              disabled={showResults}
              onPress={() => setSelectedIdx(i)}
              style={[styles.option, { backgroundColor: colors.surfaceSunken, borderColor: chosen ? colors.gold : colors.feedCardLine }]}
            >
              {showResults && (
                <View
                  style={[
                    styles.fill,
                    { width: `${pct}%`, backgroundColor: chosen ? 'rgba(167,133,45,0.22)' : isLeader ? colors.chip : colors.creamDark },
                  ]}
                />
              )}
              <View style={styles.optionContent}>
                <View style={[styles.radio, chosen ? { backgroundColor: colors.gold, borderWidth: 0 } : { borderWidth: 2, borderColor: colors.homeCardBorder }]}>
                  {chosen && <Check size={9} color="#fff" strokeWidth={2.4} />}
                </View>
                <Text style={[fonts.semibold, styles.optionLabel, { color: colors.ink }]}>{option}</Text>
                {showResults && <Text style={[fonts.bold, styles.optionPct, { color: colors.goldDark }]}>{pct}%</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tallyRow}>
        <Text style={[fonts.regular, styles.tallyText, { color: colors.ink3 }]}>
          <Text style={[fonts.bold, { color: colors.ink2 }]}>{totalVotes}</Text> votes
        </Text>
        {!showResults && (
          <Text style={[fonts.bold, styles.tallyHint, { color: colors.gold }]}>Tap to vote →</Text>
        )}
      </View>
    </MiniCardShell>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 6,
  },
  option: {
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 11,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 12,
  },
  optionPct: {
    fontSize: 11.5,
  },
  tallyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tallyText: {
    fontSize: 11,
  },
  tallyHint: {
    fontSize: 11,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  ctaLabel: {
    fontSize: 11.5,
    color: '#fff',
  },
});
