import { apiClient } from './client';
import { LOOKUP_ENDPOINTS } from './endpoints';

/** Matches webSrc's `useIndustries`/`useGeographies` hooks: both endpoints return
 * `{ grouped: Record<string, string[]> }`, flattened here the same way web's own `flat`
 * fallback does, since this screen's `ChipMultiSelect` isn't category-grouped. */
async function getGroupedFlat(endpoint: string): Promise<string[]> {
  const data = await apiClient.get(endpoint).then(res => res.data);
  const grouped: Record<string, string[]> = data?.grouped ?? {};
  return Object.values(grouped).flat();
}

export function getIndustries(): Promise<string[]> {
  return getGroupedFlat(LOOKUP_ENDPOINTS.INDUSTRIES);
}

export function getGeographies(): Promise<string[]> {
  return getGroupedFlat(LOOKUP_ENDPOINTS.GEOGRAPHIES);
}
