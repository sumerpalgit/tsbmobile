import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { SearchCapitalItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';
import { PostCardTags } from '../PostCardTags';
import { PostCardDescription } from '../PostCardDescription';
import { StatTiles, StatTile } from '../primitives/StatTiles';
import { formatMoney, formatMoneyRange } from '../primitives/formatMoney';
import type { QuickProfileContent } from '../PostCardQuickProfile';

function splitList(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

/** Builds the quick-profile overlay's content for Search Capital (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here) — confirmed against a real rendered overlay
 * screenshot: rows are Entity name/Searcher type/Status/Preferred investors/PPM/Currency, chips
 * are `sectors` + `target_location` (both comma-split) + `sba_eligibility`. `share_ppm`'s
 * `false` case ("Not shared") isn't shown in the reference (that example has PPM available) —
 * best-effort for that branch only. */
export function getSearchCapitalQuickProfile(item: SearchCapitalItem): QuickProfileContent {
  const rows = [
    { label: 'Entity name', value: item.search_fund_name },
    { label: 'Searcher type', value: item.type_of_searcher },
    { label: 'Status', value: item.current_status },
    { label: 'Preferred investors', value: item.preferred_investor_type },
    { label: 'PPM', value: item.share_ppm ? 'Available on NDA' : 'Not shared' },
    { label: 'Currency', value: item.currency },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  const chips = [...splitList(item.sectors), ...splitList(item.target_location), item.sba_eligibility].filter(
    (chip): chip is string => !!chip,
  );

  return { sectionTitle: 'Search Capital', rows, chips };
}

/**
 * Search Capital — title is `post_title`, tags are `type_of_searcher`/`current_status`/
 * `sba_eligibility` (gold/navy/outline tiers), matching a real card example verbatim-extracted
 * from `TSB Home FV.html` early on ("Self-Funded"/"Actively Searching"/"SBA Eligible" for a
 * $500K HVAC search raise) — this type's field/value mapping was confirmed directly against
 * that source, not guessed. Middle tiles are the same "Equity Sought/Target Deal/Target
 * EBITDA/SBA" 2×2 grid from that same example.
 * The footer ("Details" + "Back this Searcher", star icon, in `PostCard.tsx`'s `getFooter`) is
 * confirmed against the same example's rendered screenshot too.
 *
 * No live `GET /api/feed` sample or quick-profile overlay screenshot exists for this type yet,
 * so the quick-profile button is still a no-op for it.
 */
export function SearchCapitalBody({ item }: { item: SearchCapitalItem }) {
  const { colors, fonts } = useTheme();

  const tiles: StatTile[] = [];
  if (item.equity_financing_amount != null) {
    tiles.push({ label: 'Equity Sought', value: formatMoney(item.equity_financing_amount, item.currency) });
  }
  const targetDeal = formatMoneyRange(item.deal_value, item.currency);
  if (targetDeal) tiles.push({ label: 'Target Deal', value: targetDeal });
  const targetEbitda = formatMoneyRange(item.target_ebitda, item.currency);
  if (targetEbitda) tiles.push({ label: 'Target EBITDA', value: targetEbitda });
  if (item.sba_eligibility) tiles.push({ label: 'SBA', value: item.sba_eligibility });

  const tags = [item.type_of_searcher, item.current_status, item.sba_eligibility].filter(
    (tag): tag is string => !!tag,
  );

  return (
    <View style={styles.container}>
      <PostCardBadge label="Search Capital" icon="search" />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.post_title}
      </Text>
      <PostCardTags tags={tags} />
      <PostCardDescription text={item.post_description} />
      {tiles.length > 0 && <StatTiles tiles={tiles} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 11,
  },
  title: {
    lineHeight: 21,
  },
});
