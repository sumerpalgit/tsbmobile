import type { PickedFile } from '../../FileUploadButton';
import type { MyEventItem } from '../../../types/events';

/** Wizard draft state — field names follow the mockup's own `c.*` state
 * (`myevents_decoded.html` ~line 1003) so the step components map 1:1 onto it; `toPayload`
 * (in `CreateEventWizard.tsx`) translates this into web's `EventFormPayload` shape on submit. */
export type WizardDraft = {
  title: string;
  desc: string;
  fmt: 'Online' | 'In Person' | 'Hybrid';
  etype: string;
  vis: string;
  sdate: string;
  edate: string;
  stime: string;
  etime: string;
  tz: string;
  link: string;
  venue: string;
  host: string;
  roles: string[];
  rsvp: boolean;
  coverFile: PickedFile | null;
  coverUrl: string;
};

export const EMPTY_WIZARD_DRAFT: WizardDraft = {
  title: '',
  desc: '',
  fmt: 'Online',
  etype: 'Webinar',
  vis: 'Public — anyone on TSB',
  sdate: '',
  edate: '',
  stime: '',
  etime: '',
  tz: '',
  link: '',
  venue: '',
  host: '',
  roles: [],
  rsvp: false,
  coverFile: null,
  coverUrl: '',
};

export const EVENT_TYPE_OPTIONS = ['Webinar', 'Workshop', 'Networking', 'Conference', 'Chapter Event', 'Technical'];

export const VISIBILITY_OPTIONS = [
  'Public — anyone on TSB',
  'Chapter members only',
  'Pro members only',
  'Invite only',
];

export const TIMEZONE_OPTIONS = [
  { value: 'EDT', label: 'EDT — Eastern' },
  { value: 'CDT', label: 'CDT — Central' },
  { value: 'MDT', label: 'MDT — Mountain' },
  { value: 'PDT', label: 'PDT — Pacific' },
  { value: 'GMT', label: 'GMT — London' },
  { value: 'IST', label: 'IST — India' },
  { value: 'SGT', label: 'SGT — Singapore' },
];

/** Quick-select role presets — mirrors the mockup's `onQsAll`/`onQsSi`/`onQsOps` buttons. */
export const ROLE_OPTIONS = [
  'Searchers',
  'Investors',
  'Operators',
  'M&A Advisors',
  'Diligence Pros',
  'SBA Lenders',
  'Brokers',
  'Mentors',
];

export const STEP_NAMES = ['Basics', 'When & where', 'Audience', 'Cover', 'Review'];

export function step1Valid(draft: WizardDraft): boolean {
  return draft.title.trim().length > 2 && draft.desc.trim().length > 2;
}

export function step2Valid(draft: WizardDraft): boolean {
  return !!draft.sdate && !!draft.stime;
}

/** Web's `handleEditClick` (`my-events/page.tsx`) pre-fills its flat form from a `MyEventItem`;
 * this is the same mapping into `WizardDraft` instead. `event_type` values
 * ("Online"/"In-person"/"Hybrid") map back to the wizard's "Online"/"In Person"/"Hybrid" buttons —
 * the inverse of `toPayload` in `CreateEventWizard.tsx`. Lives here (not `CreateEventScreen.tsx`)
 * since it's pure draft-shape logic, same as `EMPTY_WIZARD_DRAFT` above. */
export function buildDraftFromEvent(event: MyEventItem): WizardDraft {
  return {
    title: event.title ?? '',
    desc: event.event_description ?? '',
    fmt: event.event_type === 'In-person' ? 'In Person' : event.event_type === 'Hybrid' ? 'Hybrid' : 'Online',
    etype: event.format ?? 'Webinar',
    vis: event.visibility ?? 'Public — anyone on TSB',
    sdate: event.start_date ? event.start_date.split('T')[0] : '',
    edate: event.end_date ? event.end_date.split('T')[0] : '',
    stime: event.start_time ?? '',
    etime: event.end_time ?? '',
    tz: event.timezone ?? '',
    link: event.event_link ?? '',
    venue: event.location ?? '',
    host: event.hosted_by ?? '',
    roles: event.audience_roles ?? [],
    rsvp: (event.rsvp_required ?? '').toLowerCase() === 'yes',
    coverFile: null,
    coverUrl: event.cover_image ?? '',
  };
}
