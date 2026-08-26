import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../../theme';

export type ActionState = 'idle' | 'loading' | 'done';

/** The gold solid footer CTA shared by most mini-cards (Request CIM/Request Memo, Back this
 * Searcher, Express Interest, RSVP, Apply Now) — matches web's shared button styling exactly
 * (`background: gold, radius 9, shadow, arrow icon unless in a done state`). `doneVariant`
 * covers the one real inconsistency web itself has: every card's "done" state is a gold pill at
 * 80% opacity EXCEPT `JobOperatorMiniCard`'s "Applied ✓", which is a muted background with green
 * text — replicated as-is per the plan's "don't unify web's own inconsistencies" convention. */
export function MiniCardActionButton({
  label,
  loadingLabel,
  doneLabel,
  state,
  onPress,
  doneVariant = 'gold',
}: {
  label: string;
  loadingLabel: string;
  doneLabel: string;
  state: ActionState;
  onPress: () => void;
  doneVariant?: 'gold' | 'green';
}) {
  const { colors, fonts, radius } = useTheme();

  if (state === 'done') {
    const isGreen = doneVariant === 'green';
    return (
      <Text
        style={[
          fonts.semibold,
          styles.button,
          styles.label,
          {
            borderRadius: radius.lg,
            backgroundColor: isGreen ? colors.surfaceSunken : colors.gold,
            color: isGreen ? '#2e7d32' : '#fff',
            opacity: isGreen ? 1 : 0.8,
          },
        ]}
      >
        {doneLabel}
      </Text>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'loading'}
      style={[styles.button, styles.row, { backgroundColor: colors.gold, borderRadius: radius.lg, opacity: state === 'loading' ? 0.7 : 1 }]}
    >
      <Text style={[fonts.semibold, styles.label, { color: '#fff' }]}>{state === 'loading' ? loadingLabel : label}</Text>
      {state === 'idle' && <ArrowRight size={11} color="#fff" strokeWidth={2.2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 11.5,
    letterSpacing: -0.1,
  },
});
