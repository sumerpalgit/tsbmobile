import type { PickedFile } from '../../FileUploadButton';

export type Placement = 'home' | 'eta' | 'both';
export type BannerTier = 'standard' | 'premium';
export type DestType = 'url' | 'calendar' | 'mailto' | 'custom';

/** Ad campaign draft — field names/shapes match web's `CreateCampaignModal` state exactly (see
 * the ETA Chapters plan's ad-campaign research), so the submit payload is a near-direct mapping. */
export type CampaignDraft = {
  brandName: string;
  advertiserType: string;
  contactEmail: string;
  campaignName: string;
  policyAgreed: boolean;

  placement: Placement;
  chapterIds: string[];
  bannerTier: BannerTier;

  bannerFile: PickedFile | null;
  headline: string;
  body: string;
  ctaLabel: string;
  destType: DestType;
  destUrl: string;

  audience: string[];
  geography: string[];

  startDate: string;
  durationDays: number | 'custom';
  customDays: string;
};

export const EMPTY_DRAFT: CampaignDraft = {
  brandName: '',
  advertiserType: '',
  contactEmail: '',
  campaignName: '',
  policyAgreed: false,

  placement: 'home',
  chapterIds: [],
  bannerTier: 'standard',

  bannerFile: null,
  headline: '',
  body: '',
  ctaLabel: '',
  destType: 'url',
  destUrl: '',

  audience: [],
  geography: [],

  startDate: '',
  // Matches web's real default (`CreateCampaignModal.tsx` initializes `durationDays` state to
  // `14`) — the earlier `7` didn't match either the real default or any particular real value.
  durationDays: 14,
  customDays: '',
};

export const ADVERTISER_TYPES = [
  { value: 'sba_lender', label: 'SBA Lender' },
  { value: 'diligence_advisory', label: 'Diligence / Advisory' },
  { value: 'investor', label: 'Investor' },
  { value: 'software', label: 'Software' },
  { value: 'insurance_legal', label: 'Insurance / Legal' },
  { value: 'conference_event', label: 'Conference / Event' },
  { value: 'other', label: 'Other' },
];

export const CTA_PRESETS = ['Learn More', 'Get Started', 'Book a Call', 'Contact Us', 'Sign Up', 'Apply Now'];
export const AUDIENCE_OPTIONS = ['Searchers', 'Investors', 'Advisors', 'Lenders', 'Operators', 'Sellers', 'Intermediaries', 'Students'];
export const GEOGRAPHY_OPTIONS = ['United States', 'Canada', 'United Kingdom', 'Europe', 'Global / Remote'];
export const DURATION_PRESETS = [7, 14, 30];

const HOME_DAILY = 60;
const ETA_DAILY = 35;
const BUNDLE_DISCOUNT = 0.15;
const BANNER_MULT: Record<BannerTier, number> = { standard: 1.0, premium: 2.5 };

/** Exact cost formula from `CreateCampaignModal.tsx` — replicated verbatim, see the plan's ad
 * research for why (client-side-only estimate, never sent to or echoed by the backend). */
export function computeCampaignCost(placement: Placement, bannerTier: BannerTier, etaChapterCount: number, days: number): number {
  const mult = BANNER_MULT[bannerTier] ?? 1;
  let daily: number;
  if (placement === 'home') {
    daily = HOME_DAILY;
  } else if (placement === 'eta') {
    daily = ETA_DAILY * Math.max(etaChapterCount, 1);
  } else {
    daily = (HOME_DAILY + ETA_DAILY * Math.max(etaChapterCount, 1)) * (1 - BUNDLE_DISCOUNT);
  }
  return Math.round(daily * mult * days);
}

export function actualDays(draft: CampaignDraft): number {
  return draft.durationDays === 'custom' ? Number(draft.customDays) || 0 : draft.durationDays;
}
