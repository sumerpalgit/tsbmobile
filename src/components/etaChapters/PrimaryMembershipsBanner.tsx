import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../theme';

export const MAX_ACTIVE_ETA_CHAPTERS = 3;

/** "Primary memberships" banner — matches `ETAChapters_decoded.html` (~line 203). Real business
 * rule from web (`MAX_ACTIVE_ETA_CHAPTERS`, `my-eta-chapters/page.tsx`): a user can actively
 * join at most 3 chapters at once; leaving one starts a 30-day rejoin cooldown on that chapter. */
export function PrimaryMembershipsBanner({ usedCount, onManage }: { usedCount: number; onManage: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.gold, borderRadius: radius.xl }]}>
      <View style={[styles.iconWell, { backgroundColor: colors.chip, borderRadius: radius.lg }]}>
        <Star size={15} color={colors.goldDark} strokeWidth={1.6} />
      </View>
      <View style={styles.body}>
        <Text style={[fonts.bold, styles.label, { color: colors.gold }]}>PRIMARY MEMBERSHIPS</Text>
        <Text style={[fonts.semibold, styles.count, { color: colors.ink }]}>
          {usedCount} of {MAX_ACTIVE_ETA_CHAPTERS} slots in use
        </Text>
        <View style={styles.pips}>
          {Array.from({ length: MAX_ACTIVE_ETA_CHAPTERS }).map((_, i) => (
            <View key={i} style={[styles.pip, { backgroundColor: i < usedCount ? colors.gold : colors.border }]} />
          ))}
        </View>
      </View>
      <Pressable
        onPress={onManage}
        style={({ pressed }) => [styles.manageButton, { backgroundColor: colors.feedFill, borderRadius: radius.lg }, pressed && { opacity: 0.7 }]}
      >
        <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>Manage</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 11,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  iconWell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  count: {
    fontSize: 12.5,
    marginTop: 3,
  },
  pips: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 7,
  },
  pip: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  manageButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
