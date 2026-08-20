import { apiClient } from './client';
import { TESTIMONIAL_ENDPOINTS } from './endpoints';

/** Matches `webSrc/app/dashboard/my-profile/page.tsx`'s `Reviewer`/`Testimonial` types (lines
 * 183-204) — widened for Phase 4's full Testimonial tab (rating/is_featured/known_duration/
 * reviewer.role_type), per this file's own earlier note that Phase 2's Overview preview only
 * needed a subset. `is_approved` is NOT modeled here — confirmed via direct research that web
 * itself declares the field but never reads/filters on it anywhere, so there's no real
 * pending-vs-approved UI to build against. */
export type Testimonial = {
  id: string;
  testimonial: string;
  rating: number;
  is_featured: boolean;
  known_duration: string | null;
  created_at: string;
  reviewer: {
    name: string;
    username: string;
    profile_img: string | null;
    designation: string | null;
    organization: string | null;
    role_type: string | null;
  };
};

function normalizeTestimonial(item: unknown): Testimonial {
  const r = item as Record<string, unknown>;
  const rv = (r?.reviewer ?? {}) as Record<string, unknown>;
  return {
    id: String(r?.id ?? ''),
    testimonial: String(r?.testimonial ?? ''),
    rating: Number(r?.rating ?? 0),
    is_featured: Boolean(r?.is_featured ?? false),
    known_duration: (r?.known_duration as string | null) ?? null,
    created_at: String(r?.created_at ?? ''),
    reviewer: {
      name: String(rv?.name ?? ''),
      username: String(rv?.username ?? ''),
      profile_img: (rv?.profile_img as string | null) ?? null,
      designation: (rv?.designation as string | null) ?? null,
      organization: (rv?.organization as string | null) ?? null,
      role_type: (rv?.role_type as string | null) ?? null,
    },
  };
}

/** `GET /testimonial/:username` — matches web's `fetchTestimonials`, called with the signed-in
 * user's OWN username (testimonials received about them). Response envelope unwrapped
 * defensively, same pattern as every other `fetchMy*` call in this file family. Returns the
 * full flat list, unpaginated (matches web — no page/limit params exist on this endpoint). */
export async function fetchMyTestimonials(username: string): Promise<Testimonial[]> {
  if (!username) return [];
  const data = await apiClient.get(`${TESTIMONIAL_ENDPOINTS.BY_USERNAME}/${username}`).then(res => res.data).catch(() => null);
  const list: unknown[] = Array.isArray(data) ? data : data?.data ?? data?.testimonials ?? [];
  return Array.isArray(list) ? list.map(normalizeTestimonial).filter(t => t.id) : [];
}

/** `POST /testimonial/request` — matches web's `requestTestimonial(user_ids, message)` exactly,
 * body `{ user_ids, message }`, response `{ sent?, skipped? }`. */
export async function requestTestimonial(userIds: string[], message: string): Promise<{ sent: number; skipped: number }> {
  const data = await apiClient
    .post(TESTIMONIAL_ENDPOINTS.REQUEST, { user_ids: userIds, message })
    .then(res => res.data);
  return { sent: Number(data?.sent ?? userIds.length), skipped: Number(data?.skipped ?? 0) };
}
