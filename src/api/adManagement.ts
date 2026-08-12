import { apiClient } from './client';
import { ADS_ENDPOINTS } from './endpoints';
import type { AdCampaign } from '../types/adManagement';

/** `target_audience`/`target_geography` are jsonb on the backend — real web's own types note they
 * "may be string[] or [{label|name|value}]" depending on how a given record was written, so this
 * normalizes defensively rather than assuming one shape (same defensive-mapping convention as
 * `normalizeProfile`/`mapProfileToUser`). */
function normalizeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return String(o.label ?? o.name ?? o.value ?? '');
      }
      return '';
    })
    .filter(Boolean);
}

/** Flat mapping — matches the real `GET /ads/:id` / `GET /ads/my-ads` record field-for-field
 * (verified against `webSrc`'s `types.ts` + `manage/[adId]/page.tsx` in full). */
function mapAd(raw: any): AdCampaign {
  return {
    id: String(raw?.id ?? ''),
    brandName: String(raw?.brand_name ?? ''),
    campaignName: String(raw?.campaign_name ?? ''),
    advertiserType: raw?.advertiser_type ?? null,
    primaryContactEmail: raw?.primary_contact_email ?? null,
    homePlacement: !!raw?.home_placement,
    etaChapterIds: Array.isArray(raw?.eta_chapter_ids) ? raw.eta_chapter_ids.map(String) : [],
    adBannerUrl: raw?.ad_banner_url ?? null,
    clickDestinationType: raw?.click_destination_type ?? null,
    clickDestinationUrl: raw?.click_destination_url ?? null,
    adHeadline: raw?.ad_headline ?? null,
    adBodyText: raw?.ad_body_text ?? null,
    adCtaText: raw?.ad_cta_text ?? null,
    targetAudience: normalizeStringArray(raw?.target_audience),
    targetGeography: normalizeStringArray(raw?.target_geography),
    campaignStartDate: raw?.campaign_start_date ?? null,
    campaignEndDate: raw?.campaign_end_date ?? null,
    campaignDurationWeeks: raw?.campaign_duration_weeks ?? null,
    priceAmount: raw?.price_amount ?? null,
    totalBudget: raw?.total_budget ?? null,
    spendToDate: raw?.spend_to_date ?? null,
    impressions: raw?.impressions ?? null,
    clicks: raw?.clicks ?? null,
    tier: raw?.tier ?? null,
    status: raw?.status ?? null,
    paymentCompleted: !!raw?.payment_completed,
    isActive: !!raw?.is_active,
    isPublished: !!raw?.is_published,
    createdAt: raw?.created_at ?? null,
    updatedAt: raw?.updated_at ?? null,
  };
}

/** `GET /ads/my-ads` → `{ count, ads }` — takes zero params; every filter/search/status-tab in
 * the Ad Management dashboard is applied client-side over this one array (see
 * `matchesAdFilters`/`deriveStatus` in `src/types/adManagement.ts`), matching real web exactly —
 * no server-side pagination or filter params exist for this endpoint (confirmed reading
 * `actions/ad-management.ts`'s `fetchMyAds()` in full). */
export async function fetchMyAds(): Promise<AdCampaign[]> {
  const data = await apiClient.get(ADS_ENDPOINTS.MY).then(res => res.data);
  const rows = Array.isArray(data?.ads) ? data.ads : [];
  return rows.map(mapAd);
}

/** `GET /ads/:id` → `{ ad }` (tolerates a bare record too, matching web's own
 * `result?.ad ?? result` unwrap). */
export async function fetchAdById(adId: string): Promise<AdCampaign | null> {
  const data = await apiClient.get(`${ADS_ENDPOINTS.BASE}/${adId}`).then(res => res.data);
  const raw = data?.ad ?? data;
  return raw ? mapAd(raw) : null;
}

/** `DELETE /ads/:id`. */
export function deleteAd(adId: string): Promise<void> {
  return apiClient.delete(`${ADS_ENDPOINTS.BASE}/${adId}`).then(() => undefined);
}

/** `PUT /ads/:id` — the full edit-form field set (see `AdCampaignEditScreen`), a distinct call
 * from `updateAdStatus` below (matches web's own split between the full edit form and the
 * Pause/Resume buttons, which only ever send `{ status }`). */
export type UpdateAdPayload = {
  campaign_name: string;
  brand_name: string;
  advertiser_type: string;
  primary_contact_email: string;
  status: string;
  home_placement: boolean;
  tier: 'standard' | 'premium';
  campaign_start_date: string;
  campaign_duration_weeks: number;
  click_destination_type: string;
  click_destination_url: string;
  ad_headline: string;
  ad_body_text: string;
  ad_cta_text: string;
  target_audience: string[];
  target_geography: string[];
  ad_banner_url: string;
};

export function updateAd(adId: string, payload: UpdateAdPayload): Promise<void> {
  return apiClient.put(`${ADS_ENDPOINTS.BASE}/${adId}`, payload).then(() => undefined);
}

/** `PUT /ads/:id` body `{ status }` only — used by the campaign detail screen's Pause/Resume
 * action, distinct from the full-edit `updateAd` above. */
export function updateAdStatus(adId: string, status: string): Promise<void> {
  return apiClient.put(`${ADS_ENDPOINTS.BASE}/${adId}`, { status }).then(() => undefined);
}
