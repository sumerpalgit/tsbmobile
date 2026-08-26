import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/** Ported from `webSrc/app/dashboard/components/activity/RequestsStatusBar.tsx` — the received-
 * requests summary bar for a `my-posts` card. Web declares this data on `ActivityCardWrapper`'s
 * props but never actually renders it there (confirmed dead code); this is the "intended but
 * missing" bar built from `RequestsStatusBar`'s own real rendering logic instead, per the plan's
 * Phase 1 note. Counts come from each item's real `request_breakdown` totals (the caller,
 * `ActivityCardWrapper`, reads them off the item — not fetched separately here). */
export function RequestsStatusBar({
  totalRequestCount,
  pendingCount,
  ndaSentCount,
  declinedCount,
  newRequestCount,
  postStatus,
}: {
  totalRequestCount: number;
  pendingCount: number;
  ndaSentCount: number;
  declinedCount: number;
  newRequestCount: number;
  postStatus?: 'live' | 'draft';
}) {
  const { colors, fonts, borderWidth } = useTheme();

  if (totalRequestCount === 0) {
    return (
      <View style={[styles.row, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        <Text style={[fonts.semibold, styles.text, { color: colors.ink3 }]}>No requests yet</Text>
      </View>
    );
  }

  const chips: { label: string; dot: string }[] = [
    { label: `${totalRequestCount} request${totalRequestCount === 1 ? '' : 's'}`, dot: '#F59E0B' },
  ];
  if (pendingCount > 0) chips.push({ label: `${pendingCount} pending`, dot: colors.gold });
  if (ndaSentCount > 0) chips.push({ label: `${ndaSentCount} NDA sent`, dot: '#10B981' });
  if (declinedCount > 0) chips.push({ label: `${declinedCount} declined`, dot: colors.ink3 });

  return (
    <View style={[styles.row, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
      <View style={styles.chips}>
        {chips.map(chip => (
          <View key={chip.label} style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: chip.dot }]} />
            <Text style={[fonts.semibold, styles.text, { color: colors.ink2 }]}>{chip.label}</Text>
          </View>
        ))}
      </View>

      {newRequestCount > 0 && (
        <View style={[styles.newBadge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[fonts.bold, styles.newText, { color: '#B45309' }]}>{newRequestCount} new</Text>
        </View>
      )}

      {postStatus && (
        <View
          style={[
            styles.statusPill,
            postStatus === 'live'
              ? { backgroundColor: '#1a7a48' }
              : { borderColor: colors.border, borderWidth: borderWidth.thin },
          ]}
        >
          <Text style={[fonts.bold, styles.statusText, { color: postStatus === 'live' ? '#fff' : colors.ink3 }]}>
            {postStatus.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newText: {
    fontSize: 10,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
