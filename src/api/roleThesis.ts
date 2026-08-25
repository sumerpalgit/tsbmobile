import { apiClient } from './client';
import { AUTH_ENDPOINTS, ROLE_THESIS_ENDPOINTS } from './endpoints';
import { normalizeProfile } from './directory';
import type { Profile } from '../types/directory';

/**
 * View Profile's Role Thesis tab (Phase 8), Intermediary role. Field names and their exact
 * GET (snake_case)/PUT (camelCase, wrapped in `{ formData }`) asymmetry match web's real
 * `SellerThesisTab.tsx` verbatim (`parseApiResponse`/`handleSave`, the file that actually renders
 * for `role_type === 'intermediary'` — see `AUTH_ENDPOINTS.SELLER`'s own doc comment on the
 * filename/import-swap this replicates on purpose). Money-range/count fields stay strings
 * end-to-end (matching the mockup's own free-text inputs and `SellerData`'s own `string` typing
 * for `dealsClosed`/`totalDealValue`) even though `annualRevenueMin` etc. are numbers on the wire —
 * only converted to `Number` right before a PUT, in each edit sheet's own save handler.
 */
export type IntermediaryThesis = {
  /** From the `/auth/seller` response's own `profile_id` field — matches web's real
   * `SellerThesisTab.tsx:949` (`if (raw.profile_id) setProfileId(raw.profile_id)`). This is what
   * `fetchSimilarRoleProfiles` needs, NOT the outer View Profile screen's Directory-style
   * `Profile.id` — the two are separate ids and using the wrong one silently returns zero similar
   * profiles (confirmed on-device: the section stayed hidden with no error, since an empty result
   * looks identical to "genuinely none found"). */
  profileId: string;
  organizationName: string;
  sellerRole: string;
  businessStructure: string;
  yearsInOperation: string;
  ownershipStake: string;
  businessOverview: string;
  businessIndustries: string[];
  avoidedIndustries: string[];
  businessLocation: string[];
  annualRevenueMin: string;
  annualRevenueMax: string;
  annualEbitdaMin: string;
  annualEbitdaMax: string;
  askingPriceMin: string;
  askingPriceMax: string;
  transactionType: string;
  transactionReasons: string[];
  openTo: string[];
  targetTimeline: string;
  dealStageInvolvement: string[];
  transitionSupportTypes: string[];
  openToAdvisor: string;
  operationalInvolvement: string;
  preferredBuyer: string;
  dealsClosed: string;
  totalDealValue: string;
  differentiationTags: string[];
  cimUrl: string;
  differentiationBio: string;
};

function normalizeIntermediaryThesis(raw: unknown): IntermediaryThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b: unknown) => String(a ?? b ?? '');
  const numStr = (a: unknown, b: unknown) => (a != null ? String(a) : b != null ? String(b) : '');
  const arr = (a: unknown, b: unknown): string[] => (Array.isArray(a) ? (a as string[]) : Array.isArray(b) ? (b as string[]) : []);
  return {
    profileId: str(r.profile_id, r.profileId),
    organizationName: str(r.organization_name, r.organizationName),
    sellerRole: str(r.seller_role, r.sellerRole),
    businessStructure: str(r.business_structure, r.businessStructure),
    yearsInOperation: str(r.years_in_operation, r.yearsInOperation),
    ownershipStake: str(r.ownership_stake, r.ownershipStake),
    businessOverview: str(r.business_overview, r.businessOverview),
    businessIndustries: arr(r.business_industries, r.businessIndustries),
    avoidedIndustries: arr(r.avoided_industries, r.avoidedIndustries),
    businessLocation: arr(r.business_location, r.businessLocation),
    annualRevenueMin: numStr(r.annual_revenue_min, r.annualRevenueMin),
    annualRevenueMax: numStr(r.annual_revenue_max, r.annualRevenueMax),
    annualEbitdaMin: numStr(r.annual_ebitda_min, r.annualEbitdaMin),
    annualEbitdaMax: numStr(r.annual_ebitda_max, r.annualEbitdaMax),
    askingPriceMin: numStr(r.asking_price_min, r.askingPriceMin),
    askingPriceMax: numStr(r.asking_price_max, r.askingPriceMax),
    transactionType: str(r.transaction_type, r.transactionType),
    transactionReasons: arr(r.transaction_reasons, r.transactionReasons),
    openTo: arr(r.open_to, r.openTo),
    targetTimeline: str(r.target_timeline, r.targetTimeline),
    dealStageInvolvement: arr(r.deal_stage_involvement, r.dealStageInvolvement),
    transitionSupportTypes: arr(r.transition_support_types, r.transitionSupportTypes),
    openToAdvisor: str(r.open_to_advisor, r.openToAdvisor),
    operationalInvolvement: str(r.operational_involvement, r.operationalInvolvement),
    preferredBuyer: str(r.preferred_buyer, r.preferredBuyer),
    dealsClosed: numStr(r.deals_closed, r.dealsClosed),
    totalDealValue: numStr(r.total_deal_value, r.totalDealValue),
    differentiationTags: arr(r.differentiation_tags, r.differentiationTags),
    cimUrl: str(r.cim_url, r.cimUrl),
    differentiationBio: str(r.differentiation_bio, r.differentiationBio),
  };
}

/** `GET /auth/seller` — matches web's `fetchSellerProfile`. */
export async function fetchIntermediaryThesis(): Promise<IntermediaryThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.SELLER).then(res => res.data).catch(() => null);
  return normalizeIntermediaryThesis((data as Record<string, unknown> | null)?.data ?? data);
}

/** `PUT /auth/seller`, body `{ formData: payload }` — matches web's `updateSellerProfile`
 * exactly, including its one real quirk: when `businessIndustries` is part of the section being
 * saved, it's ALSO sent as `industries` (the backend's actual save handler reads that key for
 * industries, not `businessIndustries` — a real web inconsistency between its GET and PUT shapes,
 * replicated here rather than silently "corrected"). Caller passes only the fields for the one
 * card/section being saved (matching web's per-card partial saves), not the whole thesis. */
export async function updateIntermediaryThesis(payload: Partial<IntermediaryThesis>): Promise<void> {
  const body: Record<string, unknown> = { ...payload };
  if (Array.isArray(payload.businessIndustries)) {
    body.industries = payload.businessIndustries;
  }
  await apiClient.put(AUTH_ENDPOINTS.SELLER, { formData: body });
}

export type RoleThesisCompletionSection = { label: string; complete: boolean; percentage: number };
export type RoleThesisCompletion = { percentage: number; sections: RoleThesisCompletionSection[] };

function normalizeCompletion(raw: unknown): RoleThesisCompletion {
  const r = (raw ?? {}) as Record<string, unknown>;
  const sections = Array.isArray(r.sections) ? (r.sections as unknown[]) : [];
  return {
    percentage: Number(r.completion_percentage ?? r.percentage ?? 0),
    sections: sections.map(s => {
      const sr = (s ?? {}) as Record<string, unknown>;
      const percentage = Number(sr.percentage ?? 0);
      return {
        label: String(sr.label ?? ''),
        complete: Boolean(sr.complete ?? percentage >= 100),
        percentage,
      };
    }),
  };
}

/** `GET /profile/seller-thesis/completion` — matches web's `fetchSellerThesisCompletion`, called
 * once on mount and again after every section save (same pattern as `updateIntermediaryThesis`'s
 * doc comment describes web doing). Drives both the top completeness card and each section card's
 * Complete/Incomplete badge — matched by array index to the 5 cards' own render order (Seller
 * profile, Deal coverage & fit, Deal flow & mandates, Engagement & execution, Track record &
 * credibility), same "match by index" convention already used for Analytics' Profile Completion
 * list. */
export async function fetchIntermediaryThesisCompletion(): Promise<RoleThesisCompletion> {
  const data = await apiClient.get(ROLE_THESIS_ENDPOINTS.SELLER_COMPLETION).then(res => res.data).catch(() => null);
  return normalizeCompletion((data as Record<string, unknown> | null)?.data ?? data);
}

/** `GET /profile/:profileId/similar?role=` — matches web's `fetchSimilarProfiles`. Reuses
 * `normalizeProfile`/`Profile` (same shape Directory/Followers already render) since the response
 * is profile-shaped, not a Role Thesis-specific type — lets the "Similar intermediaries" row reuse
 * the exact same avatar/name/meta + `MemberProfile` navigation Directory/`FollowListSheet` already
 * have, rather than a parallel card type. Response envelope is `{ similar: [...] }` (confirmed
 * on-device) — matches web's own defensive unwrap order exactly (`res?.similar ?? res?.data ?? []`,
 * `thesis-shared.tsx:484`); checking `.data` first (this file's original guess) silently returned
 * an empty list even on a 200 with real rows, since the real key is `similar`, not `data`. Each raw
 * item also carries `role_title` (e.g. "Employee"/"Other"), not `designation` — remapped onto
 * `designation` before `normalizeProfile` so `SimilarProfilesRow`'s existing `designation ||
 * role_type` meta logic picks it up without needing a parallel type. */
