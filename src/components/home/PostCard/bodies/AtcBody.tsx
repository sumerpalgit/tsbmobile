import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { AtcItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';
import { PostCardTags } from '../PostCardTags';
import { PostCardDescription } from '../PostCardDescription';
import type { QuickProfileContent } from '../PostCardQuickProfile';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** `atc_role_types` confirmed against a real `GET /api/feed?feed_type=atc` sample — a lowercase
 * role-identifier array (`["searcher", "investor"]`, `["lender", "intermediary"]`, often `[]`),
 * not the topic keywords ("LOI"/"Tax DD"/"NWC") the mockup's example card showed. Those were
 * illustrative content in the design tool, not a real field — `atc_role_types` just happens to
 * render in the same tags slot. Capitalized here for display since the raw values are lowercase. */
function roleTags(item: AtcItem): string[] {
  return item.atc_role_types.map(capitalize);
}

/** Builds the quick-profile overlay's content for Ask the Community (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here). The mockup's reference overlay shows 4 rows
 * (Topic/Target/Stage/Seasonality) — confirmed against the same live sample above that none of
 * those exist on `AtcItem` (`question_title`/`question_description`/`post_anonymous`/
 * `atc_role_types` only). No rows are fabricated to fill that gap; the overlay is header +
 * section title + chips (`atc_role_types`) only, same content as the main card's tags. */
export function getAtcQuickProfile(item: AtcItem): QuickProfileContent {
  return { sectionTitle: 'Ask the Community', rows: [], chips: roleTags(item) };
}

/**
 * "Ask the Community" — badge → title (`question_title`, 2-line clamp) → tags
 * (`atc_role_types`) → description (`question_description`). Matches the real mockup example
 * exactly for these fields.
 *
 * The mockup's example card also shows a gold "AI insight" callout box below the description —
 * skipped here since there's no backing field for it in the real `GET /api/feed` response —
 * it reads as illustrative mockup content, not a real API contract. Revisit if/when a real
 * AI-insight field shows up on live data.
 */
export function AtcBody({ item }: { item: AtcItem }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.container}>
      <PostCardBadge label="Ask the Community" icon="lightbulb" />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.question_title}
      </Text>
      <PostCardTags tags={roleTags(item)} />
      <PostCardDescription text={item.question_description} />
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
