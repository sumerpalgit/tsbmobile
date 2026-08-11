import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { ROLE_TYPES } from '../../types/directory';
import type { DirectoryStats } from '../../types/directory';

/** Horizontal role-type chip row — matches `Directory.html`'s "ROLE CHIPS" (~line 229). Single-
 * select (`roleType`, or `null` for "All roles"), same underlying filter state the Filters
 * drawer's "User type" grid reads/writes — see `useDirectory.ts`'s doc comment for why this is
 * single-select despite the mockup's drawer showing a multi-select grid. */
export function RoleTypeChipsRow({
  roleType,
  onChange,
  stats,
}: {
  roleType: string | null;
  onChange: (roleType: string | null) => void;
  stats: DirectoryStats;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.content}>
      <Chip label="All roles" count={stats.all} active={roleType === null} onPress={() => onChange(null)} />
      {ROLE_TYPES.map(r => (
        <Chip
          key={r.value}
          label={r.label}
          count={stats.byRole[r.value] ?? null}
          active={roleType === r.value}
          onPress={() => onChange(r.value)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, count, active, onPress }: { label: string; count: number | null; active: boolean; onPress: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderRadius: radius.lg },
        active ? { backgroundColor: colors.feedFill, borderColor: colors.feedFill } : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.feedOnFill : colors.ink2 }]}>{label}</Text>
      {count != null && (
        <View style={[styles.countBadge, { borderRadius: radius.sm, backgroundColor: active ? 'rgba(255,255,255,0.18)' : colors.chip }]}>
          <Text style={[fonts.bold, styles.countText, { color: active ? '#fff' : colors.goldDark }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 10,
  },
  content: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 10.5,
  },
});