export async function fetchSimilarRoleProfiles(profileId: string, role: string): Promise<Profile[]> {
  if (!profileId) return [];
  const data = await apiClient
    .get(`${ROLE_THESIS_ENDPOINTS.SIMILAR}/${profileId}/similar`, { params: { role } })
    .then(res => res.data)
    .catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  const list: unknown[] = Array.isArray(data) ? data : (envelope?.similar as unknown[]) ?? (envelope?.data as unknown[]) ?? [];
  return Array.isArray(list)
    ? list
        .map(item => {
          const r = (item ?? {}) as Record<string, unknown>;
          return normalizeProfile(r.designation != null ? r : { ...r, designation: r.role_title });
        })
        .filter(p => p.username)
    : [];
}

/**
 * Searcher role — a real architectural difference from Intermediary, not an oversight: web's
 * `SearcherThesisTab.tsx` has NO dedicated GET call at all (`fetchSearcherProfileSafe` exists in
 * `actions/my-profile.ts` but is confirmed unused by this component) — it reads straight off the
 * `roleProfile` prop, which is a SEPARATE object from `profile` in the same `GET /profile/me`
 * response (`webSrc/actions/my-profile.ts:46-48`: `{ profile?: any; roleProfile?: any }`). Mobile's
 * `useMe()` surfaces this as `User.roleProfile` (`src/api/profile.ts`) — role fields like
 * `searchType` live only there, NOT on `User.profile` (an earlier pass read `.profile` for this,
 * which silently dropped several real fields). So there's no `fetchSearcherThesis()` here —
 * callers normalize directly from that already-in-hand `roleProfile` via `normalizeSearcherThesis`.
 * Only SAVING goes through a dedicated endpoint (`PUT /auth/searcher`).
 */
export type SearcherThesis = {
  searchType: string;
  searchFirmName: string;
  searchFirmWebsite: string;
  incorporatedYear: string;
  yearsOfExperience: string;
  searchThesis: string;
  searchThesisDocumentUrl: string;
  industries: string[];
  excludedIndustries: string[];
  geographies: string[];
  targetDealSizeMin: string;
  targetDealSizeMax: string;
  targetRevenueMin: string;
  targetRevenueMax: string;
  targetEbitdaMin: string;
  targetEbitdaMax: string;
  ownershipPreference: string;
  equityAmountRaised: string;
  equityTargetTotal: string;
  equityNotRaised: boolean;
  equityCapitalType: string;
  externalCapitalRequirements: string;
  investorTypePreferences: string[];
  debtAmountMin: string;
  debtAmountMax: string;
  debtLoanTypes: string[];
  stageOfSearch: string;
  timeCommitment: string;
  hasPriorAcquisition: boolean | null;
  hasAdvisoryBoard: boolean | null;
  hasCommitteeDiscussed: boolean | null;
  hasPriorSearchExperience: boolean | null;
  operationalFocus: string;
};

/** Matches web's real inline mapping verbatim (`SearcherThesisTab.tsx:1035-1077` — there's no
 * standalone `parseApiResponse` function for this role, unlike Seller's), including its two
 * three-deep fallbacks (`searchType` also checks `role_at_organization`, `yearsOfExperience` also
 * checks `total_years_experience` — the backend reuses generic profile fields when the
 * searcher-specific one is absent) and `geographies`' extra shape-normalization (each entry may be
 * a plain string OR an object with `countryName`/`label`). */
function normalizeSearcherThesis(raw: unknown): SearcherThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (...vals: unknown[]) => String(vals.find(v => v != null && v !== '') ?? '');
  const bool = (...vals: unknown[]) => {
    const v = vals.find(x => x != null);
    return v == null ? false : Boolean(v);
  };
  const triBool = (...vals: unknown[]) => {
    const v = vals.find(x => x != null);
    return v == null ? null : Boolean(v);
  };
  const arr = (...vals: unknown[]): string[] => (vals.find(v => Array.isArray(v)) as string[] | undefined) ?? [];
  const geographies = (arr(r.geographies, r.geography_focus) as unknown[]).map(g =>
    typeof g === 'string' ? g : String((g as Record<string, unknown> | null)?.countryName ?? (g as Record<string, unknown> | null)?.label ?? ''),
  ).filter(Boolean);

  return {
    searchType: str(r.searchType, r.search_type, r.role_at_organization),
    searchFirmName: str(r.searchFirmName, r.search_firm_name),
    searchFirmWebsite: str(r.searchFirmWebsite, r.search_firm_website),
    incorporatedYear: str(r.incorporatedYear, r.incorporated_year),
    yearsOfExperience: str(r.yearsOfExperience, r.years_of_experience, r.total_years_experience),
    searchThesis: str(r.searchThesis, r.search_thesis),
    searchThesisDocumentUrl: str(r.searchThesisDocumentUrl, r.search_thesis_document_url),
    industries: arr(r.industries, r.industry_preferences),
    excludedIndustries: arr(r.excludedIndustries, r.excluded_industries),
    geographies,
    targetDealSizeMin: str(r.targetDealSizeMin, r.target_deal_size_min),
    targetDealSizeMax: str(r.targetDealSizeMax, r.target_deal_size_max),
    targetRevenueMin: str(r.targetRevenueMin, r.target_revenue_min),
    targetRevenueMax: str(r.targetRevenueMax, r.target_revenue_max),
    targetEbitdaMin: str(r.targetEbitdaMin, r.target_ebitda_min),
    targetEbitdaMax: str(r.targetEbitdaMax, r.target_ebitda_max),
    ownershipPreference: str(r.ownershipPreference, r.ownership_preference),
    equityAmountRaised: str(r.equityAmountRaised, r.equity_amount_raised),
    equityTargetTotal: str(r.equityTargetTotal, r.equity_target_total),
    equityNotRaised: bool(r.equityNotRaised, r.equity_not_raised),
    equityCapitalType: str(r.equityCapitalType, r.equity_capital_type),
    externalCapitalRequirements: str(r.externalCapitalRequirements, r.external_capital_requirements),
    investorTypePreferences: arr(r.investorTypePreferences, r.investor_type_preferences),
    debtAmountMin: str(r.debtAmountMin, r.debt_amount_min),
    debtAmountMax: str(r.debtAmountMax, r.debt_amount_max),
    debtLoanTypes: arr(r.debtLoanTypes, r.debt_loan_types),
    stageOfSearch: str(r.stageOfSearch, r.stage_of_search),
    timeCommitment: str(r.timeCommitment, r.time_commitment),
    hasPriorAcquisition: triBool(r.hasPriorAcquisition, r.has_prior_acquisition),
    hasAdvisoryBoard: triBool(r.hasAdvisoryBoard, r.has_advisory_board),
    hasCommitteeDiscussed: triBool(r.hasCommitteeDiscussed, r.has_committee_discussed),
    hasPriorSearchExperience: triBool(r.hasPriorSearchExperience, r.has_prior_search_experience),
    operationalFocus: str(r.operationalFocus, r.operational_focus),
  };
}

/** Reads straight off the `roleProfile` object already in hand (`useMe()`'s `User.roleProfile`) —
 * see this section's own top doc comment for why there's no separate GET call, and why this is
 * NOT `User.profile`. */
export function getSearcherThesis(roleProfile: unknown): SearcherThesis {
  return normalizeSearcherThesis(roleProfile);
}

/** `PUT /auth/searcher`, body `{ formData: payload }` — matches web's `updateSearcherProfile`.
 * Unlike Intermediary's `updateIntermediaryThesis`, there's no field-remapping quirk here — each
 * card sends only the camelCase keys it owns, unmassaged. */
export async function updateSearcherThesis(payload: Partial<SearcherThesis>): Promise<void> {
  await apiClient.put(AUTH_ENDPOINTS.SEARCHER, { formData: payload });
}

/** `GET /profile/search-thesis/completion` — matches web's `fetchSearchThesisCompletion`. Same
 * `RoleThesisCompletion` shape/normalizer as Intermediary's completion (`SEARCHER` and `SELLER`
 * completion endpoints return the same `{ completion_percentage, sections }` envelope). */
export async function fetchSearcherThesisCompletion(): Promise<RoleThesisCompletion> {
  const data = await apiClient.get(ROLE_THESIS_ENDPOINTS.SEARCH_THESIS_COMPLETION).then(res => res.data).catch(() => null);
  return normalizeCompletion((data as Record<string, unknown> | null)?.data ?? data);
}

