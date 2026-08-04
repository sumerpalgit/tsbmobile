import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import { Icon } from '../../../icons/Icon';
import type { PollItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';

/**
 * Poll — copied exactly from `TSB Home FV.html`'s poll card example, which is structurally
 * unlike every other type: no tags row, no description, no stat tiles, no like/comment/share
 * row, no CTA button. Just badge → title → vote options → a footer votes/hint line. Each option
 * is its own tappable row with a vote-share fill bar behind the content, not a separate progress
 * bar below the label like an earlier, wrong first pass built.
 */
export function PollBody({ item, onVote }: { item: PollItem; onVote?: (optionIndex: number) => void }) {
  const { colors, fonts, fontSize } = useTheme();

  const totalVotes = item.poll_results?.reduce((sum, r) => sum + r.votes, 0) ?? 0;
  const hasVoted = typeof item.user_voted_index === 'number';

  return (
    <View style={styles.container}>
      <PostCardBadge label="Community Poll" icon="barChart" />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.question}
      </Text>

      <View style={styles.options}>
        {item.options.map((option, index) => {
          const votes = item.poll_results?.[index]?.votes ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const chosen = item.user_voted_index === index;

          return (
            <Pressable
              key={option}
              onPress={() => onVote?.(index)}
              style={[
                styles.option,
                {
                  backgroundColor: colors.surfaceSunken,
                  borderColor: chosen ? colors.gold : colors.feedCardLine,
                },
              ]}
            >
              {totalVotes > 0 && (
                <View
                  style={[
                    styles.fill,
                    { width: `${pct}%`, backgroundColor: chosen ? 'rgba(167,133,45,0.22)' : colors.chip },
                  ]}
                />
              )}

              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radio,
                    chosen
                      ? { backgroundColor: colors.gold, borderWidth: 0 }
                      : { borderWidth: 2, borderColor: colors.homeCardBorder },
                  ]}
                >
                  {chosen && <Icon name="checkmark" size={10} color="#fff" strokeWidth={2.2} />}
                </View>
                <Text style={[fonts.semibold, styles.optionLabel, { color: colors.ink }]}>{option}</Text>
                {totalVotes > 0 && (
                  <Text style={[fonts.bold, styles.optionPct, { color: colors.goldDark }]}>{pct}%</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>
          <Text style={[fonts.bold, { color: colors.ink2 }]}>{totalVotes}</Text> votes
        </Text>
        <Text style={[fonts.bold, { fontSize: fontSize.caption, color: colors.gold }]}>
          {hasVoted ? 'Tap again to change' : 'Tap to vote'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 11,
  },
  title: {
    lineHeight: 21,
  },
  options: {
    gap: 8,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 13,
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
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 13,
  },
  optionPct: {
    fontSize: 12.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
