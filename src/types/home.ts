/**
 * Feed item shapes, one per `feed_type`, ported from `webSrc`'s `createItemPayload()`
 * (`PostComposer.tsx`) and `FeedCard.tsx`'s dispatch switch — those are the closest thing web
 * has to a canonical shape per type (its own `FeedItem['item']` is typed `any`). Two types
 * shape-shift further by an inner discriminant (`scenario_type` for Investor Corner,
 * `recipient_type` for Find a Connection) instead of `feed_type` alone.
 *
 * `RangeField` models the repeated `_min`/`_max` pattern (revenue, EBITDA, ticket size, ...)
 * that shows up across Deal/Investor Corner/Search Capital — `PostCard/primitives/RangeRow.tsx`
 * renders one of these.
 */
export type RangeField = {
  min?: number | null;
  max?: number | null;
};

export type AtcItem = {
  question_title: string;
  question_description: string;
  post_anonymous: boolean;
  atc_role_types: string[];
};

export type PollItem = {
  question: string;
  options: string[];
  duration_days: number;
  audience_roles: string[];
  post_anonymous: boolean;
  /** Present once the viewer has voted — index into `options`. Not in the raw create payload,
   * added on read by the feed API (see `webSrc/src/hooks/useFeedActions.ts`'s `submitPollVote`). */
  user_voted_index?: number | null;
  poll_results?: { votes: number }[];
};

export type EventItem = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string | null;
  visibility: string | null;
  format: string;
  location: string | null;
  event_link: string | null;
  event_description: string;
  cover_image: string | null;
  event_type: string | null;
  rsvp_required: string | null;
  hosted_by: string;
  eta_chapter_id: string | null;
  audience_roles: string[];
  user_rsvped: boolean;
};

export type JobItem = {
  role_title: string;
  company_name: string;
  location?: string | null;
  role_type: string;
  role_mode: string;
  hours_per_week?: RangeField;
  compensation_type?: string | null;
  fixed_compensation?: RangeField;
  hourly_rate?: RangeField;
  open_to_recruitment_agency: boolean;
  role_needed?: string | null;
  equity_participation?: string | null;
  preferred_start_date?: string | null;
  role_description: string;
  upload_job_description: string | null;
  is_internship: boolean;
  job_duration?: string | null;
  experience_level: string;
  industry_focus_area: string;
  currency?: string | null;
  screening_questions?: string[];
  external_job_link?: string | null;
  active_until?: string | null;
  audience_roles: string[];
};

export type DealItem = {
  listing_role: string;
  listing_role_other?: string | null;
  company_name: string;
  primary_objective: string;
  opportunity_reason: string;
  opportunity_reason_other?: string | null;
  post_title: string;
  opportunity_description: string;
  exclusivity_status: string;
  business_name: string;
  years_in_operation: string;
  industry_sectors: string[];
  business_location: string;
  revenue_min?: number | null;
  revenue_max?: number | null;
  revenue_range?: string;
  ebitda_min?: number | null;
  ebitda_max?: number | null;
  ebitda_range?: string;
  sba_eligibility_status: string;
  asking_price_min?: number | null;
  asking_price_max?: number | null;
  tentative_deal_value?: string;
  is_under_loi?: boolean;
  owner_financing_status: string;
  total_capital_status: string;
  debt_financing_status: string;
  debt_financing_min?: number | null;
  debt_financing_max?: number | null;
  equity_financing_status: string;
  /** "Total Raise" reads this single value, not a range — matches web's real
   * `DealCapitalMiniCard.tsx` exactly (`fmtMoney(item.equity_financing_min, ...)`), not a guess. */
  equity_financing_min?: number | null;
  equity_financing_amount?: number | null;
  investor_type_preference: string[];
  investor_type_preference_other?: string | null;
  searcher_type_preference: string[];
  deal_stage: string[];
  currency?: string | null;
  teaser_pdf: string | null;
  audience_roles: string[];
  external_link?: string | null;
};

