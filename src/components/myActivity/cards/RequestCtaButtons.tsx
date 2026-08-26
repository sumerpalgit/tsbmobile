import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** Owner-side "N requests came in" CTA — matches `ViewRequestsButton.tsx` exactly: navy bg (not
 * gold, the one CTA on any mini-card that isn't gold), a count badge only when `count > 0`. Shown
 * on the `my-posts` tab in place of the card's own native action button. */
export function ViewRequestsButton({ count, onPress }: { count: number; onPress: () => void }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.accentSolid, borderRadius: radius.lg }]}
    >
      <ArrowUpRight size={12} color="#fff" strokeWidth={2.2} />
      <Text style={[fonts.semibold, styles.label, { color: '#fff' }]}>View Requests</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={[fonts.bold, styles.badgeText]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Sender-side "check status of what I sent" CTA — matches `ViewMyRequestButton.tsx`: gold bg,
 * no count (a card only ever represents one sent request). Shown on the `interacted-posts` tab. */
export function ViewMyRequestButton({ onPress }: { onPress: () => void }) {
  const { colors, fonts, radius } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
      <ArrowUpRight size={12} color="#fff" strokeWidth={2.2} />
      <Text style={[fonts.semibold, styles.label, { color: '#fff' }]}>View My Request</Text>
    </Pressable>
  );
}

/** The static, non-interactive "Your post" pill shown instead of a request/action CTA when the
 * signed-in user owns the post — matches every mini-card's `isOwner` branch except
 * `JobOperatorMiniCard` (which has none, per its own doc comment). */
export function YourPostPill({ label = 'Your post' }: { label?: string }) {
  const { fonts } = useTheme();
  return (
    <View style={styles.ownerPill}>
      <Text style={[fonts.semibold, styles.ownerPillText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  label: {
    fontSize: 11.5,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
  },
  ownerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: 'rgba(10,22,40,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,22,40,0.08)',
  },
  ownerPillText: {
    fontSize: 11.5,
    color: 'rgba(10,22,40,0.4)',
  },
});