/**
 * Investor role — a dedicated GET, like Intermediary (unlike Searcher, which has none). Field
 * names/mapping match web's real standalone `parseApiResponse` (`InvestmentThesisTab.tsx:107-138`)
 * verbatim, including its one real quirk: `educationalInstitution` is a misnamed leftover field
 * that actually holds "Investor Type" (firm type), mapped from wire key `institution_name` — kept
 * as-is rather than renamed, since it's still the real wire contract. No card in this role ever
 * shows a "Complete this section" CTA or a status badge on web (`CardShell` never receives
 * `complete`/`incomplete` for any of its 5 cards) — see `RoleThesisSectionCard`'s `showStatus`
 * prop, used with `false` for every Investor card.
 */
export type InvestorThesis = {
  profileId: string;
  educationalInstitution: string;
  organizationName: string;
  organizationWebsite: string;
  yearsOfInvestmentExperience: string;
  investmentStage: string[];
  majorityPreference: string;
  ownershipPreference: string;
  participationStyle: string[];
  industries: string[];
  excludedIndustries: string[];
  geographies: string[];
  minEquity: string;
  maxEquity: string;
  minEV: string;
  maxEV: string;
  minRevenue: string;
  maxRevenue: string;
  minEBITDA: string;
  maxEBITDA: string;
  investmentCriteriaUrl: string;
  investmentThesisSummary: string;
  dueDiligenceApproach: string[];
  preferredSelections: string[];
  totalCapitalInvested: string;
  numberOfInvestmentsMade: string;
  activePortfolioCompanies: string;
  portfolioSupportCapabilities: string;
};

/** Matches web's real `toRawUSD` (`InvestmentThesisTab.tsx:100-105`) — revenue/EBITDA min/max
 * values under 10,000 are assumed to be expressed in millions (an onboarding-slider convention)
 * and multiplied by 1,000,000; values ≥10,000 pass through as-is. Only applies to
 * `minRevenue`/`maxRevenue`/`minEBITDA`/`maxEBITDA` — NOT equity or EV fields, which are taken raw. */
function toRawUSD(value: unknown): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return String(n < 10_000 ? n * 1_000_000 : n);
}

function normalizeInvestorThesis(raw: unknown): InvestorThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b: unknown) => String(a ?? b ?? '');
  const numStr = (a: unknown, b: unknown) => (a != null ? String(a) : b != null ? String(b) : '');
  const arr = (a: unknown, b: unknown): string[] => (Array.isArray(a) ? (a as string[]) : Array.isArray(b) ? (b as string[]) : []);
  const ownershipRaw = Array.isArray(r.ownership_preferences) ? (r.ownership_preferences as unknown[])[0] : r.ownership_preferences;

  return {
    profileId: str(r.profile_id, r.profileId),
    educationalInstitution: str(r.institution_name, r.educationalInstitution),
    organizationName: str(r.organization_name, r.organizationName),
    organizationWebsite: str(r.organization_website, r.organizationWebsite),
    yearsOfInvestmentExperience: numStr(r.years_of_investment_experience, r.years_of_investment_experience),
    investmentStage: arr(r.preferred_investment_stages, r.investmentStage),
    majorityPreference: str(r.majority_preference, r.majorityPreference),
    ownershipPreference: str(ownershipRaw, r.ownershipPreference),
    participationStyle: arr(r.participation_modes, r.participationStyle),
    industries: arr(r.investment_industries, r.industries),
    excludedIndustries: arr(r.excluded_industries, r.excludedIndustries),
    geographies: arr(r.active_investment_geographies, r.geographies),
    minEquity: numStr(r.typical_equity_cheque_min, r.minEquity),
    maxEquity: numStr(r.typical_equity_cheque_max, r.maxEquity),
    minEV: numStr(r.preferred_deal_size_min, r.minEV),
    maxEV: numStr(r.preferred_deal_size_max, r.maxEV),
    minRevenue: toRawUSD(r.preferred_revenue_min) || toRawUSD(r.minRevenue),
    maxRevenue: toRawUSD(r.preferred_revenue_max) || toRawUSD(r.maxRevenue),
    minEBITDA: toRawUSD(r.preferred_ebitda_min) || toRawUSD(r.minEBITDA),
    maxEBITDA: toRawUSD(r.preferred_ebitda_max) || toRawUSD(r.maxEBITDA),
    investmentCriteriaUrl: str(r.investment_thesis_url, r.investmentCriteriaUrl),
    investmentThesisSummary: str(r.investment_thesis_summary, r.investmentThesisSummary),
    dueDiligenceApproach: arr(r.due_diligence_approach, r.dueDiligenceApproach),
    preferredSelections: arr(r.preferred_selections, r.preferredSelections),
    totalCapitalInvested: numStr(r.total_capital_invested, r.totalCapitalInvested),
    numberOfInvestmentsMade: numStr(r.number_of_investments_made, r.numberOfInvestmentsMade),
    activePortfolioCompanies: numStr(r.active_portfolio_companies, r.activePortfolioCompanies),
    portfolioSupportCapabilities: str(r.portfolio_support_capabilities, r.portfolioSupportCapabilities),
  };
}

/** `GET /auth/investor` — matches web's `fetchInvestorProfile`. */
export async function fetchInvestorThesis(): Promise<InvestorThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.INVESTOR).then(res => res.data).catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  return normalizeInvestorThesis(envelope?.data ?? envelope?.investor ?? envelope);
}

/** `PUT /auth/investor`, body `{ formData: payload }` — matches web's `saveInvestorProfile`
 * exactly. Unlike Intermediary's `updateIntermediaryThesis`, there's no field-remapping quirk —
 * confirmed no dual-send-under-two-names behavior exists for Investor. */
export async function updateInvestorThesis(payload: Partial<InvestorThesis>): Promise<void> {
  await apiClient.put(AUTH_ENDPOINTS.INVESTOR, { formData: payload });
}

/** `GET /profile/investment-thesis/completion` — matches web's `fetchInvestmentThesisCompletion`.
 * Unlike Intermediary/Searcher, this is fetched for informational purposes only (the top
 * completeness bar) — no Investor card ever reads per-section `complete` to drive its own
 * badge/CTA, since none of them show one (`showStatus={false}` throughout). */
export async function fetchInvestorThesisCompletion(): Promise<RoleThesisCompletion> {
  const data = await apiClient.get(ROLE_THESIS_ENDPOINTS.INVESTMENT_THESIS_COMPLETION).then(res => res.data).catch(() => null);
  return normalizeCompletion((data as Record<string, unknown> | null)?.data ?? data);
}

/**
 * Lender role — a dedicated GET, like Intermediary/Investor (unlike Searcher, which has none).
 * Unlike Investor, Lender's 5 cards DO show a status badge + "Complete this section" CTA
 * (`RoleThesisSectionCard`'s default `showStatus=true` mode) — web's `CardShell` receives explicit
 * `complete`/`incomplete` for every one of Lender's cards (`LenderThesisTab.tsx`'s own local
 * `hasData` per card), matching Intermediary/Searcher's architecture, not Investor's always-edit
 * one. Per-card `complete` here is computed 100% client-side from `LenderThesis` data (same
 * `hasData` expressions web itself uses, quoted per-card at each sheet's call site) — NOT from
 * `fetchLenderThesisCompletion()`'s per-section array, which (like every other role) is fetched for
 * the top completeness bar only; see Searcher's own completion-architecture doc comment for why
 * server-index-based per-card lookups were dropped project-wide.
 *
 * Field mapping matches web's real `parseRoleProfile` (`LenderThesisTab.tsx:139-200`) verbatim,
 * including its real dual-write/transcoding quirks — centralized in `updateLenderThesis` below
 * (mirroring web's own `buildApiPayload`) rather than scattered across each sheet, since nearly
 * every field here has one: `sbaStatus` writes to `sbaFinancing`+derived `isSbaPreferredLender`;
 * `industries` writes to THREE parallel keys (`borrowerIndustries`/`industries`/`lendingIndustries`);
 * `minEquityContribution` is read as `"20%"` but sent back as a bare int; `typicalLoanDuration`
 * ("5 years") and `typicalApprovalTimeline` ("4-6 weeks") are both string↔int transcoded via fixed
 * lookup tables; `repaymentTypes` is a multi-select UI but only its first value is ever persisted
 * (`amortizationType = repaymentTypes[0]`); `collateralRequirements`/`ddRequirements` each dual-write
 * to a second aliased key server-side.
 */
export type LenderThesis = {
  profileId: string;
  typeOfFinancing: string[];
  financingProducts: string[];
  dealStagePreference: string[];
  sbaStatus: string;
  typicalLoanSizeMin: string;
  typicalLoanSizeMax: string;
  lendingCriteriaDocumentUrl: string;
  industries: string[];
  excludedIndustries: string[];
  geographies: string[];
  targetRevenueMin: string;
  targetRevenueMax: string;
  targetEbitdaMin: string;
  targetEbitdaMax: string;
  targetDealSizeMin: string;
  targetDealSizeMax: string;
  minEquityContribution: string;
  interestRateMin: string;
  interestRateMax: string;
  typicalLoanDuration: string;
  repaymentTypes: string[];
  collateralRequirements: string[];
  whenGetInvolved: string[];
  typicalApprovalTimeline: string;
  dueDiligenceRequired: boolean | null;
  ddRequirements: string[];
  yearsOfLendingExperience: string;
  numberOfDealsFunded: string;
  totalCapitalDeployed: string;
  valueAddDifferentiation: string[];
};

