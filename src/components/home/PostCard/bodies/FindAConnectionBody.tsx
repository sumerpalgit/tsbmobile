import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { FindAConnectionItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';
import { PostCardTags } from '../PostCardTags';
import { PostCardDescription } from '../PostCardDescription';
import { StatTiles, StatTile } from '../primitives/StatTiles';
import type { QuickProfileContent } from '../PostCardQuickProfile';

const RECIPIENT_LABELS: Record<string, string> = {
  lender: 'Lender',
  intermediary: 'Intermediary',
  advisor: 'Advisor',
  seller: 'Seller',
  operator: 'Operator',
  student: 'Student',
  investor: 'Investor',
};

/** `recipient_details`' keys are prefixed by a 2-letter code per `recipient_type` (`ln_` lender,
 * `im_` intermediary, `ad_` advisor, ...) but share suffixes across all of them (`_purp`,
 * `_format`, `_comp`, ...) — confirmed against a live sample: `ln_purp`'s first comma-separated
 * value → the mockup's "Want" tile exactly ("Credit analyst recruiting"), `ln_format` → "Format"
 * tile verbatim ("Bank visit / shadow day"), `ln_comp` → "Exchange" tile verbatim ("Future
 * analyst pipeline"). Matching by suffix instead of hardcoding all 7 prefixes. */
function findBySuffix(details: Record<string, string>, suffix: string): string | undefined {
  const key = Object.keys(details).find(k => k.endsWith(suffix));
  return key ? details[key] : undefined;
}

function firstPart(value: string | null | undefined): string | undefined {
  return value?.split(',')[0]?.trim();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function recipientLabelFor(item: FindAConnectionItem): string {
  return RECIPIENT_LABELS[item.recipient_type] ?? capitalize(item.recipient_type);
}

/** The mockup's example tags ("Credit Career", "Acquisition Finance", "MBA") don't trace back
 * to any confirmed field on a live item — likely curated example copy, not a real derivation —
 * so tags are built from confirmed real fields instead (`urgency`, `industry_focus`,
 * `recipient_type`). Shared by the card's tag row and the quick-profile overlay's chip row, so
 * both show the same (best-effort) tags rather than two different guesses. */
function tagsFor(item: FindAConnectionItem): string[] {
  const recipientLabel = recipientLabelFor(item);
  return [
    item.urgency ? capitalize(item.urgency) : null,
    firstPart(item.industry_focus) ?? null,
    recipientLabel,
  ].filter((tag): tag is string => !!tag);
}

/** Builds the "quick profile" overlay's content for this type (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here) — the row labels (Purpose/"{Recipient} fit"/Topic/
 * Format/"I bring"/Exchange) match the mockup's reference screenshot; `"{Recipient} fit"` is
 * generated from `recipient_type` since only the "lender" ("Lender fit") variant's exact label
 * has been confirmed so far. `_time`→"I bring" is the least certain mapping here — no live
 * sample confirms it as cleanly as `_format`/`_comp` did, so treat it as a best guess. */
export function getFindAConnectionQuickProfile(item: FindAConnectionItem): QuickProfileContent {
  const recipientLabel = recipientLabelFor(item);
  const details = item.recipient_details;

  const rows = [
    { label: 'Purpose', value: firstPart(findBySuffix(details, '_purp')) },
    { label: `${recipientLabel} fit`, value: findBySuffix(details, '_type') },
    { label: 'Topic', value: firstPart(findBySuffix(details, '_topic')) },
    { label: 'Format', value: findBySuffix(details, '_format') },
    { label: 'I bring', value: findBySuffix(details, '_time') },
    { label: 'Exchange', value: findBySuffix(details, '_comp') },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  return { sectionTitle: 'Looking to Connect', rows, chips: tagsFor(item) };
}

/**
 * "Find My Match" — badge is "Looking to Connect · {Recipient}" (a fixed prefix + the
 * capitalized `recipient_type`), title is `post_title`, then tags/description/stat-tiles.
 */
export function FindAConnectionBody({ item }: { item: FindAConnectionItem }) {
  const { colors, fonts } = useTheme();
  const recipientLabel = recipientLabelFor(item);

  const want = firstPart(findBySuffix(item.recipient_details, '_purp'));
  const format = findBySuffix(item.recipient_details, '_format');
  const exchange = findBySuffix(item.recipient_details, '_comp');

  const tiles: StatTile[] = [];
  if (want) tiles.push({ label: 'Want', value: want });
  if (format) tiles.push({ label: 'Format', value: format });
  if (exchange) tiles.push({ label: 'Exchange', value: exchange, fullWidth: true });

  return (
    <View style={styles.container}>
      <PostCardBadge label={`Looking to Connect · ${recipientLabel}`} icon="link" />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.post_title}
      </Text>
      <PostCardTags tags={tagsFor(item)} />
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
