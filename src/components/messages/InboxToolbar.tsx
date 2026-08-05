import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Inbox title + New-message button, search field, and All/Unread segmented tabs with live
 * counts — matches the mockup's inbox toolbar. Not `SegmentedControl` (the shared generic
 * component) since these segments need an inline count badge per option, which that component
 * doesn't support — same reasoning `PromptLibrary.tsx`'s own category tabs are custom-built
 * rather than reusing it. */
export function InboxToolbar({
  query,
  onQueryChange,
  segment,
  onSegmentChange,
  allCount,
  unreadCount,
  onNewMessage,
}: {
  query: string;
  onQueryChange: (text: string) => void;
  segment: 'all' | 'unread';
  onSegmentChange: (segment: 'all' | 'unread') => void;
  allCount: number;
  unreadCount: number;
  onNewMessage: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin },
      ]}
    >
      <View style={styles.titleRow}>
        <View>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>Inbox</Text>
          </View>
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Messages</Text>
        </View>
        <Pressable
          onPress={onNewMessage}
          accessibilityLabel="New message"
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: colors.feedFill, borderRadius: radius.xl, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Plus size={17} color={colors.feedOnFill} strokeWidth={1.8} />
        </Pressable>
      </View>

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
                  { borderRadius: radius.sm, backgroundColor: active ? colors.chip : 'transparent' },
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
    paddingTop: 4,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDash: {
    width: 14,
    height: 2,
    borderRadius: 2,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 27,
    lineHeight: 30,
    marginTop: 9,
  },
  newButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    marginTop: 13,
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
    padding: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 10.5,
  },
});
