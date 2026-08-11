import { apiClient } from './client';
import { PROFILE_ENDPOINTS, SAVED_CONTACTS_ENDPOINTS } from './endpoints';
import { ROLE_TYPES } from '../types/directory';
import type { DirectoryPagination, DirectoryStats, Profile } from '../types/directory';

function normalizeProfile(item: unknown): Profile {
  const r = item as Record<string, unknown>;
  const dual = r?.dual_profile as Record<string, unknown> | null | undefined;
  return {
    id: r?.id != null ? String(r.id) : undefined,
    name: String(r?.name ?? ''),
    bio: (r?.bio as string | null) ?? null,
    email: r?.email as string | undefined,
    role_type: (r?.role_type as string | null) ?? null,
    sub_category: (r?.sub_category as string | null) ?? null,
    username: String(r?.username ?? ''),
    profile_img: (r?.profile_img as string | null) ?? null,
    location: (r?.location as string | null) ?? null,
    city: (r?.city as string | null) ?? null,
    state_code: (r?.state_code as string | null) ?? null,
    country_code: (r?.country_code as string | null) ?? null,
    linkedin_url: (r?.linkedin_url as string | null) ?? null,
    dual_id: (r?.dual_id as string | null) ?? null,
    dual_profile: dual
      ? {
          id: String(dual.id ?? ''),
          name: String(dual.name ?? ''),
          bio: String(dual.bio ?? ''),
          role_type: (dual.role_type as string | null) ?? null,
          sub_category: (dual.sub_category as string | null) ?? null,
          username: String(dual.username ?? ''),
          profile_img: (dual.profile_img as string | null) ?? null,
          linkedin_url: (dual.linkedin_url as string | null) ?? null,
        }
      : null,
    avg_rating: (r?.avg_rating as number | null) ?? null,
    total_reviews: (r?.total_reviews as number | null) ?? null,
    designation: (r?.designation as string | null) ?? null,
    organization: (r?.organization as string | null) ?? null,
  };
}

export type SearchDirectoryParams = {
  query?: string;
  roleType?: string;
  subCategory?: string;
  city?: string;
  stateCode?: string;
  countryCode?: string;
  groupId?: string;
  page: number;
  limit: number;
};

/** `GET /profile/search` — matches web's `searchDirectoryProfiles` (`actions/directory.ts`),
 * reusing the same endpoint `searchEtaInviteCandidates` (`api/eta.ts`) already calls for a
 * different, narrower purpose — this normalizes into the full `Profile` shape Directory needs
 * instead of that function's trimmed `InviteCandidate`. All filtering happens server-side; every
 * param change is a fresh fetch, not a client-side filter of an already-loaded page. */
export async function searchDirectoryProfiles(
  params: SearchDirectoryParams,
): Promise<{ profiles: Profile[]; pagination: DirectoryPagination | null }> {
  const data = await apiClient
    .get(PROFILE_ENDPOINTS.SEARCH, {
      params: {
        query: params.query || undefined,
        roleType: params.roleType || undefined,
        subCategory: params.subCategory || undefined,
        city: params.city || undefined,
        stateCode: params.stateCode || undefined,
        countryCode: params.countryCode || undefined,
        group_id: params.groupId || undefined,
        page: params.page,
        limit: params.limit,
      },
    })
    .then(res => res.data);

  const rows = Array.isArray(data?.data) ? data.data : [];
  return {
    profiles: rows.map(normalizeProfile),
    pagination: data?.pagination ?? null,
  };
}

/** Replicates web's own real (if inefficient) hero/chip-count pattern — there is no dedicated
 * stats endpoint. One unfiltered `limit=1` call for the total, plus one more per role type,
 * `Promise.allSettled` so one failing role-type count doesn't blank the rest. Callers should fire
 * this in parallel with the first page of real results, not block on it. */
export async function fetchDirectoryStats(groupId?: string): Promise<DirectoryStats> {
  const countOf = (roleType?: string) =>
    apiClient
      .get(PROFILE_ENDPOINTS.SEARCH, { params: { roleType, group_id: groupId || undefined, page: 1, limit: 1 } })
      .then(res => res.data?.pagination?.totalItems ?? null)
      .catch(() => null);

  const [total, ...byRole] = await Promise.all([countOf(undefined), ...ROLE_TYPES.map(r => countOf(r.value))]);

  const stats: DirectoryStats = { all: total, byRole: {} };
  ROLE_TYPES.forEach((r, i) => {
    stats.byRole[r.value] = byRole[i];
  });
  return stats;
}

/** `GET /saved-contacts` — matches web's `fetchSavedContacts`, called once on mount to seed
 * which cards render as already-saved (a `Profile` alone carries no `is_saved` field). */
export async function fetchSavedContacts(): Promise<Profile[]> {
  const data = await apiClient.get(SAVED_CONTACTS_ENDPOINTS.LIST).then(res => res.data);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.map(normalizeProfile);
}

/** `POST /saved-contacts/:username` — matches web's `saveContact`. */
export function saveContact(username: string) {
  return apiClient.post(`${SAVED_CONTACTS_ENDPOINTS.TOGGLE}/${username}`).then(res => res.data);
}

/** `DELETE /saved-contacts/:username` — matches web's `removeSavedContact`. */
export function removeSavedContact(username: string) {
  return apiClient.delete(`${SAVED_CONTACTS_ENDPOINTS.TOGGLE}/${username}`).then(res => res.data);
}

