export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  VERIFY_EMAIL: '/auth/verify-email',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_VERIFICATION: '/auth/resend-verification',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_RESET_OTP: '/auth/verify-reset-otp',
  RESET_PASSWORD_OTP: '/auth/reset-password-otp',
  RESEND_FORGOT_PASSWORD_OTP: '/auth/resend-forgot-password-otp',
  COMPLETE_PROFILE: '/auth/complete-profile',
  CHECK_LINKEDIN: '/auth/check-linkedin',
  OAUTH_SIGNIN: '/auth/oauth-signin',
} as const;

export const PROFILE_ENDPOINTS = {
  ME: '/profile/me',
  UPLOAD_DOCUMENT: '/profile/upload-document',
  COMPLETION: '/profile/completion',
  SEARCH: '/profile/search',
  /** Single-profile lookup — matches web's real `profiles/[username]/page.tsx:634`
   * (`GET /api/profile/username/:username`). Username interpolated at the call site. */
  BY_USERNAME: '/profile/username',
} as const;

export const FEED_ENDPOINTS = {
  LIST: '/feed',
  SEARCH: '/feed/search',
  SINGLE: '/feed/single',
} as const;

export const LOCATION_ENDPOINTS = {
  CITIES: '/location/cities',
  COUNTRIES: '/location/countries',
} as const;

export const EVENT_ENDPOINTS = {
  FILTER_LIST: '/event/filter-list',
  CREATE: '/feed/event',
  RSVP: '/feed/event/rsvp',
} as const;

export const SAVES_ENDPOINTS = {
  TOGGLE: '/saves/toggle',
} as const;

/** Directory's bookmark-a-member system — a distinct endpoint/data shape from `SAVES_ENDPOINTS`
 * above (that one toggles a feed post via `{feed_id}`; this one is a real REST resource keyed by
 * username: `POST`/`DELETE ${TOGGLE}/:username`). */
export const SAVED_CONTACTS_ENDPOINTS = {
  LIST: '/saved-contacts',
  TOGGLE: '/saved-contacts',
} as const;

export const MY_ACTIVITY_ENDPOINTS = {
  SAVED_POSTS: '/my-activity/saved-posts',
} as const;

export const UPLOAD_ENDPOINTS = {
  IMAGE_UPLOAD: '/upload/image-upload',
  DOCUMENT: '/upload/document',
} as const;

export const INTERESTS_ENDPOINTS = {
  LIST: '/interests',
  SAVE: '/interests/save',
} as const;

export const LOOKUP_ENDPOINTS = {
  INDUSTRIES: '/lookup/industries',
  GEOGRAPHIES: '/lookup/geographies',
} as const;

export const ETA_ENDPOINTS = {
  SUGGESTIONS: '/eta/eta-chapters/suggestions',
  ALL: '/eta/eta-chapters',
  SEARCH: '/eta/eta-chapters/search',
  BATCH_JOIN: '/eta/groups/batch-join',
  /** My ETA Chapters dashboard — a different endpoint set than the onboarding ones above
   * (`fetchMyEtaChapters`/join/leave/etc. in `api/eta.ts`). Group ids are interpolated at the
   * call site (`${ETA_ENDPOINTS.GROUPS}/${id}/join`), same convention as `AI_ENDPOINTS`. */
  MY_CHAPTERS: '/eta/my-eta-chapters',
  GROUPS: '/eta/groups',
  CHAPTER_EVENTS: '/eta/chapter-events',
  REQUEST_CITY: '/eta/request-city',
  GROUP_PREFS_BULK: '/eta/groups/prefs/bulk',
  INVITE_BY_EMAIL: '/eta/invite-by-email',
  INVITE_USER: '/eta/invite-eta-chapter',
} as const;

/** Ids are interpolated at the call site (`${AI_ENDPOINTS.CONVERSATIONS}/${id}`), same
 * convention as `EVENT_ENDPOINTS.CREATE` + `/${id}` in `api/events.ts`. */
export const AI_ENDPOINTS = {
  CONVERSATIONS: '/ai/conversations',
  MESSAGES: '/ai/messages',
  UPLOAD_DOCUMENT: '/ai/documents/upload',
  GENERATE_STREAM: '/ai/generate-stream',
} as const;

/** Ids interpolated at the call site (`${CHAT_ENDPOINTS.CONVERSATIONS}/${id}/messages`), same
 * convention as `AI_ENDPOINTS` above. */
export const CHAT_ENDPOINTS = {
  CONVERSATIONS: '/chat/conversations',
} as const;

/** ETA Chapters' ad banner (real-content read) + campaign creation (Phase 5) — a distinct,
 * adjacent domain from `ETA_ENDPOINTS`, matches web's separate `ads/eta/:id` (read, member-facing)
 * vs `ads/create-ad` (write, advertiser-facing) split. Chapter id interpolated at the call site. */
export const ADS_ENDPOINTS = {
  ETA: '/ads/eta',
  CREATE: '/ads/create-ad',
} as const;

/** My Resources — matches `webSrc/src/actions/my-resources.ts` exactly. Resource ids are
 * interpolated at the call site (`${DOWNLOAD}/${id}`, `${VIEW}/${id}`), same convention as
 * `AI_ENDPOINTS`/`CHAT_ENDPOINTS`. */
export const RESOURCE_ENDPOINTS = {
  LIST: '/resource/list',
  MY: '/resource/my',
  CREATE: '/resource/create',
  DOWNLOAD: '/resource/download',
  VIEW: '/resource/view',
} as const;
