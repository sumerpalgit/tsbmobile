import { apiClient } from './client';
import { FOLLOW_ENDPOINTS } from './endpoints';

/** Matches `webSrc/actions/my-profile.ts`'s shared `FollowUser` row shape — used for BOTH
 * followers (Phase 4's testimonial-request picker) and followings (Phase 6's Following list),
 * same as web reuses one type for both. `role_type` widened in for Phase 6 — Phase 4 only needed
 * name/avatar/request-status. `testimonial_request_sent` stays optional-safe (`false` default) for
 * followings rows, which don't carry it. */
export type Follower = {
  id: string;
  name: string;
  username: string;
  profile_img: string | null;
  role_type: string | null;
  testimonial_request_sent: boolean;
};

function normalizeFollower(item: unknown): Follower {
  const r = item as Record<string, unknown>;
  return {
    id: String(r?.id ?? r?.user_id ?? ''),
    name: String(r?.name ?? ''),
    username: String(r?.username ?? ''),
    profile_img: (r?.profile_img as string | null) ?? null,
    role_type: (r?.role_type as string | null) ?? null,
    testimonial_request_sent: Boolean(r?.testimonial_request_sent ?? false),
  };
}

async function fetchFollowList(
  suffix: 'followers' | 'followings',
  username: string,
  page: number,
  limit: number,
): Promise<{ items: Follower[]; hasNextPage: boolean }> {
  if (!username) return { items: [], hasNextPage: false };
  const data = await apiClient
    .get(`${FOLLOW_ENDPOINTS.BASE}/${username}/${suffix}`, { params: { page, limit } })
    .then(res => res.data)
    .catch(() => null);
  const list: unknown[] = Array.isArray(data) ? data : data?.data ?? data?.[suffix] ?? [];
  const items = Array.isArray(list) ? list.map(normalizeFollower).filter(f => f.id) : [];
  const hasNextPage = data?.pagination?.hasNextPage ?? items.length === limit;
  return { items, hasNextPage };
}

/** `GET /follow/:username/followers?page=&limit=` — matches web's `fetchFollowers`. */
export function fetchFollowers(username: string, page: number, limit: number) {
  return fetchFollowList('followers', username, page, limit);
}

/** `GET /follow/:username/followings?page=&limit=` — matches web's `fetchFollowings`. Powers
 * View Profile's Following list (Phase 6). */
export function fetchFollowings(username: string, page: number, limit: number) {
  return fetchFollowList('followings', username, page, limit);
}
