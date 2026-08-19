export type Step = 1 | 2 | 3 | 4 | 5;

/** Minimal shape `OnboardingScreen.tsx`'s manual scroll-clear-the-keyboard fix needs from a
 * focused-field ref — both `TextInput` and plain `View` satisfy this structurally, so the same
 * `onFieldFocus` callback can point at either a text field (on focus) or a suggestion list (once
 * results arrive) without the prop type caring which. */
export type Measurable = {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

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

const subCategoryOpts = (values: string[]) => values.map(v => ({ value: v, label: v }));

export const OTHER_SPECIFY_SUB = 'Other (please specify)';

/** Per-role Sub Category options — mirrors webSrc's `SUB_CATEGORIES` map in
 * `complete-profile/page.tsx` exactly, keyed to this screen's own role labels (`ROLES`
 * above) instead of web's longer ones, same mapping as `ROLE_TYPE_MAP`. */
export const SUB_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  Searcher: subCategoryOpts(['Self Funded Searcher', 'Traditional Searcher', 'Prospective Searcher', 'Independent Sponsor']),
  Investor: subCategoryOpts([
    'Family Office',
    'Angel Investor',
    'Investment Groups',
    'Private Equity Firm',
    'Venture Capital Firm',
    'Search Fund Investor',
    'Corporate Investor',
    OTHER_SPECIFY_SUB,
  ]),
  Lender: subCategoryOpts(['Commercial Banks', 'SBA Lenders', 'Private Credit Funds', OTHER_SPECIFY_SUB]),
  Advisor: subCategoryOpts([
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
    OTHER_SPECIFY_SUB,
  ]),
  'Business Owner': subCategoryOpts(['Business Owner', 'Founder', OTHER_SPECIFY_SUB]),
  Operator: subCategoryOpts(['SMB Operators', 'Fractional Executives', OTHER_SPECIFY_SUB]),
  Intermediary: subCategoryOpts([
    'Deal Sourcing Platforms',
    'Business Brokers',
    'Investment Bankers',
    'Boutique M&A advisory',
    'Independent deal intermediary',
    OTHER_SPECIFY_SUB,
  ]),
  Student: subCategoryOpts(['Intern', 'Trainee', OTHER_SPECIFY_SUB]),
};

// City is a live search now (`CitySearchField`, `src/api/location.ts`), not a fixed list —
// the static `CITIES`/`CITY_LOCATION` placeholder pair that used to live here is gone.

export const STEP_LABELS = ['Basic Information', 'Select ETAs', 'Business Details'];

export const LINKEDIN_PATTERN = /linkedin\.com/;

// ETA chapters are a live search now (`getSuggestedEtaChapters`/`searchEtaChapters`,
// `src/api/eta.ts`), not a fixed list — `EtaChapter`'s canonical type lives there too.

export const MAX_ETA_CHAPTERS = 3;

// Suggested Interests (Step 3), Industries of Interest and Geography Focus (Step 4) are now
// live, role-scoped/lookup API data — `getInterestSuggestions`/`getIndustriesGrouped`/
// `getGeographiesGrouped` in `src/api/interests.ts`/`src/api/lookup.ts` — not static lists here.

export type FinancialRange = {
  key: 'rev' | 'ebitda' | 'ev';
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

/** Step 4 "Financial Criteria" dual-range sliders — bounds match webSrc's `UnifiedRoleForm.tsx`
 * `DualRangeSlider` call sites exactly (`min`/`max` props there), one fixed set regardless of
 * role, same as web. */
export const FINANCIAL_RANGES: FinancialRange[] = [
  { key: 'rev', label: 'Revenue Range (USD M)', unit: 'M', min: 0, max: 500, step: 1 },
  { key: 'ebitda', label: 'EBITDA Range (USD M)', unit: 'M', min: 0, max: 100, step: 1 },
  { key: 'ev', label: 'Enterprise Value (USD M)', unit: 'M', min: 0, max: 500, step: 1 },
];
