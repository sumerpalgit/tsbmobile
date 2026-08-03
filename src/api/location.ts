import { apiClient } from './client';
import { LOCATION_ENDPOINTS } from './endpoints';

export type CityResult = {
  city: string;
  stateCode: string;
  stateName: string;
  countryCode: string;
  countryName: string;
};

/** The backend mixes snake_case and camelCase across fields in practice — mirrors webSrc's own
 * defensive normalization in `complete-profile/page.tsx` (`item?.state_code || item?.stateCode`)
 * rather than assuming one casing. Entries missing city/state/country are dropped, same as web. */
function normalizeCity(item: unknown): CityResult | null {
  const record = item as Record<string, unknown>;
  const city = String(record?.city ?? record?.name ?? '').trim();
  const stateCode = String(record?.state_code ?? record?.stateCode ?? '').trim();
  const countryCode = String(record?.country_code ?? record?.countryCode ?? '').trim();
  if (!city || !stateCode || !countryCode) return null;

  return {
    city,
    stateCode,
    stateName: String(record?.state_name ?? record?.stateName ?? '').trim(),
    countryCode,
    countryName: String(record?.country_name ?? record?.countryName ?? '').trim(),
  };
}

/** Matches webSrc's `GET /api/location/cities?search=` — Onboarding Step 1's live city
 * autocomplete, replacing the previous static 5-city list. */
export async function searchCities(query: string): Promise<CityResult[]> {
  const data = await apiClient
    .get(LOCATION_ENDPOINTS.CITIES, { params: { search: query } })
    .then(res => res.data);

  if (!Array.isArray(data)) return [];
  return data.map(normalizeCity).filter((c): c is CityResult => c !== null);
}
