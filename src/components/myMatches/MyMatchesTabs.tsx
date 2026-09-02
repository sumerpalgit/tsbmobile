import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/**
 * Pill-shaped tab row — filled navy when active, outlined when not, horizontally scrollable.
 *
 * Copied from `MyActivitiesScreen`'s `TabRow`, which is this app's established style for a 4-tab
 * screen (`ViewProfileScreen`'s gold-underline row is the 6-tab style; `SegmentedControl` and the
 * gold-chip track are the 2–3-tab styles). Scrollable rather than four equal-width segments
 * because "Where I'm a Fit" and "From My Posts" do not fit side by side at four-up on a phone.
 *
 * On web these tabs are not on the page at all — they are sidebar sub-items driving a `?tab=`
 * query param (`layout.tsx:278-283`). A drawer sub-menu has no mobile equivalent here, so they
 * become on-screen tabs, which is also what every other multi-view screen in this app does.
 */

export type MyMatchesTab = 'suggested' | 'my-posts' | 'im-a-fit' | 'other';

export const MY_MATCHES_TABS: { key: MyMatchesTab; label: string }[] = [
  { key: 'suggested', label: 'Suggested' },
  { key: 'my-posts', label: 'From My Posts' },
  { key: 'im-a-fit', label: "Where I'm a Fit" },
  // Not one of web's three tabs. The settings/credits/counts endpoints web reaches through a gear
  // button and a drawer have no list of their own, and this phase still has to prove they work.
  { key: 'other', label: 'Other' },
];

export function MyMatchesTabs({
  activeTab,
  onChange,
}: {
  activeTab: MyMatchesTab;
  onChange: (tab: MyMatchesTab) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabRow}>
      {MY_MATCHES_TABS.map(tab => {
        const selected = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.tabPill,
              selected
                ? { backgroundColor: colors.accentSolid }
                : {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
            ]}>
            <Text
              style={[
                fonts.bold,
                styles.tabLabel,
                { color: selected ? '#fff' : colors.ink2 },
              ]}
              numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
      {/* Trailing spacer so the last pill clears the screen edge when scrolled fully right. */}
      <View style={styles.tailSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 7,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  tabLabel: {
    fontSize: 12,
  },
  tailSpacer: {
    width: 2,
  },
});
