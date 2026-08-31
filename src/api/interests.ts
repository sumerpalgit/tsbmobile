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
 * category-grouped, same as web's own `allLabels` flat fallback.
 *
 * De-duplicated by label: the backend can list the same interest text under more than one
 * category (each a distinct row with its own `id`). Web never notices because it keys its
 * suggestion chips by `item.id` (`InterestDropdown.tsx`); this screen's `ChipMultiSelect` keys
 * by the label string itself (matching its plain-`string[]` selection model, same as
 * Industries/Geography), so a repeated label would otherwise render as a duplicate React key. */
export async function getInterestSuggestions(
  roleType: string,
  subCategory: string,
): Promise<string[]> {
  if (!roleType) return [];
  const params: Record<string, string> = { role_type: roleType };
  if (subCategory) params.sub_role = subCategory;

  const data = await apiClient
    .get(INTERESTS_ENDPOINTS.LIST, { params })
    .then(res => res.data);
  const grouped: Record<string, unknown[]> = data?.grouped ?? {};
  const labels = Object.values(grouped)
    .flat()
    .map(normalizeInterest)
    .map(i => i.label);
  return Array.from(new Set(labels));
}

/** Matches webSrc's `role-form/page.tsx` `handleComplete`: fired once alongside the role
 * profile PUT, only when interests were selected — non-blocking, caller should swallow
 * failures the same way web does (`.catch(() => null)`). */
export function saveInterests(labels: string[]) {
  return apiClient
    .post(INTERESTS_ENDPOINTS.SAVE, { interest_labels: dedupeLabels(labels) })
    .then(res => res.data);
}

/** Interests are a set, not a list — the UI calls them "up to 5 interests" and every consumer
 * renders them as chips keyed by the label itself. Real accounts nonetheless carry exact
 * duplicates (observed on device 2026-08-31: "Referral Networks" stored twice), which produced a
 * React `Encountered two children with the same key` error on every View Profile load — fired
 * from BOTH `ViewProfileOverviewTab.tsx`'s chip row and `overview/InterestsSheet.tsx`, since both
 * key on the label. Duplicates also broke the "up to 5" count and made removal ambiguous
 * (`handleRemoveInterest` filters by label, so it drops every copy at once).
 *
 * Deduped on BOTH read and write rather than at either call site: read fixes the accounts that
 * already have bad data, write stops new duplicates being persisted. Exact-match on the trimmed
 * string — deliberately NOT case-insensitive, since only identical strings can collide as React
 * keys, and folding case could merge labels the backend considers distinct. First occurrence
 * wins, so display order is unchanged. */
function dedupeLabels(labels: string[]): string[] {
  return Array.from(new Set(labels.map(l => l.trim()).filter(Boolean)));
}

/** `GET /interests/my` — matches web's `fetchMyInterests()`: the response can be a plain
 * `string[]` or a list of `{label}`/`{name}` objects depending on backend version, so unwrap
 * defensively rather than assuming one shape. Powers View Profile's Overview tab (Phase 2). */
export async function fetchMyInterests(): Promise<string[]> {
  const data = await apiClient
    .get(INTERESTS_ENDPOINTS.MY)
    .then(res => res.data)
    .catch(() => null);
  const list: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.interests)
    ? data.interests
    : [];
  return dedupeLabels(
    list
      .map(item =>
        typeof item === 'string'
          ? item
          : (item as Record<string, unknown>)?.label ??
            (item as Record<string, unknown>)?.name ??
            '',
      )
      .map(String),
  );
}
