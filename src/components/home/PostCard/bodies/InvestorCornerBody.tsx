import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { InvestorCornerItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';
import { PostCardTags } from '../PostCardTags';
import { PostCardDescription } from '../PostCardDescription';
import { StatTiles, StatTile } from '../primitives/StatTiles';
import { formatMoneyRange } from '../primitives/formatMoney';
import type { QuickProfileContent } from '../PostCardQuickProfile';

/** `"$15M – $80M USD"` — the overlay's "Target revenue" row appends the currency code after the
 * range, unlike the stat tiles' plain `formatMoneyRange` (confirmed against a real rendered
 * overlay screenshot). */
function formatRevenueWithCurrency(range: InvestorCornerItem['revenue'], currency: string | null | undefined): string | undefined {
  const range_ = formatMoneyRange(range, currency);
  return range_ && currency ? `${range_} ${currency}` : range_;
}

function splitList(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

/** Builds the quick-profile overlay's content for Investor Corner (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here). "Invest in a Deal"'s rows are confirmed against a
 * real rendered overlay screenshot (Target revenue/Hold period/Participation/Board/Diligence
 * depth/Capital availability, chips = `deal_industries` split on commas). "Back a Searcher" has
 * no equivalent screenshot — its rows are a best-effort parallel built from its own closest
 * confirmed fields (flagged, not verified). */
export function getInvestorCornerQuickProfile(item: InvestorCornerItem): QuickProfileContent {
  if (item.scenario_type === 'Invest in a Deal') {
    const rows = [
      { label: 'Target revenue', value: formatRevenueWithCurrency(item.revenue, item.currency) },
      { label: 'Hold period', value: item.hold_period },
      { label: 'Participation', value: item.participation_style },
      { label: 'Board', value: item.board_involvement },
      { label: 'Diligence depth', value: item.diligence_depth },
      { label: 'Capital availability', value: item.time_to_deploy },
    ].filter((row): row is { label: string; value: string } => !!row.value);

    return { sectionTitle: item.scenario_type, rows, chips: splitList(item.deal_industries) };
  }

  const rows = [
    { label: 'Target revenue', value: formatRevenueWithCurrency(item.revenue, item.currency) },
    { label: 'Ticket size', value: formatMoneyRange(item.ticket_size, item.currency) },
    { label: 'Involvement', value: item.involvement_level },
    { label: 'Board', value: item.board_involvement },
    { label: 'Co-investor friendly', value: item.co_investor_friendly },
    { label: 'Capital availability', value: item.time_to_deploy },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  return { sectionTitle: item.scenario_type, rows, chips: splitList(item.preferred_industries) };
}

/**
 * Investor Corner — the badge is literally `item.scenario_type` ("Back a Searcher" / "Invest in
 * a Deal", confirmed against the mockup, icons `starOutline`/`chartUp`), title is
 * `investment_mandate_title`, description is `mandate_description`.
 *
 * Tags/footer differ by scenario. Tag content ("Actively Searching"/"Self-Funded" for Back a
 * Searcher, "Acquisition"/"Under LOI"/... for Invest in a Deal) isn't confirmed against any live
 * field the way the stat-tile ranges are (`ticket_size`/`deal_size`/`ebitda` are real typed
 * fields) — built from the closest confirmed fields per scenario instead of guessing the
 * mockup's exact example copy, same approach as `find_a_connection`'s tags.
 */
export function InvestorCornerBody({ item }: { item: InvestorCornerItem }) {
  const { colors, fonts } = useTheme();
  const isBackSearcher = item.scenario_type === 'Back a Searcher';

  const tiles: StatTile[] = [];
  const ticketSize = formatMoneyRange(item.ticket_size, item.currency);
  const dealSize = formatMoneyRange(item.deal_size, item.currency);
  const ebitda = formatMoneyRange(item.ebitda, item.currency);
  if (ticketSize) tiles.push({ label: 'Ticket size', value: ticketSize });
  if (dealSize) tiles.push({ label: 'Deal size', value: dealSize });
  if (ebitda) tiles.push({ label: 'EBITDA', value: ebitda });
  if (isBackSearcher) {
    if (item.preferred_industries) tiles.push({ label: 'Sectors', value: item.preferred_industries });
  } else if (item.time_to_deploy) {
    tiles.push({ label: 'First look in', value: item.time_to_deploy });
  }

  const tags = isBackSearcher
    ? [item.investment_stage_preference, item.solo_or_partnered, item.investment_instrument].filter(
        (tag): tag is string => !!tag,
      )
    : [item.preferred_deal_type, item.exclusivity_stance, item.process_stage].filter(
        (tag): tag is string => !!tag,
      );

  return (
    <View style={styles.container}>
      <PostCardBadge label={item.scenario_type} icon={isBackSearcher ? 'starOutline' : 'chartUp'} />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.investment_mandate_title}
      </Text>
      <PostCardTags tags={tags} />
      <PostCardDescription text={item.mandate_description} />
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