export type SearchCapitalItem = {
  post_title: string;
  post_description: string;
  search_fund_name: string;
  year_established?: number | null;
  website?: string | null;
  type_of_searcher: string;
  current_status: string;
  preferred_investor_type?: string | null;
  sba_eligibility: string;
  sectors: string;
  target_location: string;
  target_revenue: RangeField;
  target_ebitda_min?: number | null;
  target_ebitda_max?: number | null;
  deal_value_known: string;
  deal_value: RangeField;
  equity_financing_required: string;
  equity_financing_amount?: number | null;
  debt_financing_required: string;
  debt_financing_amount?: number | null;
  share_ppm: boolean;
  ppm_url: string | null;
  currency?: string | null;
  audience_roles: string[];
};

/** "Back a Searcher" scenario. */
export type InvestorCornerBackSearcherItem = {
  scenario_type: 'Back a Searcher';
  investor_name: string;
  investor_type: string;
  investment_mandate_title: string;
  mandate_description: string;
  preferred_searcher_type: string;
  investment_stage_preference: string;
  solo_or_partnered: string;
  involvement_level: string;
  preferred_industries: string;
  preferred_geography: string;
  ticket_size_min?: number | null;
  ticket_size_max?: number | null;
  /** The "Deal Size" metric reads this, not a separate `deal_size` field — matches web's real
   * `BackSearcherMiniCard.tsx` exactly ("revenue_min/max — used as deal_size in BS mode"). */
  revenue_min?: number | null;
  revenue_max?: number | null;
  ebitda_min?: number | null;
  ebitda_max?: number | null;
  investment_instrument: string;
  currency?: string | null;
  ownership_preference: string;
  board_involvement: string;
  co_investor_friendly: string;
  time_to_deploy: string;
  investor_overview_url: string | null;
  external_link?: string | null;
  audience_roles: string[];
};

/** "Invest in a Deal" scenario. */
export type InvestorCornerInvestDealItem = {
  scenario_type: 'Invest in a Deal';
  investment_mandate_title: string;
  mandate_description: string;
  interested_in_deal_posted_by: string;
  preferred_deal_type: string;
  exclusivity_stance: string;
  process_stage: string;
  ticket_size_min?: number | null;
  ticket_size_max?: number | null;
  deal_size_min?: number | null;
  deal_size_max?: number | null;
  ebitda_min?: number | null;
  ebitda_max?: number | null;
  deal_industries: string;
  deal_geography: string;
  investment_instrument: string;
  currency?: string | null;
  ownership_preference: string;
  hold_period: string;
  participation_style: string;
  board_involvement: string;
  review_timeline: string;
  diligence_depth: string;
  time_to_deploy: string;
  deal_investor_overview_url: string | null;
  external_link?: string | null;
  audience_roles: string[];
};

export type InvestorCornerItem = InvestorCornerBackSearcherItem | InvestorCornerInvestDealItem;

/** `recipient_details`' keys vary by `recipient_type` (`ln_*` for lender, `im_*` for
 * intermediary, ...) — kept as a loose string map rather than a full per-role union since only
 * a handful of keys have been confirmed from live data so far. Narrow this once each
 * `find-a-connection-*` body variant is built and its real fields are known. */
export type FindAConnectionItem = {
  id: string;
  post_title: string;
  post_description: string;
  recipient_type: string;
  industry_focus: string | null;
  geography_focus: string | null;
  deal_size: RangeField;
  stage: string | null;
  recipient_details: Record<string, string>;
  urgency: string;
  visibility: string;
  audience_roles: string;
  status: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type FeedType =
  | 'atc'
  | 'poll'
  | 'event'
  | 'job'
  | 'deal'
  | 'search_capital'
  | 'investor_corner'
  | 'find_a_connection';

/** Discriminated union keyed by `feed_type` — pair with `FeedItem['feed_type']` to narrow
 * `FeedItem['item']` at each `PostCard/bodies/*` renderer. */
export type FeedItemData =
  | { feed_type: 'atc'; item: AtcItem }
  | { feed_type: 'poll'; item: PollItem }
  | { feed_type: 'event'; item: EventItem }
  | { feed_type: 'job'; item: JobItem }
  | { feed_type: 'deal'; item: DealItem }
  | { feed_type: 'search_capital'; item: SearchCapitalItem }
  | { feed_type: 'investor_corner'; item: InvestorCornerItem }
  | { feed_type: 'find_a_connection'; item: FindAConnectionItem };
