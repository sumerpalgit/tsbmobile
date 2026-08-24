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
