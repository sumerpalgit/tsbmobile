import { apiClient } from './client';
import { TESTIMONIAL_ENDPOINTS } from './endpoints';

/** Matches `webSrc/app/dashboard/my-profile/page.tsx`'s `Reviewer`/`Testimonial` types (lines
 * 183-204) — only the fields View Profile's Overview preview actually renders are kept here
 * (Phase 4's full Testimonial tab, if/when built, can widen this). */
export type Testimonial = {
  id: string;
  testimonial: string;
  created_at: string;
  reviewer: {
    name: string;
    username: string;
    profile_img: string | null;
    designation: string | null;
    organization: string | null;
  };
};

function normalizeTestimonial(item: unknown): Testimonial {
  const r = item as Record<string, unknown>;
  const rv = (r?.reviewer ?? {}) as Record<string, unknown>;
  return {
    id: String(r?.id ?? ''),
    testimonial: String(r?.testimonial ?? ''),
    created_at: String(r?.created_at ?? ''),
    reviewer: {
      name: String(rv?.name ?? ''),
      username: String(rv?.username ?? ''),
      profile_img: (rv?.profile_img as string | null) ?? null,
      designation: (rv?.designation as string | null) ?? null,
      organization: (rv?.organization as string | null) ?? null,
    },
  };
}

/** `GET /testimonial/:username` — matches web's `fetchTestimonials`, called with the signed-in
 * user's OWN username (testimonials received about them). Response envelope unwrapped
 * defensively, same pattern as every other `fetchMy*` call in this file family. */
export async function fetchMyTestimonials(username: string): Promise<Testimonial[]> {
  if (!username) return [];
  const data = await apiClient.get(`${TESTIMONIAL_ENDPOINTS.BY_USERNAME}/${username}`).then(res => res.data).catch(() => null);
  const list: unknown[] = Array.isArray(data) ? data : data?.data ?? data?.testimonials ?? [];
  return Array.isArray(list) ? list.map(normalizeTestimonial).filter(t => t.id) : [];
}