/** Matches web's real `WEEKS_TO_TIMELINE`/`TIMELINE_TO_WEEKS` (`LenderThesisTab.tsx:129-137`)
 * verbatim — both directions needed since reads convert weeks→label and saves convert label→weeks. */
const WEEKS_TO_TIMELINE: Record<number, string> = {
  2: '1-2 weeks',
  4: '2-4 weeks',
  6: '4-6 weeks',
  8: '6-8 weeks',
  12: '8-12 weeks',
  26: '3-6 months',
  30: '6+ months',
};
const TIMELINE_TO_WEEKS: Record<string, number> = {
  '1-2 weeks': 2,
  '2-4 weeks': 4,
  '4-6 weeks': 6,
  '6-8 weeks': 8,
  '8-12 weeks': 12,
  '3-6 months': 26,
  '6+ months': 30,
};

function normalizeLenderThesis(raw: unknown): LenderThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b: unknown) => String(a ?? b ?? '');
  const numStr = (a: unknown, b: unknown) => (a != null ? String(a) : b != null ? String(b) : '');
  const arr = (...vals: unknown[]): string[] => (vals.find(v => Array.isArray(v)) as string[] | undefined) ?? [];

  const equityNum = r.minEquityContribution ?? r.min_equity_contribution;
  const minEquityContribution = equityNum != null ? `${equityNum}%` : '';

  const durationMin = r.loanDurationMin ?? r.loan_duration_min;
  const typicalLoanDuration = durationMin != null ? `${durationMin} ${durationMin === 1 ? 'year' : 'years'}` : '';

  const weeksRaw = r.timelineToCloseWeeks ?? r.timeline_to_close_weeks;
  const typicalApprovalTimeline =
    weeksRaw != null ? WEEKS_TO_TIMELINE[weeksRaw as number] ?? `${weeksRaw} weeks` : '';

  const collateralRequirements = [
    ...new Set([...arr(r.financialGuarantees, r.financial_guarantees), ...arr(r.collateralRequirements, r.collateral_requirements)]),
  ];
  const ddRequirements = [
    ...new Set([...arr(r.documentsRequired, r.documents_required), ...arr(r.dueDiligenceRequirements, r.due_diligence_requirements)]),
  ];

  const amortizationType = r.amortizationType ?? r.amortization_type;
  const isSbaPreferred = r.is_sba_preferred_lender ?? r.isSbaPreferredLender;
  const sbaStatus = str(
    (Array.isArray(r.sba_financing_status) ? (r.sba_financing_status as unknown[])[0] : undefined) ?? r.sbaFinancingStatus,
    isSbaPreferred === true ? 'Yes. SBA-approved lender' : isSbaPreferred === false ? 'No. Non-SBA lending only' : undefined,
  );

  const dueDiligenceRequired = r.dueDiligenceRequired ?? r.due_diligence_required;

  return {
    profileId: str(r.profile_id, r.profileId),
    typeOfFinancing: arr(r.typesOfFinancing, r.types_of_financing, r.typeOfFinancing),
    financingProducts: arr(r.financingProducts, r.financing_products),
    dealStagePreference: arr(r.dealStagePreference, r.deal_stage_preference),
    sbaStatus,
    typicalLoanSizeMin: numStr(r.loanSizeMin, r.typical_loan_size_min) || numStr(r.typicalLoanSizeMin, undefined),
    typicalLoanSizeMax: numStr(r.loanSizeMax, r.typical_loan_size_max) || numStr(r.typicalLoanSizeMax, undefined),
    lendingCriteriaDocumentUrl: str(r.lendingCriteriaUrl, r.lending_firm_deck_url) || str(r.lendingCriteriaDocumentUrl, ''),
    industries: arr(r.borrowerIndustries, r.borrower_industries, r.lendingIndustries, r.lending_industries, r.industries),
    excludedIndustries: arr(r.excludedIndustries, r.excluded_industries),
    geographies: arr(r.geographies, r.active_lending_geographies),
    targetRevenueMin: numStr(r.businessRevenueMin, r.business_revenue_min) || numStr(r.targetRevenueMin, undefined),
    targetRevenueMax: numStr(r.businessRevenueMax, r.business_revenue_max) || numStr(r.targetRevenueMax, undefined),
    targetEbitdaMin: numStr(r.ebitdaMin, r.minimum_ebitda_min) || numStr(r.targetEbitdaMin, undefined),
    targetEbitdaMax: numStr(r.ebitdaMax, r.minimum_ebitda_max) || numStr(r.targetEbitdaMax, undefined),
    targetDealSizeMin: numStr(r.dealSizeMin, r.typical_deal_size_min) || numStr(r.targetDealSizeMin, undefined),
    targetDealSizeMax: numStr(r.dealSizeMax, r.typical_deal_size_max) || numStr(r.targetDealSizeMax, undefined),
    minEquityContribution,
    interestRateMin: numStr(r.interestRateMin, r.interest_rate_min),
    interestRateMax: numStr(r.interestRateMax, r.interest_rate_max),
    typicalLoanDuration,
    repaymentTypes: amortizationType ? [String(amortizationType)] : arr(r.repaymentTypes, undefined),
    collateralRequirements,
    whenGetInvolved: arr(r.whenGetInvolved, r.when_get_involved),
    typicalApprovalTimeline,
    dueDiligenceRequired: dueDiligenceRequired == null ? (ddRequirements.length > 0 ? true : null) : Boolean(dueDiligenceRequired),
    ddRequirements,
    yearsOfLendingExperience: str(r.yearsOfLendingExperience, r.years_of_lending_experience),
    numberOfDealsFunded: numStr(r.dealsFunded, r.deals_funded) || numStr(r.numberOfDealsFunded, undefined),
    totalCapitalDeployed: numStr(r.totalVolumeDeployed, r.total_volume_deployed) || numStr(r.totalCapitalDeployed, undefined),
    valueAddDifferentiation: arr(r.valueAddDifferentiation, r.value_add_differentiation),
  };
}

/** `GET /auth/lender` — matches web's `fetchLenderProfile`. */
export async function fetchLenderThesis(): Promise<LenderThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.LENDER).then(res => res.data).catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  return normalizeLenderThesis(envelope?.data ?? envelope?.lender ?? envelope);
}

/** `PUT /auth/lender`, body `{ formData: payload }` — matches web's `updateLenderProfile` +
 * `buildApiPayload` (`LenderThesisTab.tsx:202-268`) exactly. Caller passes only the `LenderThesis`
 * fields for the one card being saved (our canonical camelCase names); this expands each one to its
 * real wire shape, including every dual-write/transcode quirk documented on `LenderThesis` above. */
