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
  COMPLETION: '/profile/completion',
  SEARCH: '/profile/search',
  /** Single-profile lookup — matches web's real `profiles/[username]/page.tsx:634`
   * (`GET /api/profile/username/:username`). Username interpolated at the call site. */
  BY_USERNAME: '/profile/username',
  /** `PUT` — shared by Settings' Account tab (`{name,phone,phone_country,timezone}`) and Profile
   * tab (`{name,bio,city,headline}`) saves, same URL, disjoint partial bodies, matching web
   * exactly (`page.tsx`'s `handleSavePersonalInfo`/`handleSaveProfileForm`). */
  UPDATE: '/profile/update-profile',
  UPDATE_PROFILE_IMAGE: '/profile/update-profile-image',
  UPDATE_COVER_IMAGE: '/profile/update-cover-image',
} as const;

/** Settings — matches `webSrc/src/app/dashboard/settings/page.tsx`'s real `/api/settings/*`
 * calls exactly (see the plan at `delightful-seeking-snowglobe.md`). Ids (`:id` on sessions)
 * interpolated at the call site, matching `CHAT_ENDPOINTS`/`ADS_ENDPOINTS` convention. */
export const SETTINGS_ENDPOINTS = {
  CHANGE_PASSWORD: '/settings/change-password',
  CHANGE_EMAIL: '/settings/change-email',
  VERIFY_EMAIL_CHANGE_OTP: '/settings/verify-email-change-otp',
  SESSIONS: '/settings/sessions',
  LOGOUT_ALL_DEVICES: '/settings/logout-all-devices',
  PAUSE_ACCOUNT: '/settings/pause-account',
  ACCOUNT: '/settings/account',
  VISIBILITY: '/settings/visibility',
  MATCHING: '/settings/matching',
  MATCHING_COUNTS: '/settings/matching-counts',
  NOTIFICATION_PREFERENCES: '/settings/notification-preferences',
  REQUEST_DATA_EXPORT: '/settings/request-data-export',
  SUBSCRIPTION: '/settings/subscription',
  PAYMENT_HISTORY: '/settings/payment-history',
  SUPPORT_TICKET: '/settings/support-ticket',
} as const;

/** "Create Dual Profile" — matches `webSrc/app/dashboard/create-dual-profile/page.tsx`'s real
 * `/api/dual-profile/*` calls (see the plan at `delightful-seeking-snowglobe.md`). `CREATE`/
 * `DELETE` both return a fresh JWT the caller must persist — see `src/api/dual-profile.ts`. */
export const DUAL_PROFILE_ENDPOINTS = {
  CREATE: '/dual-profile/create',
  DUAL_CHECK: '/dual-profile/dual-check',
  DELETE: '/dual-profile/delete',
  SWITCH: '/dual-profile/switch',
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
  /** `DELETE ${EVENT_RSVP}/:eventId` — the real, working cancel-RSVP route. `EVENT_ENDPOINTS.RSVP`
   * (`/feed/event/rsvp`) only ever had a POST handler on the backend; there was no DELETE
   * registered at that address, so cancelling an RSVP always 404'd there. Confirmed by backend
   * (Urvish Dhanani, 2026-08-13) and already fixed on web (`my-events/page.tsx`'s
   * `cancelEventRsvp`) to call this address instead — event ID goes in the URL path, no request
   * body needed. */
  EVENT_RSVP: '/my-activity/event-rsvp',
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
  /** The real chapter picker the ad-campaign flow uses — `GET /api/eta/chapters?q=` on web
   * (`fetchEtaChaptersForAds` in `actions/ad-management.ts`), a distinct, narrower endpoint from
   * `SEARCH` above (which is the onboarding chapter-suggestions search). `CreateCampaignWizard`'s
   * chapter picker was wrongly wired to `SEARCH` — different route, different query-param name
   * (`query` vs this one's `q`) — until this was added. */
  FOR_ADS: '/eta/chapters',
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

/** ETA Chapters' ad banner (real-content read) + campaign creation — a distinct, adjacent domain
 * from `ETA_ENDPOINTS`, matches web's separate `ads/eta/:id` (read, member-facing) vs
 * `ads/create-ad` (write, advertiser-facing) split. `MY` (`GET /ads/my-ads`) + campaign
 * id-interpolated `/ads/:id` (`GET`/`PUT`/`DELETE`, see `src/api/adManagement.ts`) back the Ad
 * Management dashboard/detail/edit — a third, advertiser-facing "manage your own campaigns"
 * domain, distinct from both `ETA` (read) and `CREATE` (write-once). Ids interpolated at the call
 * site, same convention as `CHAT_ENDPOINTS`. */
export const ADS_ENDPOINTS = {
  ETA: '/ads/eta',
  CREATE: '/ads/create-ad',
  MY: '/ads/my-ads',
  BASE: '/ads',
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
