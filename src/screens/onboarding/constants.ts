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