export async function updateLenderThesis(payload: Partial<LenderThesis>): Promise<void> {
  const p: Record<string, unknown> = {};

  if (payload.typeOfFinancing !== undefined) p.typesOfFinancing = payload.typeOfFinancing;
  if (payload.financingProducts !== undefined) p.financingProducts = payload.financingProducts;
  if (payload.dealStagePreference !== undefined) p.dealStagePreference = payload.dealStagePreference;
  if (payload.sbaStatus !== undefined) {
    p.sbaFinancing = payload.sbaStatus ? [payload.sbaStatus] : [];
    p.isSbaPreferredLender = payload.sbaStatus === 'Yes. SBA-approved lender' || payload.sbaStatus === 'Both';
  }
  if (payload.typicalLoanSizeMin !== undefined) p.loanSizeMin = payload.typicalLoanSizeMin ? Number(payload.typicalLoanSizeMin) : undefined;
  if (payload.typicalLoanSizeMax !== undefined) p.loanSizeMax = payload.typicalLoanSizeMax ? Number(payload.typicalLoanSizeMax) : undefined;

  if (payload.lendingCriteriaDocumentUrl !== undefined) p.lendingCriteriaUrl = payload.lendingCriteriaDocumentUrl;
  if (payload.industries !== undefined) {
    p.borrowerIndustries = payload.industries;
    p.industries = payload.industries;
    p.lendingIndustries = payload.industries;
  }
  if (payload.excludedIndustries !== undefined) p.excludedIndustries = payload.excludedIndustries;
  if (payload.geographies !== undefined) p.geographies = payload.geographies;
  if (payload.targetRevenueMin !== undefined) p.businessRevenueMin = payload.targetRevenueMin ? Number(payload.targetRevenueMin) : undefined;
  if (payload.targetRevenueMax !== undefined) p.businessRevenueMax = payload.targetRevenueMax ? Number(payload.targetRevenueMax) : undefined;
  if (payload.targetEbitdaMin !== undefined) p.businessEbitdaMin = payload.targetEbitdaMin ? Number(payload.targetEbitdaMin) : undefined;
  if (payload.targetEbitdaMax !== undefined) p.businessEbitdaMax = payload.targetEbitdaMax ? Number(payload.targetEbitdaMax) : undefined;
  if (payload.targetDealSizeMin !== undefined) p.dealSizeMin = payload.targetDealSizeMin ? Number(payload.targetDealSizeMin) : undefined;
  if (payload.targetDealSizeMax !== undefined) p.dealSizeMax = payload.targetDealSizeMax ? Number(payload.targetDealSizeMax) : undefined;

  if (payload.minEquityContribution !== undefined) {
    const parsed = parseInt(payload.minEquityContribution, 10);
    p.minEquityContribution = payload.minEquityContribution && !Number.isNaN(parsed) ? parsed : null;
  }
  if (payload.interestRateMin !== undefined) p.interestRateMin = payload.interestRateMin ? Number(payload.interestRateMin) : undefined;
  if (payload.interestRateMax !== undefined) p.interestRateMax = payload.interestRateMax ? Number(payload.interestRateMax) : undefined;
  if (payload.typicalLoanDuration !== undefined) {
    const parsed = parseInt(payload.typicalLoanDuration, 10);
    const num = payload.typicalLoanDuration && !Number.isNaN(parsed) ? parsed : null;
    p.loanDurationMin = num;
    p.loanDurationMax = num;
  }
  if (payload.repaymentTypes !== undefined) p.amortizationType = payload.repaymentTypes?.[0] ?? null;
  if (payload.collateralRequirements !== undefined) {
    p.collateralRequirements = payload.collateralRequirements;
    p.financialGuarantees = payload.collateralRequirements;
  }

  if (payload.whenGetInvolved !== undefined) p.whenGetInvolved = payload.whenGetInvolved;
  if (payload.typicalApprovalTimeline !== undefined) {
    p.timelineToCloseWeeks = payload.typicalApprovalTimeline ? TIMELINE_TO_WEEKS[payload.typicalApprovalTimeline] ?? null : null;
  }
  if (payload.dueDiligenceRequired !== undefined) p.dueDiligenceRequired = payload.dueDiligenceRequired;
  if (payload.ddRequirements !== undefined) {
    p.documentsRequired = payload.ddRequirements;
    p.dueDiligenceRequirements = payload.ddRequirements;
  }

  if (payload.yearsOfLendingExperience !== undefined) p.yearsOfLendingExperience = payload.yearsOfLendingExperience;
  if (payload.numberOfDealsFunded !== undefined) p.dealsFunded = payload.numberOfDealsFunded ? Number(payload.numberOfDealsFunded) : undefined;
  if (payload.totalCapitalDeployed !== undefined) p.totalVolumeDeployed = payload.totalCapitalDeployed ? Number(payload.totalCapitalDeployed) : undefined;
  if (payload.valueAddDifferentiation !== undefined) p.valueAddDifferentiation = payload.valueAddDifferentiation;

  await apiClient.put(AUTH_ENDPOINTS.LENDER, { formData: p });
}

/** `GET /profile/lending-thesis/completion` — matches web's `fetchLendingThesisCompletion`. Fetched
 * for the top completeness bar only — see `LenderThesis`'s own doc comment for why each card's
 * `complete` prop is computed client-side instead. */
export async function fetchLenderThesisCompletion(): Promise<RoleThesisCompletion> {
  const data = await apiClient.get(ROLE_THESIS_ENDPOINTS.LENDING_THESIS_COMPLETION).then(res => res.data).catch(() => null);
  return normalizeCompletion((data as Record<string, unknown> | null)?.data ?? data);
}

/**
 * Advisor role — a dedicated GET, like Intermediary/Investor/Lender (unlike Searcher). All 5 cards
 * show a status badge + "Complete this section" CTA (`RoleThesisSectionCard`'s default
 * `showStatus=true`), matching Lender/Searcher/Intermediary — web's `CardShell` receives explicit
 * `complete`/`incomplete` for every Advisor card, confirmed not the Investor `alwaysShowEdit`
 * pattern. Per-card `complete` is computed 100% client-side (see each `hasData` formula quoted at
 * its call site in `AdvisorThesisTab.tsx`), matching the project-wide convention.
 *
 * Field mapping matches web's real `parseAdvisorResponse` (`AdvisorThesisTab.tsx:106-137`)
 * verbatim — a much simpler read/write asymmetry than Lender's: every field is a plain two-way
 * `snake_case ?? camelCase` fallback (no dual-write-to-two-keys quirks, no string↔int lookup-table
 * transcoding), EXCEPT `geographies`, which — uniquely among Advisor's fields — needs the same
 * "each entry may be a plain string OR an object with `countryName`/`label`" normalization already
 * seen on Searcher's own `geographies` field. `updateAdvisorThesis` sends plain camelCase keys
 * as-is (matching web's own `handleSave`, which has NO `buildApiPayload`-equivalent remapping step
 * at all — confirmed by reading it directly) — only numeric string→number conversion is needed.
 */
export type AdvisorThesis = {
  profileId: string;
  advisorRole: string;
  yearsExperience: string;
  coreServices: string[];
  clientTypes: string[];
  engagementStages: string[];
  primaryRepresentation: string;
  engagementModelTypes: string[];
  primaryIndustries: string[];
  geographies: string[];
  dealSizeMin: string;
  dealSizeMax: string;
  projectFeeMin: string;
  projectFeeMax: string;
  monthlyRetainerMin: string;
  monthlyRetainerMax: string;
  hourlyRateMin: string;
  hourlyRateMax: string;
  successDealFee: string;
  commercialsNote: string;
  dealsCompleted: string;
  firmCredentialsUrl: string;
  credentialsPublic: boolean;
  differentiationBio: string;
  keyStrengths: string[];
  redactedWorkUrl: string;
  credentialsLinkUrl: string;
};

function normalizeAdvisorThesis(raw: unknown): AdvisorThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b: unknown) => String(a ?? b ?? '');
  const numStr = (a: unknown, b: unknown) => (a != null ? String(a) : b != null ? String(b) : '');
  const arr = (...vals: unknown[]): string[] => (vals.find(v => Array.isArray(v)) as string[] | undefined) ?? [];
  const bool = (...vals: unknown[]) => {
    const v = vals.find(x => x != null);
    return v == null ? false : Boolean(v);
  };
  const geographies = (arr(r.active_service_geographies, r.geographies) as unknown[])
    .map(g => (typeof g === 'string' ? g : String((g as Record<string, unknown> | null)?.countryName ?? (g as Record<string, unknown> | null)?.label ?? '')))
    .filter(Boolean);

  return {
    profileId: str(r.profile_id, r.profileId),
    advisorRole: str(r.advisor_role, r.advisorRole),
    yearsExperience: str(r.years_of_relevant_experience, r.yearsExperience),
    coreServices: arr(r.core_services_offered, r.coreServices),
    clientTypes: arr(r.typical_clients, r.clientTypes),
    engagementStages: arr(r.engagement_stages, r.engagementStages),
    primaryRepresentation: str(r.primary_representation, r.primaryRepresentation),
    engagementModelTypes: arr(r.engagement_model_types, r.engagementModelTypes),
    primaryIndustries: arr(r.primary_industries, r.primaryIndustries),
    geographies,
    dealSizeMin: numStr(r.deal_size_min, r.dealSizeMin),
    dealSizeMax: numStr(r.deal_size_max, r.dealSizeMax),
    projectFeeMin: numStr(r.project_fee_min, r.projectFeeMin),
    projectFeeMax: numStr(r.project_fee_max, r.projectFeeMax),
    monthlyRetainerMin: numStr(r.monthly_retainer_min, r.monthlyRetainerMin),
    monthlyRetainerMax: numStr(r.monthly_retainer_max, r.monthlyRetainerMax),
    hourlyRateMin: numStr(r.hourly_rate_min, r.hourlyRateMin),
    hourlyRateMax: numStr(r.hourly_rate_max, r.hourlyRateMax),
    successDealFee: numStr(r.success_deal_fee, r.successDealFee),
    commercialsNote: str(r.commercials_note, r.commercialsNote),
    dealsCompleted: numStr(r.deals_completed, r.dealsCompleted),
    firmCredentialsUrl: str(r.advisory_firm_deck_url, r.firmCredentialsUrl),
    credentialsPublic: bool(r.credentials_public, r.credentialsPublic),
    differentiationBio: str(r.differentiation_bio, r.differentiationBio),
    keyStrengths: arr(r.key_strengths, r.keyStrengths),
    redactedWorkUrl: str(r.redacted_work_url, r.redactedWorkUrl),
    credentialsLinkUrl: str(r.credentials_link_url, r.credentialsLinkUrl),
  };
}

