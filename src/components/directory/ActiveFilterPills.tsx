import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { DirectoryFilters } from '../../hooks/useDirectory';

/** Removable active-filter pills + "Clear all" — matches `Directory.html`'s "ACTIVE FILTER
 * PILLS" (~line 239). Up to 4 pills (search query, role type, sub-category, city) — matches
 * web's own active-filter count exactly (`page.tsx:1201`: `[roleType, subCategory, city,
 * query].filter(Boolean).length`), which counts a typed search too. Role/sub-category/city are
 * single-select — see `useDirectory.ts` for why, not the mockup's multi-select arrays. */
export function ActiveFilterPills({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: DirectoryFilters;
  onRemove: (key: 'query' | 'roleType' | 'subCategory' | 'city') => void;
  onClearAll: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const pills: { key: 'query' | 'roleType' | 'subCategory' | 'city'; label: string }[] = [];
  if (filters.query.trim()) pills.push({ key: 'query', label: `"${filters.query.trim()}"` });
  if (filters.roleType) pills.push({ key: 'roleType', label: filters.roleType });
  if (filters.subCategory) pills.push({ key: 'subCategory', label: filters.subCategory });
  if (filters.city) pills.push({ key: 'city', label: `${filters.city.city}, ${filters.city.stateCode}` });

  if (pills.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {pills.map(p => (
        <Pressable
          key={p.key}
          onPress={() => onRemove(p.key)}
          style={[styles.pill, { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
        >
          <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.goldDark }]}>{p.label}</Text>
          <X size={11} color={colors.goldDark} strokeWidth={1.9} />
        </Pressable>
      ))}
      <Pressable
        onPress={onClearAll}
        style={[styles.clearButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
      >
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink3 }]}>Clear all</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: 7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingHorizontal: 12,
  },
  clearButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
