/**
 * Settings — shared types + `DEFAULT_*` merge-constants, one per section, matching web's own
 * client-side-merge-with-defaults pattern (`webSrc/src/app/dashboard/settings/page.tsx`) so a
 * partial/stale API response still renders every toggle. See the plan at
 * `delightful-seeking-snowglobe.md` for the full research this is grounded in.
 */

export type MatchTypeKey =
  | 'searchers'
  | 'investors'
  | 'lenders'
  | 'operators'
  | 'mentors'
  | 'brokers'
  | 'serviceProviders';

/** Nested `{ enabled: boolean }` per type (`page.tsx:638-651`) — NOT flat booleans. Confirmed via
 * web's own `Object.values(matchAudience).filter(v => v.enabled)` / `matchAudience[key].enabled`
 * call sites; a flat-boolean shape would silently write the wrong JSON to a real endpoint. */
export type MatchAudience = Record<MatchTypeKey, { enabled: boolean }>;

export const DEFAULT_MATCH_AUDIENCE: MatchAudience = {
  searchers: { enabled: true },
  investors: { enabled: true },
  lenders: { enabled: true },
  operators: { enabled: true },
  mentors: { enabled: true },
  brokers: { enabled: false },
  serviceProviders: { enabled: false },
};

export type MatchBehavior = {
  mutualMatchesOnly: boolean;
  hideConnectedMembers: boolean;
  resurfaceDismissed: boolean;
  dailyMatchLimit: number | null;
};

export const DEFAULT_MATCH_BEHAVIOR: MatchBehavior = {
  mutualMatchesOnly: true,
  hideConnectedMembers: true,
  resurfaceDismissed: false,
  dailyMatchLimit: 10,
};

export type VisibilitySettings = {
  showInDirectory: boolean;
  showInMatches: boolean;
  showProBadge: boolean;
  defaultAnonymousPosting: boolean;
  indexForSearchEngines: boolean;
};

export const DEFAULT_VISIBILITY: VisibilitySettings = {
  showInDirectory: true,
  showInMatches: true,
  showProBadge: true,
  defaultAnonymousPosting: false,
  indexForSearchEngines: false,
};

export type NotifKey = 'follow' | 'like' | 'comment' | 'system' | 'eta_invitation';
export type NotificationPrefs = Record<NotifKey, boolean>;

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  follow: true,
  like: true,
  comment: true,
  system: true,
  eta_invitation: true,
};

export type AccountInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  timezone: string;
};

export type ProfileInfo = {
  displayName: string;
  headline: string;
  bio: string;
  city: string;
  profileImg: string;
  coverImg: string;
};

export type Session = {
  id: string;
  device: string;
  location: string;
  lastSeen: string;
  isCurrent: boolean;
};

export type Subscription = {
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
};

export type PaymentRecord = {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  invoiceUrl?: string | null;
};

export type SupportTicketType = 'bug' | 'complaint';
export type SupportSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Verbatim from web (`page.tsx:70-74`) — a hardcoded tier→feature-list map, not API-driven.
 * Any `plan_name` outside these three keys falls back to `Free`'s list, matching web exactly. */
export const PLAN_FEATURES: Record<string, string[]> = {
  Free: ['Basic directory access', '5 AI assists / month', '1 ETA chapter'],
  Pro: ['Full directory access', 'Unlimited AI assists', 'All ETA chapters', 'Priority matching'],
  Enterprise: ['Everything in Pro', 'Custom branding', 'Team seats', 'Dedicated support'],
};