/** `GET /auth/advisor` — matches web's `fetchAdvisorProfile`. */
export async function fetchAdvisorThesis(): Promise<AdvisorThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.ADVISOR).then(res => res.data).catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  return normalizeAdvisorThesis(envelope?.data ?? envelope?.advisor ?? envelope);
}

/** `PUT /auth/advisor`, body `{ formData: payload }` — matches web's `updateAdvisorProfile` exactly.
 * Unlike Lender, web's own `handleSave` has no remapping step at all: local camelCase field names
 * ARE the wire keys web sends. Numeric string fields are converted right before the PUT, same as
 * every other role's convention. */
export async function updateAdvisorThesis(payload: Partial<AdvisorThesis>): Promise<void> {
  const p: Record<string, unknown> = { ...payload };
  const numericFields: (keyof AdvisorThesis)[] = [
    'dealSizeMin', 'dealSizeMax', 'projectFeeMin', 'projectFeeMax',
    'monthlyRetainerMin', 'monthlyRetainerMax', 'hourlyRateMin', 'hourlyRateMax',
    'successDealFee', 'dealsCompleted',
  ];
  for (const field of numericFields) {
    if (payload[field] !== undefined) {
      const value = payload[field] as string;
      p[field] = value ? Number(value) : undefined;
    }
  }
  await apiClient.put(AUTH_ENDPOINTS.ADVISOR, { formData: p });
}

/** `GET /profile/advisor-thesis/completion` — matches web's `fetchAdvisorThesisCompletion`. Fetched
 * for the top completeness bar only — see `AdvisorThesis`'s own doc comment for why each card's
 * `complete` prop is computed client-side instead. */
export async function fetchAdvisorThesisCompletion(): Promise<RoleThesisCompletion> {
  const data = await apiClient.get(ROLE_THESIS_ENDPOINTS.ADVISOR_THESIS_COMPLETION).then(res => res.data).catch(() => null);
  return normalizeCompletion((data as Record<string, unknown> | null)?.data ?? data);
}

/**
 * Operator role — a dedicated GET, like Intermediary/Investor/Lender/Advisor (unlike Searcher). All
 * 6 cards show a status badge + "Complete this section" CTA (`RoleThesisSectionCard`'s default
 * `showStatus=true`), matching every already-built role except Investor — web's `CardShell`
 * receives explicit `complete`/`incomplete` for every Operator card, confirmed not the Investor
 * `alwaysShowEdit` pattern. Per-card `complete` is computed 100% client-side (see each `hasData`
 * formula quoted at its call site in `OperatorThesisTab.tsx`), matching the project-wide convention.
 *
 * Field mapping matches web's real `parseRoleProfile` (`OperatorThesisTab.tsx`) verbatim — every
 * field is a plain two-way `camelCase ?? snake_case` fallback, no dual-write quirks, no string↔int
 * lookup-table transcoding (Advisor-style simplicity, not Lender's). `updateOperatorThesis` sends
 * plain camelCase keys as-is (matching web's own `buildApiPayload`, which has no remapping step at
 * all) — only numeric string→number conversion is needed for the 6 money/count fields.
 *
 * `noticePeriod` exists on web's own type/parse function but is a confirmed dead field — no card
 * reads or writes it — so it's deliberately omitted here rather than plumbed through for nothing.
 *
 * LinkedIn URL is a genuine architectural quirk: it's NOT part of Operator's own data at all on
 * web — it lives on the general profile record and saves through a completely separate
 * `updateMyProfile` call (`PUT /profile/update-profile`, same endpoint mobile's own
 * `updateProfile()` already uses) only when changed, run in parallel with the Operator PUT. Kept
 * out of `OperatorThesis` entirely; `ProfileMaterialsSheet` reads/writes it via `profile.linkedin_url`
 * and `updateProfile()` directly instead.
 */
export type OperatorThesis = {
  profileId: string;
  currentDesignation: string;
  totalExperience: string;
  functionalStrengths: string[];
  revenueManaged: string;
  teamSizeManaged: string;
  keyOutcomesDelivered: string;
  transactionExperience: string[];
  leadershipExperience: string[];
  operatingBio: string;
  engagementType: string[];
  workMode: string[];
  dealStagePreference: string[];
  startRoleWith: string[];
  timeCommitment: string;
  compensationPreference: string[];
  industryInterests: string[];
  geographyFocus: string[];
  revenueRangeMin: string;
  revenueRangeMax: string;
  employeeCountMin: string;
  employeeCountMax: string;
  startDatePreference: string;
  relocationPreference: string[];
  equityAppetite: string[];
  resumeUrl: string;
  coverLetterUrl: string;
  professionalStatement: string;
};

function normalizeOperatorThesis(raw: unknown): OperatorThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b: unknown) => String(a ?? b ?? '');
  const numStr = (a: unknown, b: unknown) => (a != null ? String(a) : b != null ? String(b) : '');
  const arr = (...vals: unknown[]): string[] => (vals.find(v => Array.isArray(v)) as string[] | undefined) ?? [];

  return {
    profileId: str(r.profile_id, r.profileId),
    currentDesignation: str(r.currentDesignation, r.current_designation) || str(r.current_professional_role, ''),
    totalExperience: str(r.totalExperience, r.total_years_experience),
    functionalStrengths: arr(r.functionalStrengths, r.primary_functional_strengths),
    revenueManaged: numStr(r.revenueManaged, r.revenue_managed),
    teamSizeManaged: numStr(r.teamSizeManaged, r.team_size_managed),
    keyOutcomesDelivered: str(r.keyOutcomesDelivered, r.key_outcomes_delivered),
    transactionExperience: arr(r.transactionExperience, r.acquisition_transaction_experience),
    leadershipExperience: arr(r.leadershipExperience, r.leadership_experience),
    operatingBio: str(r.operatingBio, r.operating_bio),
    engagementType: arr(r.engagementType, r.preferred_engagement_types),
    workMode: arr(r.workMode, r.preferred_work_modes),
    dealStagePreference: arr(r.dealStagePreference, r.deal_stage_preference),
    startRoleWith: arr(r.startRoleWith, r.start_role_with),
    timeCommitment: str(r.timeCommitment, r.time_commitment),
    compensationPreference: arr(r.compensationPreference, r.compensation_preferences),
    industryInterests: arr(r.industryInterests, r.industry_interests),
    geographyFocus: arr(r.geographyFocus, r.geography_focus),
    revenueRangeMin: numStr(r.revenueRangeMin, r.revenue_range_min),
    revenueRangeMax: numStr(r.revenueRangeMax, r.revenue_range_max),
    employeeCountMin: numStr(r.employeeCountMin, r.employee_count_min),
    employeeCountMax: numStr(r.employeeCountMax, r.employee_count_max),
    startDatePreference: str(r.startDatePreference, r.start_date_preference),
    relocationPreference: arr(r.relocationPreference, r.relocation_preference),
    equityAppetite: arr(r.equityAppetite, r.equity_appetite),
    resumeUrl: str(r.resumeUrl, r.resume_url),
    coverLetterUrl: str(r.coverLetterUrl, r.cover_letter_url),
    professionalStatement: str(r.professionalStatement, r.professional_statement),
  };
}

/** `GET /auth/operator` — matches web's `fetchOperatorProfile`. */
export async function fetchOperatorThesis(): Promise<OperatorThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.OPERATOR).then(res => res.data).catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  return normalizeOperatorThesis(envelope?.data ?? envelope?.operator ?? envelope);
}

/** `PUT /auth/operator`, body `{ formData: payload }` — matches web's `updateOperatorProfile` +
 * `buildApiPayload` exactly: plain camelCase passthrough, no remapping. Only the 6 money/count
 * fields need Number() conversion right before the PUT. */
export async function updateOperatorThesis(payload: Partial<OperatorThesis>): Promise<void> {
  const p: Record<string, unknown> = { ...payload };
  const numericFields: (keyof OperatorThesis)[] = [
    'revenueManaged', 'teamSizeManaged', 'revenueRangeMin', 'revenueRangeMax', 'employeeCountMin', 'employeeCountMax',
  ];
  for (const field of numericFields) {
    if (payload[field] !== undefined) {
      const value = payload[field] as string;
      p[field] = value ? Number(value) : undefined;
    }
  }
  await apiClient.put(AUTH_ENDPOINTS.OPERATOR, { formData: p });
}

/** `GET /profile/operator-thesis/completion` — matches web's `fetchOperatorThesisCompletion`.
 * Fetched for the top completeness bar only — see `OperatorThesis`'s own doc comment for why each
 * card's `complete` prop is computed client-side instead. */
export async function fetchOperatorThesisCompletion(): Promise<RoleThesisCompletion> {
  const data = await apiClient.get(ROLE_THESIS_ENDPOINTS.OPERATOR_THESIS_COMPLETION).then(res => res.data).catch(() => null);
  return normalizeCompletion((data as Record<string, unknown> | null)?.data ?? data);
}

