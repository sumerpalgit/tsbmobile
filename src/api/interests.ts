import { apiClient } from './client';
import { INTERESTS_ENDPOINTS } from './endpoints';

type InterestItem = { id: string; label: string; sortOrder: number };

function normalizeInterest(item: unknown): InterestItem {
  const record = item as Record<string, unknown>;
  return {
    id: String(record?.id ?? ''),
    label: String(record?.label ?? ''),
    sortOrder: Number(record?.sort_order ?? record?.sortOrder ?? 0),
  };
}

/** Matches webSrc's `useInterestSuggestions` hook: `GET /api/interests?role_type=&sub_role=`,
 * grouped by category server-side — flattened to labels only since this screen's
 * `ChipMultiSelect` (Step 3's "Suggested Interests") is option-list-agnostic, not
 * category-grouped, same as web's own `allLabels` flat fallback. */
export async function getInterestSuggestions(roleType: string, subCategory: string): Promise<string[]> {
  if (!roleType) return [];
  const params: Record<string, string> = { role_type: roleType };
  if (subCategory) params.sub_role = subCategory;

  const data = await apiClient.get(INTERESTS_ENDPOINTS.LIST, { params }).then(res => res.data);
  const grouped: Record<string, unknown[]> = data?.grouped ?? {};
  return Object.values(grouped)
    .flat()
    .map(normalizeInterest)
    .map(i => i.label);
}

/** Matches webSrc's `role-form/page.tsx` `handleComplete`: fired once alongside the role
 * profile PUT, only when interests were selected — non-blocking, caller should swallow
 * failures the same way web does (`.catch(() => null)`). */
export function saveInterests(labels: string[]) {
  return apiClient.post(INTERESTS_ENDPOINTS.SAVE, { interest_labels: labels }).then(res => res.data);
}
