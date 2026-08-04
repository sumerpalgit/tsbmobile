import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Icon, IconName } from '../../icons/Icon';
import type { FeedType } from '../../../types/home';

/**
 * Crude `feed_type` → generic label/icon fallback. All 8 types now have real bodies that compute
 * their own badge `label`/`icon` from the item's own data instead of using this map (Investor
 * Corner's badge is literally `item.scenario_type` — "Back a Searcher" vs "Invest in a Deal";
 * Deal's varies by objective — "Raising Capital" vs "Looking for a Buyer"; Poll's says "Community
 * Poll", not "Polls") — so this map is only reachable by `PostCardBody`'s defensive fallback for
 * a `feed_type` the backend adds before the app knows about it, not by any real card today.
 */
export const FEED_TYPE_META: Record<FeedType, { label: string; icon: IconName }> = {
  atc: { label: 'Ask the Community', icon: 'lightbulb' },
  investor_corner: { label: 'Investor Corner', icon: 'account' },
  search_capital: { label: 'Search Capital', icon: 'search' },
  deal: { label: 'Share a Deal', icon: 'trendingUp' },
  find_a_connection: { label: 'Find My Match', icon: 'people' },
  job: { label: 'Jobs', icon: 'people' },
  event: { label: 'Events', icon: 'calendar' },
  poll: { label: 'Polls', icon: 'barChart' },
};

/** Chip chrome matches `TSB Home FV.html`'s badge exactly: `padding:5px 10px;border-radius:8px`
 * (`radius.md`), `font-size:11px;font-weight:600`, `colors.chip`/`colors.goldDark`. Purely
 * presentational — `label`/`icon` come from the caller (each body variant), not derived here. */
export function PostCardBadge({ label, icon }: { label: string; icon: IconName }) {
  const { colors, fonts, radius } = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.chip, borderRadius: radius.md }]}>
      <Icon name={icon} size={12} color={colors.goldDark} />
      <Text style={[fonts.semibold, styles.label, { color: colors.goldDark }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 11,
  },
});