/**
 * View Profile's Role Thesis tab, **Business Owner** role (`role_type === 'seller'`). This is the
 * OTHER HALF of web's own filename/import-swap bug (see `AUTH_ENDPOINTS.INTERMEDIARY`'s doc
 * comment): `role_type === 'seller'` actually renders the file literally named
 * `IntermediaryThesisTab.tsx` and persists through `/auth/intermediary` — confirmed directly from
 * that file's own `fetchIntermediaryProfile`/`updateIntermediaryProfile` calls
 * (`webSrc/actions/my-profile.ts:516-528`). Replicated on purpose (confirmed with the user:
 * "we needs to do same as Web app") — mobile's `IntermediaryThesis` above already correctly holds
 * the REAL Seller fields/endpoint for `role_type === 'intermediary'`; this type is the mirror image.
 *
 * Unlike every other role built so far, this component has **no server completion endpoint at
 * all** — web's real `IntermediaryThesisTab.tsx` computes its top completeness bar with a pure
 * local function (`calcCompletion`, lines 198-210) instead of fetching one. A real
 * `fetchIntermediaryThesisCompletion` action exists in web's own actions file
 * (`/api/profile/intermediary-thesis/completion`) but the live component simply never calls it —
 * dead code on web's side, not a gap to fill here. `calcBusinessOwnerThesisCompletion` below
 * mirrors that exact local formula instead of adding a fetch web itself doesn't make.
 */
export type BusinessOwnerThesis = {
  profileId: string;
  reasonForTransaction: string;
  currentSituation: string;
  typesOfTransitionOpenTo: string[];
  targetTimeline: string;
  businessIndustry: string;
  businessModel: string;
  businessLocation: string;
  yearsInOperation: string;
  businessRevenueMin: string;
  businessRevenueMax: string;
  businessEbitdaMin: string;
  businessEbitdaMax: string;
  valuationMin: string;
  valuationMax: string;
  ownershipStake: string;
  preferredBuyerType: string[];
  operatorInvolvement: string;
  /** GET's real DB field is `owner_current_role`, NOT `current_role` — confirmed from
   * `parseApiResponse` (`IntermediaryThesisTab.tsx:155`). The PUT payload key IS `currentRole`
   * (camelCase, matching `buildApiPayload`'s own `p.currentRole = d.currentRole`) — only the GET
   * side's snake_case source differs from the obvious guess. */
  currentRole: string;
  dayToDayInvolvement: string;
  managementTeam: string;
  advisorSupport: string;
  postTransactionInvolvement: string;
  keyGrowthOpportunities: string;
  currentConstraintsChallenges: string;
  cimDocumentUrl: string;
};

function normalizeBusinessOwnerThesis(raw: unknown): BusinessOwnerThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b: unknown) => String(a ?? b ?? '');
  const numStr = (a: unknown, b: unknown) => (a != null ? String(a) : b != null ? String(b) : '');
  const arr = (...vals: unknown[]): string[] => (vals.find(v => Array.isArray(v)) as string[] | undefined) ?? [];

  return {
    profileId: str(r.profile_id, r.profileId),
    reasonForTransaction: str(r.reasonForTransaction, r.reason_for_transaction),
    currentSituation: str(r.currentSituation, r.current_situation),
    typesOfTransitionOpenTo: arr(r.typesOfTransitionOpenTo, r.types_of_transition_open_to),
    targetTimeline: str(r.targetTimeline, r.target_timeline),
    businessIndustry: str(r.businessIndustry, r.business_industry),
    businessModel: str(r.businessModel, r.business_model),
    businessLocation: str(r.businessLocation, r.business_location),
    yearsInOperation: str(r.yearsInOperation, r.years_in_operation),
    businessRevenueMin: numStr(r.businessRevenueMin, r.business_revenue_min),
    businessRevenueMax: numStr(r.businessRevenueMax, r.business_revenue_max),
    businessEbitdaMin: numStr(r.businessEbitdaMin, r.business_ebitda_min),
    businessEbitdaMax: numStr(r.businessEbitdaMax, r.business_ebitda_max),
    valuationMin: numStr(r.valuationMin, r.valuation_min),
    valuationMax: numStr(r.valuationMax, r.valuation_max),
    ownershipStake: str(r.ownershipStake, r.ownership_stake),
    preferredBuyerType: arr(r.preferredBuyerType, r.preferred_buyer_type),
    operatorInvolvement: str(r.operatorInvolvement, r.operator_involvement),
    currentRole: str(r.currentRole, r.owner_current_role),
    dayToDayInvolvement: str(r.dayToDayInvolvement, r.day_to_day_involvement),
    managementTeam: str(r.managementTeam, r.management_team),
    advisorSupport: str(r.advisorSupport, r.advisor_support),
    postTransactionInvolvement: str(r.postTransactionInvolvement, r.post_transaction_involvement),
    keyGrowthOpportunities: str(r.keyGrowthOpportunities, r.key_growth_opportunities),
    currentConstraintsChallenges: str(r.currentConstraintsChallenges, r.current_constraints_challenges),
    cimDocumentUrl: str(r.cimDocumentUrl, r.cim_document_url),
  };
}

/** `GET /auth/intermediary` — matches web's real `fetchIntermediaryProfile` (the function actually
 * called by `role_type === 'seller'`, per this type's own doc comment above). */
export async function fetchBusinessOwnerThesis(): Promise<BusinessOwnerThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.INTERMEDIARY).then(res => res.data).catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  return normalizeBusinessOwnerThesis(envelope?.data ?? envelope?.intermediary ?? envelope);
}

/** `PUT /auth/intermediary`, body `{ formData: payload }` — matches web's real
 * `updateIntermediaryProfile` + `buildApiPayload` exactly: plain camelCase passthrough (including
 * `currentRole`, despite the GET side reading `owner_current_role` — see the type's own doc
 * comment). Only the 6 money-range fields need `Number()` conversion right before the PUT — web's
 * own `buildApiPayload` also strips thousands-separator commas first
 * (`d.valuationMin.replace(/,/g, "")`), replicated here since mobile's plain number-pad `TextInput`s
 * never contain commas to begin with, but kept for byte-for-byte parity with a pasted value. */
export async function updateBusinessOwnerThesis(payload: Partial<BusinessOwnerThesis>): Promise<void> {
  const p: Record<string, unknown> = { ...payload };
  const numericFields: (keyof BusinessOwnerThesis)[] = [
    'businessRevenueMin', 'businessRevenueMax', 'businessEbitdaMin', 'businessEbitdaMax', 'valuationMin', 'valuationMax',
  ];
  for (const field of numericFields) {
    if (payload[field] !== undefined) {
      const value = (payload[field] as string).replace(/,/g, '');
      p[field] = value ? Number(value) : undefined;
    }
  }
  await apiClient.put(AUTH_ENDPOINTS.INTERMEDIARY, { formData: p });
}

/** Pure client-side completion calculator — matches web's real `calcCompletion`
 * (`IntermediaryThesisTab.tsx:198-210`) exactly, section-for-section and formula-for-formula. NOT a
 * fetch — see this type's own doc comment for why web itself never calls a completion endpoint for
 * this role. Each of these 6 formulas is DELIBERATELY narrower than its own card's `hasData` (e.g.
 * "Business Snapshot" here omits `yearsInOperation`, which Card 2's own badge DOES count) — matches
 * web's real, genuinely inconsistent formulas verbatim rather than unifying them, same as every
 * other role's top-bar-vs-card-badge split built so far. */
export function calcBusinessOwnerThesisCompletion(t: BusinessOwnerThesis): RoleThesisCompletion {
  const sections: { label: string; complete: boolean }[] = [
    { label: 'Transaction Intent', complete: !!(t.reasonForTransaction || t.typesOfTransitionOpenTo.length || t.targetTimeline) },
    { label: 'Business Snapshot', complete: !!(t.businessIndustry || t.businessLocation || t.businessRevenueMin) },
    { label: 'Deal Overview', complete: !!(t.valuationMin || t.ownershipStake || t.preferredBuyerType.length) },
    { label: 'Operations & Transition', complete: !!(t.currentRole || t.dayToDayInvolvement || t.postTransactionInvolvement) },
    { label: 'Growth & Risks', complete: !!(t.keyGrowthOpportunities || t.currentConstraintsChallenges) },
    { label: 'Supporting Materials', complete: !!t.cimDocumentUrl },
  ];
  const filled = sections.filter(s => s.complete).length;
  return {
    percentage: Math.round((filled / sections.length) * 100),
    sections: sections.map(s => ({ ...s, percentage: s.complete ? 100 : 0 })),
  };
}

