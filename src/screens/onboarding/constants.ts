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

/** Static in the design file itself (not templated per-role there either). */
export const SUB_CATEGORIES = [
  { value: 'self-funded', label: 'Self-funded searcher' },
  { value: 'traditional', label: 'Traditional search fund' },
  { value: 'sponsor', label: 'Independent sponsor' },
  { value: 'accelerator', label: 'Accelerator-backed' },
];

export const CITIES = [
  { value: 'Mumbai', label: 'Mumbai, MH' },
  { value: 'Pune', label: 'Pune, MH' },
  { value: 'Bengaluru', label: 'Bengaluru, KA' },
  { value: 'Delhi', label: 'New Delhi, DL' },
  { value: 'Jaipur', label: 'Jaipur, RJ' },
];

export const STEP_LABELS = ['Basic Information', 'Select ETAs', 'Business Details'];

export const LINKEDIN_PATTERN = /linkedin\.com/;

export type EtaChapter = {
  name: string;
  region: string;
  members: number;
  /** Absent until the real "get ETA Chapters" API lands — `EtaChapterCard` falls back to an icon
   * placeholder when this is missing. */
  imageUrl?: string;
};

/** Same placeholder set as the design file — real chapters come from a "get ETA Chapters" API later. */
export const ETA_CHAPTERS: EtaChapter[] = [
  { name: 'Mumbai', region: 'Mumbai, MH, IN', members: 51 },
  { name: 'Pune', region: 'Pune, MH, IN', members: 28 },
  { name: 'Jaipur', region: 'Jaipur, RJ, IN', members: 9 },
  { name: 'Agra', region: 'Agra, UP, IN', members: 19 },
];

export const MAX_ETA_CHAPTERS = 3;

/** Static in the design file, same as `SUB_CATEGORIES`/`CITIES` — not role-conditional yet.
 * Step 3, phase 1: get the UI right against this fixed set; a real per-role designation list
 * (matching the web app's `ROLE_CONFIG`) replaces this once Steps 3-4 are both verified. */
export const DESIGNATIONS = [
  { value: 'Self Funded Searcher', label: 'Self Funded Searcher' },
  { value: 'Search Fund Principal', label: 'Search Fund Principal' },
  { value: 'Independent Sponsor', label: 'Independent Sponsor' },
  { value: 'Operating Partner', label: 'Operating Partner' },
];

/** Same fixed 15-item list as the design file — real suggestions become role + sub-category
 * scoped later (matching the web app's `useInterestSuggestions`), same phasing as `DESIGNATIONS`. */
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

const opts = (values: string[]) => values.map(v => ({ value: v, label: v }));

/** Step 4 "Education" section — same static, non-role-conditional phasing as `DESIGNATIONS`/`INTERESTS`. */
export const EDUCATION_LEVELS = opts(["Bachelor's", "Master's", 'MBA', 'Doctorate']);
export const FIELDS_OF_STUDY = opts(['Business', 'Engineering', 'Finance', 'Law', 'Other']);

/** Step 4 "Search Details" section — same fixed set as the design file. */
export const SEARCH_STAGES = opts(['Exploring', 'Actively searching', 'LOI signed', 'Under diligence']);
export const TIME_COMMITMENTS = opts(['Full-time', 'Part-time', 'Weekends']);
export const EQUITY_STATUSES = opts(['Not raised', 'Partially committed', 'Fully committed']);
export const DEBT_STATUSES = opts(['Not started', 'Pre-qualified', 'Term sheet in hand']);
export const PROFESSIONAL_BACKGROUNDS = opts(['Operations', 'Finance', 'Consulting', 'Founder']);
export const FINANCING_READINESS_OPTIONS = opts(['Early', 'Moderate', 'Deal-ready']);

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
