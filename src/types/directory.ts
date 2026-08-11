/** Matches webSrc's `DualProfile` (`dashboard/directory/page.tsx:27`) — the compact shape shown
 * for a member's secondary/dual role, when they have one. */
export type DualProfile = {
  id: string;
  name: string;
  bio: string;
  role_type: string | null;
  sub_category?: string | null;
  username: string;
  profile_img?: string | null;
  linkedin_url?: string | null;
};

/** Matches webSrc's real `Profile` type (`dashboard/directory/page.tsx:40`) verbatim — no
 * `online`/`isNew`/`mutual`/`match` fields exist here or anywhere in the real API response; those
 * are demo-only fabrications in the mockup's own hardcoded member list, not real data. */
export type Profile = {
  id?: string;
  name: string;
  bio?: string | null;
  email?: string;
  role_type: string | null;
  sub_category?: string | null;
  username: string;
  profile_img?: string | null;
  location?: string | null;
  city?: string | null;
  state_code?: string | null;
  country_code?: string | null;
  linkedin_url?: string | null;
  dual_id?: string | null;
  dual_profile?: DualProfile | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  designation?: string | null;
  organization?: string | null;
};

/** Matches the real `GET /profile/search` response's pagination shape — distinct field names
 * from `ChapterPagination` (`totalItems`/`hasNextPage`/`hasPrevPage`, not `totalCount`). */
export type DirectoryPagination = {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** One `GET /saved-contacts` row — same `Profile` shape, bookmarked. */
export type SavedContact = Profile;

/** Per-role-type counts, keyed the same as `ROLE_TYPES[].value` plus `all` — matches web's
 * `fetchDirectoryStats`-equivalent 9-call fan-out (`page=1&limit=1` per role type, reading
 * `pagination.totalItems`), not a dedicated backend stats endpoint (none exists). */
export type DirectoryStats = {
  all: number | null;
  byRole: Partial<Record<string, number>>;
};

/** Hardcoded frontend constant on web too (`dashboard/directory/page.tsx:73`) — not fetched from
 * any API. `value` is the exact `role_type` string the backend expects/returns. */
export const ROLE_TYPES: { value: string; label: string }[] = [
  { value: 'Searcher', label: 'Searcher' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Operator', label: 'Operator' },
  { value: 'Advisor', label: 'Advisor' },
  { value: 'Lender', label: 'Lender' },
  { value: 'Student', label: 'Student' },
  { value: 'Seller', label: 'Seller' },
  { value: 'Intermediary', label: 'Intermediary' },
];

/** Hardcoded frontend constant on web too (`dashboard/directory/page.tsx:84-93`), keyed by
 * `role_type` — not fetched from any API. Only shown once a role type is selected. Copied
 * verbatim from web's real source (not reconstructed from memory) — an earlier version of this
 * list here was invented and wrong for 7 of these 8 roles. */
export const SUB_CATEGORIES: Record<string, string[]> = {
  Searcher: ['Self Funded Searcher', 'Traditional Searcher', 'Prospective Searcher', 'Other (please specify)'],
  Investor: [
    'Family Office',
    'Angel Investor',
    'Investment Groups',
    'Traditional Private Equity Firm',
    'Search Fund',
    'Independent Sponsors',
    'Other (please specify)',
  ],
  Lender: ['Commercial Banks', 'SBA Lenders', 'Private Credit Funds', 'Other (please specify)'],
  Advisor: [
    'Accounting & Financial Due Diligence Firms',
    'Tax Advisory & Structuring',
    'Legal Advisors',
    'Valuation Experts',
    'Technology / IT Due Diligence Specialists',
    'Operational & Acquisition Coaches / Mentors (ETA Coaches)',
    'Marketing & Branding Agencies',
    'Seller Succession & Exit Planners',
    'Cybersecurity Firms',
    'Capital Advisory Firm',
    'R&W Insurance Brokers',
    'Other (please specify)',
  ],
  Seller: ['Business Owners', 'Franchise Operators', 'Other (please specify)'],
  Operator: ['SMB Operators', 'Fractional Executives', 'Other (please specify)'],
  Intermediary: ['Deal Sourcing Platforms', 'Business Brokers', 'Investment Bankers', 'Other (please specify)'],
  Student: ['Interns/Trainees', 'Other (please specify)'],
};

/** Per-role tint colors (RGB triplets, for `rgba(...)` backgrounds) for the Filters panel's
 * "User type" grid — matches `Directory.html`'s own `typeDefs` (~line 850) exactly, the mockup's
 * real design intent for this screen (distinct from web's own separate `ROLE_COLORS` system used
 * for its member-card role badges elsewhere on the page — this project's convention is UI/design
 * from the mockup, functionality from web, and per-role tinting here is a pure design choice). */
export const ROLE_TINT_COLORS: Record<string, string> = {
  Searcher: '47,93,138',
  Investor: '107,74,138',
  Operator: '47,122,91',
  Advisor: '163,92,54',
  Lender: '47,110,122',
  Student: '74,79,163',
  Seller: '78,122,59',
  Intermediary: '163,63,94',
};

/** Matches web's own two sort options exactly ("Most Recent"/"Alphabetical" — `page.tsx`'s
 * `dir-sort-opt` buttons) — its 3 other mockup options don't exist on real web. Only
 * "Alphabetical" (`az`) is a real capability — client-side sort of the currently-loaded page, same
 * limitation web itself has ("Most Recent" isn't a real sort on web either, just whatever order
 * the backend returned; every other mockup sort option depends on a fabricated field). */
export type DirectorySort = 'default' | 'az';

/** Web just uses `linkedin_url` directly as an `<a href>` (`dashboard/directory/page.tsx:677`),
 * which browsers resolve leniently even without a scheme. RN's `Linking.openURL` has no such
 * leniency — it rejects outright if the URL has no `http(s)://` prefix, which silently failed
 * (caught, no feedback) whenever a profile's stored value omitted it. */
export function normalizeLinkedInUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
