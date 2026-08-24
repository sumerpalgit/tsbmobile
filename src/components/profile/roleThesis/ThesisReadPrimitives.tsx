import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Read-mode display primitives shared across Role Thesis section cards' bodies — extracted from
 * `IntermediaryThesisTab.tsx` (its own first-role build) once Searcher needed the exact same
 * shapes (row grids, pill values, stat tiles, money formatting) rather than a second copy. Every
 * future role reuses these instead of re-deriving them.
 */

/** Matches web's real `fmtMoney` (`thesis-shared.tsx:46-51`) exactly. */
export function formatMoney(value: string): string {
  const n = value ? Number(value) : 0;
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

/** `null` (not a "Not set" string) when both ends are empty — matches web's own `metrics[].value`
 * being `null` in that case, which its grid then renders as unstyled placeholder text; kept as a
 * distinct type here so a read-mode grid can apply the same two different text styles web does. */
export function formatMoneyRange(min: string, max: string): string | null {
  if (!min && !max) return null;
  return `${formatMoney(min)} – ${formatMoney(max)}`;
}

/** Matches web's real `fmtDealValue` (`SellerThesisTab.tsx:773-780`) — adds a billions tier and a
 * `toLocaleString()` fallback under $1,000 that `formatMoney` above doesn't have. Used where a
 * card's own local formatter genuinely differs from the shared `fmtMoney` (e.g. Intermediary's
 * Track Record "Total deal value facilitated"). */
export function formatDealValue(value: string): string {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function RowsGrid({ rows }: { rows: { label: string; value: string; full?: boolean }[] }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={rowsGridStyles.grid}>
      {rows.map(row => (
        <View key={row.label} style={[rowsGridStyles.cell, row.full && rowsGridStyles.cellFull]}>
          <Text style={[fonts.bold, rowsGridStyles.label, { color: colors.ink3 }]}>{row.label}</Text>
          <Text style={[fonts.regular, rowsGridStyles.value, { color: colors.ink }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** Label + value/pill(s) block — `SubLabel`-equivalent styling (10px/700/uppercase/ink3). */
export function PillField({
  label,
  action,
  children,
}: {
  label: string;
  /** Inline trailing action next to the label — matches web's Investor "Due Diligence Approach"
   * row, the one field in this whole feature with a `SubLabel`-level action slot (a gold "add
   * now" link, `InvestmentThesisTab.tsx`'s `InvestmentApproachCard`). Omit for every other field. */
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={pillFieldStyles.field}>
      <View style={pillFieldStyles.labelRow}>
        <Text style={[fonts.bold, pillFieldStyles.label, { color: colors.ink3 }]}>{label}</Text>
        {!!action && (
          <Pressable onPress={action.onPress}>
            <Text style={[fonts.bold, pillFieldStyles.action, { color: colors.gold }]}>{action.label}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

/** `emptyStyle` matches a real, per-field web inconsistency confirmed across both Intermediary and
 * Searcher: most empty single/multi fields fall back to plain "-" text, but a few fall back to an
 * empty gray pill (`SkeletonPill`, `thesis-shared.tsx:101-103`) instead — replicated exactly
 * rather than normalized to one behavior. Rendered as a static gray pill, not `animate-pulse` —
 * web's own shimmer there is really a reused loading skeleton, and this state isn't loading (data
 * already resolved, the field is just empty). */
export function PillValue({
  value,
  bg,
  color,
  emptyStyle = 'dash',
  emptyText = '-',
}: {
  value: string;
  bg: string;
  color: string;
  emptyStyle?: 'dash' | 'pill';
  /** Lender's real copy diverges per-field ("Not set" for most, "Not answered" for SBA/DD-required
   * plain-text fields) — defaults to the existing "-" so Intermediary/Searcher stay unchanged. */
  emptyText?: string;
}) {
  const { colors, fonts } = useTheme();
  if (!value) {
    return emptyStyle === 'pill' ? (
      <View style={[pillFieldStyles.emptyPill, { backgroundColor: colors.homeCardBorder }]} />
    ) : (
      <Text style={[fonts.regular, pillFieldStyles.empty, { color: colors.ink3 }]}>{emptyText}</Text>
    );
  }
  return (
    <View style={[pillFieldStyles.pill, { backgroundColor: bg, alignSelf: 'flex-start' }]}>
      <Text style={[fonts.medium, pillFieldStyles.pillText, { color }]}>{value}</Text>
    </View>
  );
}

/** Multi-select pill wall — same pill style as `PillValue` wrapped in a row. See `PillValue`'s own
 * doc comment for `emptyStyle`. */
export function PillGroup({
  items,
  bg,
  color,
  emptyStyle = 'dash',
  emptyText = '-',
}: {
  items: string[];
  bg: string;
  color: string;
  emptyStyle?: 'dash' | 'pill';
  emptyText?: string;
}) {
  const { colors, fonts } = useTheme();
  if (items.length === 0) {
    return emptyStyle === 'pill' ? (
      <View style={[pillFieldStyles.emptyPill, { backgroundColor: colors.homeCardBorder }]} />
    ) : (
      <Text style={[fonts.regular, pillFieldStyles.empty, { color: colors.ink3 }]}>{emptyText}</Text>
    );
  }
  return (
    <View style={pillFieldStyles.pillRow}>
      {items.map(item => (
        <View key={item} style={[pillFieldStyles.pill, { backgroundColor: bg }]}>
          <Text style={[fonts.medium, pillFieldStyles.pillText, { color }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export type ChipTone = 'ok' | 'blue' | 'danger';

export function ChipGroup({ label, items, tone }: { label: string; items: string[]; tone: ChipTone }) {
  const { colors, fonts } = useTheme();
  if (items.length === 0) return null;
  const toneColors =
    tone === 'ok'
      ? { color: colors.success, bg: colors.successSurface }
      : tone === 'blue'
        ? { color: colors.indigo, bg: colors.indigoSurface }
        : { color: colors.danger, bg: colors.dangerSurface };
  return (
    <View style={chipGroupStyles.group}>
      <Text style={[fonts.bold, chipGroupStyles.label, { color: colors.ink3 }]}>{label}</Text>
      <View style={chipGroupStyles.row}>
        {items.map(item => (
          <View key={item} style={[chipGroupStyles.chip, { backgroundColor: toneColors.bg }]}>
            <Text style={[fonts.semibold, chipGroupStyles.chipText, { color: toneColors.color }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Bordered box, stats stacked as rows (label+sub left, value right, divider between rows) —
 * matches the Intermediary mockup's own money-stats box exactly (decoded
 * `profilelast_decoded_role.html:2542-2554`). */
export function MoneyStatsBox({ stats }: { stats: { label: string; sub: string; value: string }[] }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[moneyStatsStyles.box, { borderColor: colors.homeCardBorder }]}>
      {stats.map((stat, i) => (
        <View key={stat.label} style={[moneyStatsStyles.row, i < stats.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft }]}>
          <View style={moneyStatsStyles.text}>
            <Text style={[fonts.bold, moneyStatsStyles.label, { color: colors.ink2 }]}>{stat.label}</Text>
            <Text style={[fonts.regular, moneyStatsStyles.sub, { color: colors.ink3 }]}>{stat.sub}</Text>
          </View>
          <Text style={[fonts.bold, moneyStatsStyles.value, { color: colors.ink }]}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function StatTile({ value, label }: { value: string; label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[statTileStyles.tile, { backgroundColor: colors.hero1 }]}>
      <Text style={[fonts.display, statTileStyles.value]}>{value}</Text>
      <Text style={statTileStyles.label}>{label}</Text>
    </View>
  );
}

const rowsGridStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, padding: 14, paddingTop: 12 },
  cell: { width: '46%', flexGrow: 1, gap: 3 },
  cellFull: { width: '100%' },
  label: { fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: 12.5, marginTop: 1 },
});

const pillFieldStyles = StyleSheet.create({
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  action: { fontSize: 10.5, textTransform: 'none' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12 },
  empty: { fontSize: 13 },
  emptyPill: { width: 88, height: 28, borderRadius: 999, alignSelf: 'flex-start' },
});

const chipGroupStyles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  chipText: { fontSize: 11 },
});

const moneyStatsStyles = StyleSheet.create({
  box: { marginHorizontal: 14, marginTop: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, paddingVertical: 11 },
  text: { minWidth: 0 },
  label: { fontSize: 10.5, letterSpacing: 0.3, textTransform: 'uppercase' },
  sub: { fontSize: 10.5, marginTop: 2 },
  value: { fontSize: 13.5, flexShrink: 0 },
});

const statTileStyles = StyleSheet.create({
  tile: { flex: 1, minWidth: 0, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 12, alignItems: 'center' },
  value: { fontSize: 19, color: '#fff' },
  label: { fontSize: 9.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, textAlign: 'center' },
});
