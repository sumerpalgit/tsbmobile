import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { DealItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';
import { PostCardTags } from '../PostCardTags';
import { PostCardDescription } from '../PostCardDescription';
import { StatTiles, StatTile } from '../primitives/StatTiles';
import { formatMoneyRange } from '../primitives/formatMoney';
import type { IconName } from '../../../icons/Icon';
import type { QuickProfileContent } from '../PostCardQuickProfile';

/** No confirmed enum values exist for `primary_objective` (no live sample yet, unlike most other
 * types) — this is a lenient keyword heuristic, not a verified value match. Falls back to
 * "Looking for a Buyer" (the sell-side listing) since `DealItem`'s confirmed fields
 * (`asking_price`/`sba_eligibility_status`/`owner_financing_status`) fit that variant better
 * than a capital raise anyway. */
export function isRaisingCapital(item: DealItem): boolean {
  return /capital|raise|fund/i.test(item.primary_objective);
}

/** Builds the quick-profile overlay's content for Share a Deal (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here). "Looking for a Buyer"'s rows are confirmed against
 * a real rendered overlay screenshot: Business name/Reason for sale/Exclusivity/Preferred
 * buyers/Searcher stage/Currency, chips = `industry_sectors` as-is. "Raising Capital" has no
 * equivalent screenshot — its rows are a best-effort parallel built from its own closest
 * confirmed fields (flagged, not verified), same pattern as Investor Corner's unconfirmed "Back
 * a Searcher" branch. */
export function getDealQuickProfile(item: DealItem): QuickProfileContent {
  if (!isRaisingCapital(item)) {
    const rows = [
      { label: 'Business name', value: item.business_name },
      { label: 'Reason for sale', value: item.opportunity_reason },
      { label: 'Exclusivity', value: item.exclusivity_status },
      { label: 'Preferred buyers', value: item.searcher_type_preference.join(', ') },
      { label: 'Searcher stage', value: item.deal_stage.join(', ') },
      { label: 'Currency', value: item.currency },
    ].filter((row): row is { label: string; value: string } => !!row.value);

    return { sectionTitle: 'Looking for a Buyer', rows, chips: item.industry_sectors };
  }

  const rows = [
    { label: 'Company name', value: item.company_name },
    { label: 'Reason', value: item.opportunity_reason },
    { label: 'Exclusivity', value: item.exclusivity_status },
    { label: 'Preferred investors', value: item.investor_type_preference.join(', ') },
    { label: 'Deal stage', value: item.deal_stage.join(', ') },
    { label: 'Currency', value: item.currency },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  return { sectionTitle: 'Raising Capital', rows, chips: item.industry_sectors };
}

/**
 * Share a Deal — two variants (badge/icon/tags/tiles/footer all differ), same discriminator
 * heuristic (`isRaisingCapital`) used throughout this body. Both variants share `post_title`/
 * `opportunity_description` for the title/description. No live `GET /api/feed` sample exists for
 * this type yet — tags/tiles are built from `DealItem`'s own confirmed fields, not the mockup's
 * exact (unverified) example copy. The quick-profile overlay's "Looking for a Buyer" content
 * (`getDealQuickProfile`) IS confirmed against a real rendered screenshot, though — see its own
 * doc comment.
 */
export function DealBody({ item }: { item: DealItem }) {
  const { colors, fonts } = useTheme();
  const raisingCapital = isRaisingCapital(item);

  const tiles: StatTile[] = [];
  if (raisingCapital) {
    const raise = formatMoneyRange(item.equity_financing, item.currency);
    if (raise) tiles.push({ label: 'Raise', value: raise });
    const ebitda = formatMoneyRange(item.ebitda, item.currency);
    if (ebitda) tiles.push({ label: 'EBITDA', value: ebitda });
  } else {
    const askingPrice = formatMoneyRange(item.asking_price, item.currency);
    if (askingPrice) tiles.push({ label: 'Asking price', value: askingPrice });
    const ebitda = formatMoneyRange(item.ebitda, item.currency);
    if (ebitda) tiles.push({ label: 'EBITDA', value: ebitda });
    if (item.sba_eligibility_status) tiles.push({ label: 'SBA', value: item.sba_eligibility_status });
    if (item.owner_financing_status) tiles.push({ label: 'Owner fin.', value: item.owner_financing_status });
  }

  const tags = raisingCapital
    ? [item.deal_stage[0], item.investor_type_preference[0]].filter((tag): tag is string => !!tag)
    : [item.sba_eligibility_status, item.industry_sectors[0], item.owner_financing_status].filter(
        (tag): tag is string => !!tag,
      );

  const badgeLabel = raisingCapital ? 'Raising Capital' : 'Looking for a Buyer';
  const badgeIcon: IconName = raisingCapital ? 'chartUp' : 'building';

  return (
    <View style={styles.container}>
      <PostCardBadge label={badgeLabel} icon={badgeIcon} />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.post_title}
      </Text>
      <PostCardTags tags={tags} />
      <PostCardDescription text={item.opportunity_description} />
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
