import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Inbox search field + All/Unread segmented tabs with live counts — matches the redesigned
 * mockup's inbox toolbar (`Messages New.html`). The title and "New message" action used to live
 * here too (a big "Inbox" eyebrow + "Messages" display title + round "+" button); the redesign
 * consolidates both into the slim `MessagesHeader` above instead, so this component now starts
 * directly at the search bar. Not `SegmentedControl` (the shared generic component) since these
 * segments need an inline count badge per option, which that component doesn't support — same
 * reasoning `PromptLibrary.tsx`'s own category tabs are custom-built rather than reusing it. */
export function InboxToolbar({
  query,
  onQueryChange,
  segment,
  onSegmentChange,
  allCount,
  unreadCount,
}: {
  query: string;
  onQueryChange: (text: string) => void;
  segment: 'all' | 'unread';
  onSegmentChange: (segment: 'all' | 'unread') => void;
  allCount: number;
  unreadCount: number;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin },
      ]}
    >
      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl },
        ]}
      >
        <Search size={15} color={colors.ink3} strokeWidth={1.6} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search by name…"
          placeholderTextColor={colors.ink3}
          style={[fonts.regular, styles.searchInput, { fontSize: fontSize.ui, color: colors.ink }]}
        />
        {query ? (
          <Pressable onPress={() => onQueryChange('')} accessibilityLabel="Clear search" hitSlop={6}>
            <View style={[styles.clearButton, { backgroundColor: colors.creamDark }]}>
              <X size={10} color={colors.ink3} strokeWidth={1.8} />
            </View>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.segmentTrack, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
        {(
          [
            ['all', 'All', allCount],
            ['unread', 'Unread', unreadCount],
          ] as const
        ).map(([key, label, count]) => {
          const active = segment === key;
          return (
            <Pressable
              key={key}
              onPress={() => onSegmentChange(key)}
              style={[
                styles.segment,
                { borderRadius: radius.lg },
                active && { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[active ? fonts.bold : fonts.semibold, { fontSize: fontSize.body, color: active ? colors.ink : colors.ink2 }]}>
                {label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: active ? colors.chip : 'transparent' },
                ]}
              >
                <Text style={[fonts.bold, styles.countText, { color: active ? colors.goldDark : colors.ink3 }]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    // Matches the segmented tabs' OUTER card height (`segmentTrack`), not the inner tab height —
    // segment height (36) + segmentTrack's own top+bottom padding (3+3) = 42.
    height: 42,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTrack: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    marginTop: 8,
    marginBottom: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 0.5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10.5,
  },
});
