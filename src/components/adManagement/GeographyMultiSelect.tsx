import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { getGeographiesGrouped } from '../../api/lookup';

/** Matches real web's `SearchableMultiSelect` (grouped, searchable, "N selected" trigger +
 * removable pills) exactly, fed by the same `GET /lookup/geographies` grouped response
 * (`useGeographies()` on web) — a deliberately different shape from the create wizard's flat
 * 5-value `GEOGRAPHY_OPTIONS` chip row (real, flagged inconsistency, see the plan's decision #8).
 * Own trigger+popup instead of `FieldSelect` (that one is single-select, closes on pick — this
 * stays open across multiple picks, closer to web's own "Popover stays open" behavior). */
export function GeographyMultiSelect({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const [open, setOpen] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getGeographiesGrouped()
      .then(setGrouped)
      .catch(() => setGrouped({}))
      .finally(() => setLoading(false));
  }, []);

  const selectedSet = useMemo(() => new Set(selected.map(s => s.toLowerCase())), [selected]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(grouped)
      .map(([group, items]) => [group, q ? items.filter(i => i.toLowerCase().includes(q)) : items] as const)
      .filter(([, items]) => items.length > 0);
  }, [grouped, query]);

  const toggle = (item: string) => {
    const isSelected = selectedSet.has(item.toLowerCase());
    onChange(isSelected ? selected.filter(s => s.toLowerCase() !== item.toLowerCase()) : [...selected, item]);
  };

  return (
    <View>
      {selected.length > 0 && (
        <View style={styles.pillRow}>
          {selected.map((item, i) => (
            <View key={`${item}-${i}`} style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: borderWidth.thin }]}>
              <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>{item}</Text>
              <Pressable onPress={() => onChange(selected.filter((_, idx) => idx !== i))} hitSlop={6}>
                <X size={11} color={colors.ink3} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface2 }]}
      >
        <Text style={[fonts.semibold, { fontSize: fontSize.ui, color: selected.length ? colors.ink : colors.ink3 }]} numberOfLines={1}>
          {loading ? 'Loading…' : selected.length ? `${selected.length} selected` : 'Search and select regions'}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.ink3} /> : <ChevronDown size={14} color={colors.ink3} strokeWidth={1.6} />}
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: 'rgba(12,21,32,0.5)' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]}>
            <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <Text style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]}>Geography Focus</Text>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityLabel="Close"
                style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}
              >
                <X size={16} color={colors.ink2} strokeWidth={1.8} />
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <View style={[styles.searchField, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface2 }]}>
                <Search size={13} color={colors.ink3} strokeWidth={1.8} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search geography…"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.searchInput, { color: colors.ink }]}
                  autoFocus
                />
              </View>
            </View>

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {filteredGroups.length === 0 && !loading && (
                <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>No regions match "{query}".</Text>
              )}
              {filteredGroups.map(([group, items]) => (
                <View key={group} style={{ marginBottom: 14 }}>
                  <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>{group.toUpperCase()}</Text>
                  {items.map(item => {
                    const isSelected = selectedSet.has(item.toLowerCase());
                    return (
                      <Pressable key={item} onPress={() => toggle(item)} style={styles.row}>
                        <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink, flex: 1 }]}>{item}</Text>
                        {isSelected && <Check size={15} color={colors.gold} strokeWidth={2} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 11,
    paddingRight: 9,
    height: 30,
  },
  trigger: {
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 16,
  },
  title: {
    fontSize: 19,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchField: {
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
  },
  list: {
    paddingHorizontal: 16,
  },
  groupLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
