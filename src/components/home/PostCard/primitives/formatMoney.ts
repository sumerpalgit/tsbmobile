/** Compact currency formatting shared by every `RangeRow` — `1250000` → `"$1.3M"`, `85000` →
 * `"$85K"`. Defaults to `USD`'s `$` since that's what every sampled feed item's `currency`
 * field has been so far; falls back to a plain prefix for anything else rather than guessing a
 * symbol table. */
export function formatMoney(value: number, currency?: string | null): string {
  const symbol = !currency || currency === 'USD' ? '$' : `${currency} `;
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `${symbol}${trimDecimal(value / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${symbol}${trimDecimal(value / 1_000)}K`;
  }
  return `${symbol}${value}`;
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

/** `RangeRow`'s min–max formatting, exposed standalone for `StatTiles`' tile values (Investor
 * Corner's "Ticket size"/"Deal size"/"EBITDA" tiles need the same `"$250K – $1.5M"` string
 * `RangeRow` would render as a full row). Returns `undefined` for an empty range so callers can
 * skip the tile entirely rather than rendering a blank value. */
export function formatMoneyRange(
  range: { min?: number | null; max?: number | null } | undefined,
  currency?: string | null,
): string | undefined {
  if (!range || (range.min == null && range.max == null)) {
    return undefined;
  }
  if (range.min != null && range.max != null) {
    return `${formatMoney(range.min, currency)} – ${formatMoney(range.max, currency)}`;
  }
  return formatMoney((range.min ?? range.max) as number, currency);
}