/**
 * View Profile's Role Thesis tab, **Student** role (`role_type === 'student'`). Straight,
 * correctly-named import on web (`StudentThesisTab.tsx`) — no filename/import-swap quirk like
 * Intermediary/Business Owner above. Same "no server completion endpoint" architecture as
 * `BusinessOwnerThesis` — web's real `calcLocalCompletion` (`StudentThesisTab.tsx:1047-1064`) is a
 * pure local function, replicated as `calcStudentThesisCompletion` below rather than adding a fetch
 * web itself doesn't make.
 *
 * **The one genuinely unique thing about this role**: GET and PUT use DIFFERENT field names for
 * more than half the fields — not just a snake_case/camelCase casing difference like every other
 * role, but actually different words (e.g. `experienceLevel` reads from `prior_professional_
 * experience` on GET, but PUTs back out as `priorExperience` — a THIRD spelling). Confirmed
 * directly from web's own `parseApiResponse` (GET, lines 991-1015) and `buildApiPayload` (PUT,
 * lines 1018-1044) — both read below field-by-field, do not "simplify" this to one shared key set,
 * the backend genuinely expects the PUT-side names and genuinely returns the GET-side names.
 *
 * Full mapping table (UI field → GET raw source → PUT payload key):
 * - academicStage      ← academicStage ?? academic_stage           → academicStage
 * - primaryInterest    ← primaryInterest ?? eta_interest            → etaInterest
 * - lookingFor          ← preferred_internship_types (ONLY)          → internshipType
 * - workInterestedIn    ← work_type_interests (ONLY)                 → workInterest
 * - coreSkills          ← coreSkills ?? core_skills                  → coreSkills
 * - tools               ← tools (ONLY, no snake_case alt)            → tools
 * - experienceLevel     ← prior_professional_experience (ONLY)       → priorExperience
 * - aboutYou            ← key_responsibilities (ONLY)                → keyResponsibilities
 * - preferredMode       ← preferred_work_modes (ONLY)                → workMode
 * - duration            ← preferred_engagement_duration (ONLY)       → engagementDuration
 * - compensation        ← compensation_preferences[0] (GET is an     → compensationPreference
 *                          ARRAY; UI/PUT treat it as a single string)   (sent back as a plain string)
 * - timeCommitment      ← timeCommitment ?? time_commitment          → timeCommitment
 * - startDate           ← start_date_preference (ONLY)               → startDatePreference
 * - industryFocus       ← industry_interests (ONLY)                  → preferredIndustryDomain
 * - avoidedIndustries   ← avoidedIndustries ?? avoided_industries    → avoidedIndustries
 * - geographyFocus      ← geographyFocus ?? geography_focus          → geographyFocus
 * - resumeUrl           ← resume_url (ONLY)                          → resumeUrl
 * - coverLetterUrl      ← cover_letter_url (ONLY)                    → coverLetterUrl
 * - linkedinUrl         ← linkedinUrl ?? linkedin_url                → linkedinUrl
 */
export type StudentThesis = {
  profileId: string;
  academicStage: string;
  primaryInterest: string;
  lookingFor: string[];
  workInterestedIn: string[];
  coreSkills: string[];
  tools: string[];
  experienceLevel: string;
  aboutYou: string;
  preferredMode: string[];
  duration: string;
  compensation: string;
  timeCommitment: string[];
  startDate: string;
  industryFocus: string[];
  avoidedIndustries: string[];
  geographyFocus: string[];
  resumeUrl: string;
  coverLetterUrl: string;
  linkedinUrl: string;
};

function normalizeStudentThesis(raw: unknown): StudentThesis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (a: unknown, b?: unknown) => String(a ?? b ?? '');
  const arr = (...vals: unknown[]): string[] => (vals.find(v => Array.isArray(v)) as string[] | undefined) ?? [];
  const compPrefs = r.compensation_preferences;

  return {
    profileId: str(r.profile_id, r.profileId),
    academicStage: str(r.academicStage, r.academic_stage),
    primaryInterest: str(r.primaryInterest, r.eta_interest),
    lookingFor: arr(r.preferred_internship_types),
    workInterestedIn: arr(r.work_type_interests),
    coreSkills: arr(r.coreSkills, r.core_skills),
    tools: arr(r.tools),
    experienceLevel: str(r.prior_professional_experience),
    aboutYou: str(r.key_responsibilities),
    preferredMode: arr(r.preferred_work_modes),
    duration: str(r.preferred_engagement_duration),
    compensation: Array.isArray(compPrefs) ? str((compPrefs as unknown[])[0]) : '',
    timeCommitment: arr(r.timeCommitment, r.time_commitment),
    startDate: str(r.start_date_preference),
    industryFocus: arr(r.industry_interests),
    avoidedIndustries: arr(r.avoidedIndustries, r.avoided_industries),
    geographyFocus: arr(r.geographyFocus, r.geography_focus),
    resumeUrl: str(r.resume_url),
    coverLetterUrl: str(r.cover_letter_url),
    linkedinUrl: str(r.linkedinUrl, r.linkedin_url),
  };
}

/** `GET /auth/student` — matches web's `fetchStudentProfile`. */
export async function fetchStudentThesis(): Promise<StudentThesis> {
  const data = await apiClient.get(AUTH_ENDPOINTS.STUDENT).then(res => res.data).catch(() => null);
  const envelope = data as Record<string, unknown> | null;
  return normalizeStudentThesis(envelope?.data ?? envelope?.student ?? envelope);
}

/** `PUT /auth/student`, body `{ formData: payload }` — matches web's real `updateStudentProfile` +
 * `buildApiPayload` exactly: this is NOT a camelCase passthrough (unlike Operator/Business Owner) —
 * see `StudentThesis`'s own doc comment for the full GET/PUT field-name mapping table this mirrors. */
export async function updateStudentThesis(payload: Partial<StudentThesis>): Promise<void> {
  const p: Record<string, unknown> = {};
  if (payload.workInterestedIn !== undefined) p.workInterest = payload.workInterestedIn;
  if (payload.lookingFor !== undefined) p.internshipType = payload.lookingFor;
  if (payload.experienceLevel !== undefined) p.priorExperience = payload.experienceLevel;
  if (payload.aboutYou !== undefined) p.keyResponsibilities = payload.aboutYou;
  if (payload.preferredMode !== undefined) p.workMode = payload.preferredMode;
  if (payload.duration !== undefined) p.engagementDuration = payload.duration;
  if (payload.compensation !== undefined) p.compensationPreference = payload.compensation;
  if (payload.startDate !== undefined) p.startDatePreference = payload.startDate;
  if (payload.industryFocus !== undefined) p.preferredIndustryDomain = payload.industryFocus;
  if (payload.resumeUrl !== undefined) p.resumeUrl = payload.resumeUrl;
  if (payload.coverLetterUrl !== undefined) p.coverLetterUrl = payload.coverLetterUrl;
  if (payload.academicStage !== undefined) p.academicStage = payload.academicStage;
  if (payload.primaryInterest !== undefined) p.etaInterest = payload.primaryInterest;
  if (payload.coreSkills !== undefined) p.coreSkills = payload.coreSkills;
  if (payload.tools !== undefined) p.tools = payload.tools;
  if (payload.timeCommitment !== undefined) p.timeCommitment = payload.timeCommitment;
  if (payload.avoidedIndustries !== undefined) p.avoidedIndustries = payload.avoidedIndustries;
  if (payload.geographyFocus !== undefined) p.geographyFocus = payload.geographyFocus;
  if (payload.linkedinUrl !== undefined) p.linkedinUrl = payload.linkedinUrl;
  await apiClient.put(AUTH_ENDPOINTS.STUDENT, { formData: p });
}

/** Pure client-side completion calculator — matches web's real `calcLocalCompletion`
 * (`StudentThesisTab.tsx:1047-1064`) exactly. NOT a fetch — see this type's own doc comment. Note
 * "Skills & Capabilities" uses `&&` (AND), not `||` like every other section here — coreSkills must
 * be non-empty AND at least one of tools/experienceLevel/aboutYou must be set, replicated verbatim
 * even though it's an outlier among these 6 formulas. */
export function calcStudentThesisCompletion(t: StudentThesis): RoleThesisCompletion {
  const sections: { label: string; complete: boolean }[] = [
    { label: 'Learning & Career Intent', complete: !!(t.lookingFor.length || t.workInterestedIn.length || t.academicStage || t.primaryInterest) },
    { label: 'Skills & Capabilities', complete: !!(t.coreSkills.length && (t.tools.length || t.experienceLevel || t.aboutYou)) },
    { label: 'Engagement Preferences', complete: !!(t.preferredMode.length || t.duration || t.compensation) },
    { label: 'Availability & Logistics', complete: !!(t.timeCommitment.length || t.startDate) },
    { label: 'Interest & Fit', complete: !!(t.industryFocus.length || t.geographyFocus.length) },
    { label: 'Supporting Materials', complete: !!(t.resumeUrl || t.coverLetterUrl || t.linkedinUrl) },
  ];
  const filled = sections.filter(s => s.complete).length;
  return {
    percentage: Math.round((filled / sections.length) * 100),
    sections: sections.map(s => ({ ...s, percentage: s.complete ? 100 : 0 })),
  };
}
