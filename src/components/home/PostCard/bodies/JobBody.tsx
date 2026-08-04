import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../theme';
import type { JobItem } from '../../../../types/home';
import { PostCardBadge } from '../PostCardBadge';
import { PostCardTags } from '../PostCardTags';
import { PostCardDescription } from '../PostCardDescription';
import { StatTiles, StatTile } from '../primitives/StatTiles';
import { formatMoneyRange } from '../primitives/formatMoney';
import type { QuickProfileContent } from '../PostCardQuickProfile';

/** No field says "Early Career"/"Operator / Executive" directly (the mockup's two badge
 * examples) — a live sample shows `experience_level` holding a finer-grained value ("Undergrad")
 * shown separately in the quick-profile overlay, so it isn't that field either. Best-effort
 * derivation, shared by the main card's badge and the overlay's section title so both show the
 * same (possibly imperfect) value rather than two different guesses. */
function jobBadgeLabel(item: JobItem): string {
  return `Hiring — ${item.experience_level || item.role_type || 'General'}`;
}

function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHoursPerWeek(item: JobItem): string | undefined {
  const { min, max } = item.hours_per_week ?? {};
  if (min == null && max == null) return undefined;
  return min != null && max != null && min !== max ? `${min}–${max}` : String(min ?? max);
}

/** Builds the quick-profile overlay's content for Jobs (`PostCard.tsx`'s
 * `getQuickProfileContent` dispatches here) — confirmed against a real rendered overlay
 * screenshot: rows are Experience level/Start date/End date/Hours per week/JD attached/Apply
 * via, chips are `industry_focus_area` split on commas. `JobItem` has no distinct "end date"
 * field — `active_until` is used as a best-effort stand-in (flagged, not confirmed). */
export function getJobQuickProfile(item: JobItem): QuickProfileContent {
  const rows = [
    { label: 'Experience level', value: item.experience_level },
    { label: 'Start date', value: formatDate(item.preferred_start_date) },
    { label: 'End date', value: formatDate(item.active_until) },
    { label: 'Hours / week', value: formatHoursPerWeek(item) },
    { label: 'JD attached', value: item.upload_job_description ? 'Yes' : 'No' },
    { label: 'Apply via', value: item.external_job_link ? 'External link' : 'Direct in-platform' },
  ].filter((row): row is { label: string; value: string } => !!row.value);

  const chips = (item.industry_focus_area ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  return { sectionTitle: jobBadgeLabel(item), rows, chips };
}

/**
 * Jobs — title is `role_title` (the mockup's examples compose a longer string like "Summer M&A
 * Intern — Searcher's office, Austin", but `JobItem` has no single field for that — `role_title`
 * alone is what's actually confirmed to exist).
 */
export function JobBody({ item }: { item: JobItem }) {
  const { colors, fonts } = useTheme();

  const compensation =
    formatMoneyRange(item.fixed_compensation, item.currency) ??
    formatMoneyRange(item.hourly_rate, item.currency) ??
    item.compensation_type ??
    undefined;

  const tiles: StatTile[] = [];
  if (compensation) tiles.push({ label: 'Comp', value: compensation });
  if (item.experience_level) tiles.push({ label: 'Level', value: item.experience_level });
  if (item.preferred_start_date) tiles.push({ label: 'Start', value: item.preferred_start_date });
  if (item.location) tiles.push({ label: 'Location', value: item.location });

  const tags = [
    item.role_type,
    item.role_mode,
    item.is_internship ? 'Internship' : item.compensation_type,
  ].filter((tag): tag is string => !!tag);

  return (
    <View style={styles.container}>
      <PostCardBadge label={jobBadgeLabel(item)} icon="briefcase" />
      <Text style={[fonts.bold, styles.title, { fontSize: 16, color: colors.ink }]} numberOfLines={2}>
        {item.role_title}
      </Text>
      <PostCardTags tags={tags} />
      <PostCardDescription text={item.role_description} />
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
