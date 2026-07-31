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
