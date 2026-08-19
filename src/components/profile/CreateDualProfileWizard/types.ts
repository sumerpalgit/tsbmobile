/** Kept separate from onboarding's own `Step`/`constants.ts` types rather than widening them —
 * step count/labels/copy genuinely differ (5 steps + confirmation here vs onboarding's 4 +
 * ground-rules), and coupling the two step machines would make either one's future changes risk
 * breaking the other. See the plan at `delightful-seeking-snowglobe.md`. */
export type WizardStepId = 'getStarted' | 'chooseRole' | 'selectEtas' | 'businessDetails' | 'payment';

/** Labels match the mockup's `stepNames` map verbatim (sentence case, not title case). */
export const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: 'getStarted', label: 'Get started' },
  { id: 'chooseRole', label: 'Choose role' },
  { id: 'selectEtas', label: 'Select ETAs' },
  { id: 'businessDetails', label: 'Business details' },
  { id: 'payment', label: 'Payment' },
];

/** Not every field is wired up yet — `billingCycle` is still a Phase 4 (Payment) placeholder.
 * Everything else is real as of Phase 3 (Select ETAs + Business Details). */
export type DualProfileDraft = {
  /** One of onboarding's `ROLES[number]['name']` labels (e.g. `'Investor'`) — mapped to the
   * backend's `role_type` via `ROLE_TYPE_MAP` at submit time, same as onboarding does. */
  roleType: string;
  subCategory: string;
  /** Free-text value when `subCategory === OTHER_SPECIFY_SUB`. */
  subCategoryOther: string;
  chapterIds: string[];
  bio: string;
  designation: string;
  orgName: string;
  interests: string[];
  /** Role-scoped Business Details Part B state — same shape/keys as onboarding's own Step 4
   * state, config-driven off `ROLE_CONFIG[roleType]` (`../../../screens/onboarding/roleConfig`).
   * `revRange`/`ebitdaRange`/`evRange` stay `null` until the user actually drags a slider —
   * mirrors `OnboardingScreen.tsx`'s own `dealRangesTouched` convention. */
  fieldValues: Record<string, string>;
  chipValues: Record<string, string[]>;
  industries: string[];
  geographyFocus: string[];
  orgWebsite: string;
  revRange: [number, number] | null;
  ebitdaRange: [number, number] | null;
  evRange: [number, number] | null;
  /** Backend URL per uploaded document key — what actually goes in the submit payload, separate
   * from the wizard's own local `uploads`/`uploadingKey` UI state (just tracks what's picked). */
  uploadedUrls: Record<string, string>;
  billingCycle: 'monthly' | 'annual';
};

export const EMPTY_DUAL_PROFILE_DRAFT: DualProfileDraft = {
  roleType: '',
  subCategory: '',
  subCategoryOther: '',
  chapterIds: [],
  bio: '',
  designation: '',
  orgName: '',
  interests: [],
  fieldValues: {},
  chipValues: {},
  industries: [],
  geographyFocus: [],
  orgWebsite: '',
  revRange: null,
  ebitdaRange: null,
  evRange: null,
  uploadedUrls: {},
  billingCycle: 'annual',
};
