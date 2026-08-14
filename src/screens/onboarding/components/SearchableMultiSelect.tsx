import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** Step 4's "Industries of Interest" / "Geography Focus" — matches real web's
 * `SearchableMultiSelect` (`webSrc/components/onboarding/SearchableMultiSelect.tsx`): a
 * trigger that opens a searchable, grouped, stays-open multi-select instead of
 * `ChipMultiSelect`'s flat tap-to-add chip wall. `ChipMultiSelect` remains right for
 * "Suggested Interests" (web's own `InterestDropdown` keeps a random-15 chip-suggestions box
 * *alongside* its search dropdown — a second, distinct affordance this component deliberately
 * doesn't replicate here since Industries/Geography have no such suggestions box on web either).
 *
 * Structural precedent: `components/adManagement/GeographyMultiSelect.tsx` already built this
 * exact grouped-search-sheet shape for Ad Management's edit screen — this mirrors it, styled
 * with this screen's `ob*` tokens instead of the base `colors.*` ones (matching `ChipMultiSelect`'s
 * own convention for anything rendered inline on the onboarding page), and nests its own
 * `SafeAreaProvider` inside the `Modal` per this app's established fix for `useSafeAreaInsets()`
 * being unreliable across a `Modal`'s separate native window on Android (same as
 * `ManageMembershipsSheet.tsx`). */
export function SearchableMultiSelect({
  label,
  required,
  grouped,
  loading = false,
  selected,
  onToggle,
  placeholder = 'Search and select…',
}: {
  label: string;
  required?: boolean;
  grouped: Record<string, string[]>;
  loading?: boolean;
  selected: string[];
  onToggle: (option: string) => void;
  placeholder?: string;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selected.map(s => s.toLowerCase())), [selected]);
  const hasGroups = Object.keys(grouped).length > 0;

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(grouped)
      .map(([group, items]) => [group, q ? items.filter(i => i.toLowerCase().includes(q)) : items] as const)
      .filter(([, items]) => items.length > 0);
  }, [grouped, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.headerRow}>
        <Text style={[fonts.semibold, styles.label, { color: colors.obInk }]}>
          {label} {required && <Text style={{ color: colors.obRequired }}>*</Text>}
        </Text>
        <Text style={[fonts.regular, styles.count, { color: colors.obInk3 }]}>{selected.length} selected</Text>
      </View>

      {selected.length > 0 && (
        <View style={styles.pillRow}>
          {selected.map(item => (
            <Pressable
              key={item}
              onPress={() => onToggle(item)}
              style={[styles.pill, { backgroundColor: colors.obChip, borderColor: colors.obGold }]}
            >
              <Text style={[fonts.semibold, styles.pillText, { color: colors.obGold }]}>{item}</Text>
              <X size={10} color={colors.obGold} strokeWidth={1.6} />
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, borderRadius: radius.lg }]}
      >
        <Text style={[fonts.regular, { fontSize: fontSize.ui, color: colors.obInk3 }]} numberOfLines={1}>
          {loading ? 'Loading…' : placeholder}
        </Text>
        <ChevronDown size={14} color={colors.obInk3} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent statusBarTranslucent onRequestClose={close}>
        <SafeAreaProvider>
          <SearchableMultiSelectSheet
            label={label}
            placeholder={placeholder}
            filteredGroups={filteredGroups}
            hasGroups={hasGroups}
            loading={loading}
            query={query}
            onQueryChange={setQuery}
            selectedSet={selectedSet}
            onToggle={onToggle}
            onClose={close}
          />
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

function SearchableMultiSelectSheet({
  label,
  placeholder,
  filteredGroups,
  hasGroups,
  loading,
  query,
  onQueryChange,
  selectedSet,
  onToggle,
  onClose,
}: {
  label: string;
  placeholder: string;
  filteredGroups: readonly (readonly [string, string[]])[];
  hasGroups: boolean;
  loading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  selectedSet: Set<string>;
  onToggle: (option: string) => void;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.backdrop, { backgroundColor: 'rgba(12,21,32,0.5)' }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <Text style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]}>{label}</Text>
          <Pressable
            onPress={onClose}
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
              onChangeText={onQueryChange}
              placeholder={placeholder}
              placeholderTextColor={colors.ink3}
              style={[fonts.regular, styles.searchInput, { color: colors.ink }]}
              autoFocus
            />
          </View>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 16 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {filteredGroups.length === 0 && !loading && (
            <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>
              {hasGroups ? `No results match "${query}".` : 'No options available.'}
            </Text>
          )}
          {filteredGroups.map(([group, items]) => (
            <View key={group} style={{ marginBottom: 14 }}>
              <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>{group.toUpperCase()}</Text>
              {items.map(item => {
                const isSelected = selectedSet.has(item.toLowerCase());
                return (
                  <Pressable key={item} onPress={() => onToggle(item)} style={styles.row}>
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
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 12.5,
  },
  count: {
    fontSize: 10.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingLeft: 13,
    paddingRight: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11.5,
  },
  trigger: {
    height: 46,
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
