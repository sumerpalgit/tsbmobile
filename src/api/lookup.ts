import { apiClient } from './client';
import { LOOKUP_ENDPOINTS } from './endpoints';

/** Matches webSrc's `useIndustries`/`useGeographies` hooks: both endpoints return
 * `{ grouped: Record<string, string[]> }`, flattened here the same way web's own `flat`
 * fallback does, since this screen's `ChipMultiSelect` isn't category-grouped.
 *
 * De-duplicated: the same value can legitimately appear under more than one category (e.g. an
 * industry listed under two groupings). Web never notices because it renders each category as
 * its own nested list (`CommandGroup` per group), so a repeat across groups is never a sibling
 * of itself; this screen's `ChipMultiSelect` renders one flat sibling list, where a repeated
 * value would be a real duplicate React key (same class of bug fixed for interests in
 * `src/api/interests.ts`). */
async function getGroupedFlat(endpoint: string): Promise<string[]> {
  const data = await apiClient.get(endpoint).then(res => res.data);
  const grouped: Record<string, string[]> = data?.grouped ?? {};
  return Array.from(new Set(Object.values(grouped).flat()));
}

export function getIndustries(): Promise<string[]> {
  return getGroupedFlat(LOOKUP_ENDPOINTS.INDUSTRIES);
}

export function getGeographies(): Promise<string[]> {
  return getGroupedFlat(LOOKUP_ENDPOINTS.GEOGRAPHIES);
}
