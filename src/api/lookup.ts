import { apiClient } from './client';
import { LOOKUP_ENDPOINTS } from './endpoints';

/** Raw grouped shape (region → place names), matching web's own `useGeographies()` hook exactly
 * — used by `GeographyMultiSelect` (Ad Management's edit screen) and Onboarding Step 4's
 * `SearchableMultiSelect` (Geography Focus), both of which need the real grouped + searchable
 * UX real web's own `SearchableMultiSelect` has. */
export async function getGeographiesGrouped(): Promise<Record<string, string[]>> {
  const data = await apiClient.get(LOOKUP_ENDPOINTS.GEOGRAPHIES).then(res => res.data);
  return data?.grouped ?? {};
}

/** Raw grouped shape (category → industry names), matching web's `useIndustries()` hook exactly
 * — used by Onboarding Step 4's `SearchableMultiSelect` (Industries of Interest), same grouped +
 * searchable shape as `getGeographiesGrouped()`. */
export async function getIndustriesGrouped(): Promise<Record<string, string[]>> {
  const data = await apiClient.get(LOOKUP_ENDPOINTS.INDUSTRIES).then(res => res.data);
  return data?.grouped ?? {};
}
