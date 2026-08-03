export type Step = 1 | 2 | 3 | 4 | 5;

export const ROLES = [
  { name: 'Searcher', desc: 'Searching for acquisition targets in the lower-middle market.' },
  { name: 'Investor', desc: 'Backing operators and co-investing in ETA deals.' },
  { name: 'Lender', desc: 'Debt financing and capital solutions for acquisitions.' },
  { name: 'Advisor', desc: 'Legal, financial & operational expertise for searchers and deals.' },
  { name: 'Business Owner', desc: 'Looking to sell my business to the right operator.' },
  { name: 'Operator', desc: 'Experienced executives seeking to run or manage SMBs.' },
  { name: 'Intermediary', desc: 'Connecting buyers and sellers in the M&A ecosystem.' },
  { name: 'Student', desc: 'Learning about entrepreneurship through acquisition.' },
] as const;

/** Maps this screen's role labels to the backend's `roleType` values — mirrors webSrc's
 * `ROLE_TYPE_API_MAP` in `complete-profile/page.tsx`, keyed to this app's shorter labels
 * instead of web's longer ones (e.g. "Business Owner" here is web's "Sellers" → `seller`). */
export const ROLE_TYPE_MAP: Record<string, string> = {
  Searcher: 'searcher',
  Investor: 'investor',
  Lender: 'lender',
  Advisor: 'advisor',
  'Business Owner': 'seller',
  Operator: 'operator',
  Intermediary: 'intermediary',
  Student: 'student',
};

/** Static in the design file itself (not templated per-role there either). */
export const SUB_CATEGORIES = [
  { value: 'self-funded', label: 'Self-funded searcher' },
  { value: 'traditional', label: 'Traditional search fund' },
  { value: 'sponsor', label: 'Independent sponsor' },
  { value: 'accelerator', label: 'Accelerator-backed' },
];

// City is a live search now (`CitySearchField`, `src/api/location.ts`), not a fixed list —
// the static `CITIES`/`CITY_LOCATION` placeholder pair that used to live here is gone.

export const STEP_LABELS = ['Basic Information', 'Select ETAs', 'Business Details'];

export const LINKEDIN_PATTERN = /linkedin\.com/;

// ETA chapters are a live search now (`getSuggestedEtaChapters`/`searchEtaChapters`,
// `src/api/eta.ts`), not a fixed list — `EtaChapter`'s canonical type lives there too.

export const MAX_ETA_CHAPTERS = 3;

/** Same fixed 15-item list as the design file — real suggestions become role + sub-category
 * scoped later (matching the web app's `useInterestSuggestions`), same phasing as the rest of
 * this screen's static data. Per-role "Your Role / Designation" options now live in
 * `./roleConfig`'s `ROLE_CONFIG` instead of a single fixed list here. */
export const INTERESTS = [
  'Deal closing track record',
  'Intermediary reputation',
  'Thought leadership & content',
  'Deal-by-deal equity raising',
  'Promote & carry structures',
  'Preferred equity & debt structuring',
  'Search fund investor directories',
  'Peer searcher networking',
  'Mentorship from acquired CEOs',
  'Independent sponsor networks',
  'Negotiation & deal closing skills',
  'Burnout & solo operator challenges',
  'Valuation model practice',
  'Reviewing real CIMs',
  'Deal simulation exercises',
];

/** Shared "Industries of Interest" multi-select — every role sees the same list, per web's
 * role-agnostic `useIndustries()`. Static placeholder for now; a real lookup API (web's `GET
 * /api/lookup/industries`) replaces this once role-specific Step 4 UI is verified. */
export const INDUSTRIES = [
  'Technology & Software',
  'Healthcare & Life Sciences',
  'Manufacturing & Industrial',
  'Business & Professional Services',
  'Consumer Products & Retail',
  'Financial Services',
  'Construction & Real Estate',
  'Transportation & Logistics',
  'Food & Beverage',
  'Media & Entertainment',
];

/** Shared "Geography Focus" multi-select — same phasing/role-agnostic scope as `INDUSTRIES`
 * above (web's `useGeographies()`). */
export const GEOGRAPHIES = [
  'North America',
  'United States — Northeast',
  'United States — Southeast',
  'United States — Midwest',
  'United States — West',
  'Europe',
  'Asia Pacific',
  'India',
  'Middle East',
  'Remote / Location Agnostic',
];

export type FinancialRange = {
  key: 'rev' | 'ebitda' | 'ev';
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

/** Step 4 "Financial Criteria" dual-range sliders — same bounds/step as the design file
 * (`rangeVals("rev",...,5,500,5)` etc.), one fixed set regardless of role for now. */
export const FINANCIAL_RANGES: FinancialRange[] = [
  { key: 'rev', label: 'Revenue Range (USD M)', unit: 'M', min: 5, max: 500, step: 5 },
  { key: 'ebitda', label: 'EBITDA Range (USD M)', unit: 'M', min: 1, max: 120, step: 1 },
  { key: 'ev', label: 'Enterprise Value (USD M)', unit: 'M', min: 10, max: 900, step: 10 },
];
