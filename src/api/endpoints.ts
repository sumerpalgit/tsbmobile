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
  /** `GET`/`PUT /api/auth/seller` — the real backend resource View Profile's Role Thesis tab
   * (Phase 8) saves Intermediary data to. Matches web's `fetchSellerProfile`/`updateSellerProfile`
   * (`webSrc/actions/my-profile.ts:482-492`) exactly, including web's own filename/import-swap
   * quirk: the component that actually renders for `role_type === 'intermediary'` is literally
   * named `SellerThesisTab.tsx` and persists through this Seller endpoint, not a dedicated
   * Intermediary one — replicated here on purpose (confirmed with the user) rather than "fixed",
   * so mobile-saved data lands in the same place web's own Intermediary users' data already does. */
  SELLER: '/auth/seller',
  /** `PUT /api/auth/searcher` — matches web's `updateSearcherProfile`
   * (`webSrc/actions/my-profile.ts:423-429`). Unlike `SELLER` above, Searcher's own READ side
   * doesn't use a dedicated GET at all — web reads Searcher data off the general `roleProfile`
   * (`GET /profile/me`), only saving through this endpoint. See `api/roleThesis.ts`'s
   * `normalizeSearcherThesis` doc comment. */
  SEARCHER: '/auth/searcher',
  /** `GET`/`PUT /api/auth/investor` — matches web's `fetchInvestorProfile`/`saveInvestorProfile`
   * (`webSrc/actions/my-profile.ts:387-389,407-413`). Same dedicated-GET shape as `SELLER` above
   * (unlike `SEARCHER`, which has no GET at all) — no filename/import-swap quirk here though,
   * `InvestmentThesisTab.tsx` is a straight, correctly-named import. */
  INVESTOR: '/auth/investor',
  /** `GET`/`PUT /api/auth/lender` — matches web's `fetchLenderProfile`/`updateLenderProfile`
   * (`webSrc/actions/my-profile.ts`). Same dedicated-GET shape as `SELLER`/`INVESTOR` above (unlike
   * `SEARCHER`), straight correctly-named import (`LenderThesisTab.tsx`), no filename swap. */
  LENDER: '/auth/lender',
  /** `GET`/`PUT /api/auth/advisor` — matches web's `fetchAdvisorProfile`/`updateAdvisorProfile`
   * (`webSrc/actions/my-profile.ts:466-480`). Same dedicated-GET shape as `SELLER`/`INVESTOR`/
   * `LENDER` above (unlike `SEARCHER`). */
  ADVISOR: '/auth/advisor',
  /** `GET`/`PUT /api/auth/operator` — matches web's `fetchOperatorProfile`/`updateOperatorProfile`
   * (`webSrc/actions/my-profile.ts:447-464`). Same dedicated-GET shape as `SELLER`/`INVESTOR`/
   * `LENDER`/`ADVISOR` above (unlike `SEARCHER`). */
  OPERATOR: '/auth/operator',
  /** `GET`/`PUT /api/auth/intermediary` — matches web's `fetchIntermediaryProfile`/
   * `updateIntermediaryProfile` (`webSrc/actions/my-profile.ts:516-528`). This is the OTHER HALF of
   * the same filename/import-swap bug documented on `SELLER` above: web's dispatch aliases
   * `SellerThesisTab` (the const name) to the FILE literally named `IntermediaryThesisTab.tsx`, so
   * `role_type === 'seller'` (Business Owner) actually renders THAT file's real fields and persists
   * through THIS endpoint — not a Seller-specific one. Confirmed by reading both files' own
   * `fetchXProfile`/`updateXProfile` calls directly (`IntermediaryThesisTab.tsx` calls
   * `fetchIntermediaryProfile`/`updateIntermediaryProfile`, i.e. this endpoint). Replicated here on
   * purpose (confirmed with the user, "we needs to do same as Web app") — mobile's role_type
   * `intermediary` tab already correctly uses `SELLER` above; this is role_type `seller`'s real
   * endpoint. */
  INTERMEDIARY: '/auth/intermediary',
  /** `GET`/`PUT /api/auth/student` — matches web's `fetchStudentProfile`/`updateStudentProfile`
   * (`webSrc/actions/my-profile.ts:502-514`). Straight correctly-named import
   * (`StudentThesisTab.tsx`), no filename swap. Unlike every other role, the GET and PUT sides use
   * GENUINELY DIFFERENT field names for several fields (not just a camelCase/snake_case casing
   * difference) — see `BusinessOwnerThesis`'s sibling type `StudentThesis`'s own doc comment
   * (`api/roleThesis.ts`) for the full mapping table. */
  STUDENT: '/auth/student',
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
  /** `GET /feed/user/:username` — matches `webSrc/actions/my-profile.ts`'s `fetchUserFeed`.
   * Username interpolated at the call site. Powers View Profile's Posts tab (Phase 3). */
  USER: '/feed/user',
  /** `DELETE /feed/delete/:feedId` — matches `webSrc/hooks/useFeedActions.ts`'s `deleteFeedItem`.
   * Feed id interpolated at the call site. */
  DELETE: '/feed/delete',
  /** `POST /feed/report/:feedId` — matches `webSrc/.../mini-cards/MiniCardMenu.tsx`'s
   * `submitReport`, body `{ reason }`. Feed id interpolated at the call site. */
  REPORT: '/feed/report',
  /** `POST /feed/interactions/count`, body `{ feedIds }` — matches `webSrc/actions/my-activity.ts`'s
   * `fetchMyActivityInteractionCounts`. My Activity's per-tab list endpoints don't return this
   * inline (unlike `LIST`/`SEARCH`'s `engagements`), so it's a separate batch call. */
  INTERACTION_COUNTS: '/feed/interactions/count',
  /** `POST /feed/poll/vote`, body `{ poll_id, option_index }` — matches
   * `webSrc/hooks/useFeedActions.ts`'s `submitPollVote`. */
  POLL_VOTE: '/feed/poll/vote',
  /** `DELETE /feed/poll/delete/:pollId` — matches `useFeedActions.ts`'s `deletePollVote`. Poll id
   * interpolated at the call site. */
  POLL_DELETE_VOTE: '/feed/poll/delete',
  /** `GET /feed/my-activity/tab-stats` — matches `webSrc/actions/my-activity.ts`'s
   * `fetchActivityTabStats`. Lives under the `/feed` namespace on the backend, not `/my-activity`
   * (confirmed directly — not a typo). Powers My Activity's `ActivityHeroStats`. */
  MY_ACTIVITY_TAB_STATS: '/feed/my-activity/tab-stats',
  /** `POST /feed/hide/:feedId` — matches `MiniCardMenu.tsx`'s "Hide this post" (fire-and-forget,
   * feed id interpolated at the call site). Powers `ActivityCardMenu`'s Hide action. */
  HIDE: '/feed/hide',
} as const;

/** `POST /likes/toggle`, body `{ feed_id }` — matches `webSrc/hooks/useFeedActions.ts`'s
 * `toggleLike`. Distinct resource from `SAVES_ENDPOINTS` below (likes vs. bookmarks). */
export const LIKES_ENDPOINTS = {
  TOGGLE: '/likes/toggle',
} as const;

/** Matches `useFeedActions.ts`'s `postComment`/(web's separate inline `PUT /api/comments/:id`
 * edit-comment call in `my-activities/page.tsx`). Comment id interpolated at the call site for the
 * edit (`PUT`) case. */
export const COMMENTS_ENDPOINTS = {
  BASE: '/comments',
} as const;

/** `POST /engagement`, body `{ feed_ids }` — matches `webSrc/actions/my-activity.ts`'s
 * `fetchMyActivityEngagements`. Batch companion to `INTERACTION_COUNTS` above, needed for the same
 * reason (My Activity's list endpoints don't inline `engagements`). */
export const ENGAGEMENT_ENDPOINTS = {
  BATCH: '/engagement',
} as const;

/** `POST /feed/job/apply`, body `{ job_id, resume_file_url, cover_letter, screening_answers }` —
 * matches `useFeedActions.ts`'s `submitJobApplication`. */
export const JOB_ENDPOINTS = {
  APPLY: '/feed/job/apply',
} as const;

/** `POST /feed/deal/request-nda`, body `{ deal_id, feed_id, requester_note, document_type }` —
 * matches `useFeedActions.ts`'s `requestDealNda`. Also reused (with an `investor_corner_id` body
 * key instead) by the Investor Corner "Invest in a Deal" scenario's combined action. */
export const DEAL_ENDPOINTS = {
  REQUEST_NDA: '/feed/deal/request-nda',
} as const;

/** `POST /feed/ppm/request-ppm` (body shape varies by caller — `search_capital_id` vs
 * `investor_corner_id` vs `ppm_id`+`message`+`ppm_file_url`, see `useFeedActions.ts`'s
 * `requestSearchCapitalPpm`/`handleInvestorCornerAction`/`submitPpmRequest`), `PUT /feed/ppm/sign`
 * body `{requestId, signedNdaUrl}`, `PUT /feed/ppm/withdraw`/`/decline` body `{requestId}` — all
 * matching `useFeedActions.ts` + `webSrc/actions/my-activity.ts`. */
export const PPM_ENDPOINTS = {
  REQUEST: '/feed/ppm/request-ppm',
  SIGN: '/feed/ppm/sign',
  WITHDRAW: '/feed/ppm/withdraw',
  DECLINE: '/feed/ppm/decline',
} as const;

/** `PUT /feed/nda/send` body `{requestId, ndaUrl}`, `/sign` body `{requestId, signedNdaUrl}`,
 * `/withdraw`/`/decline` body `{requestId}` — matches `webSrc/actions/my-activity.ts` exactly. */
export const NDA_ENDPOINTS = {
  SEND: '/feed/nda/send',
  SIGN: '/feed/nda/sign',
  WITHDRAW: '/feed/nda/withdraw',
  DECLINE: '/feed/nda/decline',
} as const;

/** `PUT /feed/cim/send` body `{requestId, cimUrl}` — matches `webSrc/actions/my-activity.ts`'s
 * `submitSendCim`. */
export const CIM_ENDPOINTS = {
  SEND: '/feed/cim/send',
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
  /** Per-tab list endpoints — `GET {tab}?page=&limit=`, matches `webSrc/actions/my-activity.ts`'s
   * `fetchMyActivityTabData`. `SAVED_POSTS` above is the 5th real tab web never renders (Decision 2
   * in the plan) — not used by `MyActivitiesScreen`. */
  MY_POSTS: '/my-activity/my-posts',
  LIKED_POSTS: '/my-activity/liked-posts',
  COMMENTED_POSTS: '/my-activity/commented-posts',
  INTERACTED_POSTS: '/my-activity/interacted-posts',
  /** `GET /my-activity/counts` → `{liked, commented, received, sent}` — matches
   * `fetchMyActivityCounts`. */
  COUNTS: '/my-activity/counts',
  /** `DELETE :id` (withdraw) / `PATCH :id/status` body `{status}` (employer updates status) —
   * matches `submitWithdrawJobApplication`/`submitUpdateJobApplicationStatus`. Id interpolated at
   * the call site, same convention as every other id-scoped endpoint in this file. */
  JOB_APPLICATION: '/my-activity/job-application',
} as const;

/** Notifications — matches `webSrc/actions/notifications.ts` exactly. Ids interpolated at the
 * call site, same convention as every other id-scoped endpoint in this file. `MATCH_COUNTS` feeds
 * the Notifications screen's "Matches" filter-chip count (web's own per-match-type breakdown,
 * used here only for the collapsed total). */
export const NOTIFICATION_ENDPOINTS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  MATCH_COUNTS: '/notifications/match-counts',
  READ: '/notifications/read',
  READ_ALL: '/notifications/read-all',
  BASE: '/notifications',
} as const;

/** `POST /eta/accept-invite/:notificationId` / `POST /eta/decline-invite/:notificationId` —
 * matches `webSrc/actions/notifications.ts`'s `acceptEtaInvite`/`declineEtaInvite`. Lives under
 * `/eta` rather than `/notifications` on the backend (confirmed directly, not a typo) since it's
 * really an ETA-chapter-membership action triggered from a notification row. */
export const ETA_INVITE_ENDPOINTS = {
  ACCEPT: '/eta/accept-invite',
  DECLINE: '/eta/decline-invite',
} as const;

export const UPLOAD_ENDPOINTS = {
  IMAGE_UPLOAD: '/upload/image-upload',
  DOCUMENT: '/upload/document',
} as const;

export const INTERESTS_ENDPOINTS = {
  LIST: '/interests',
  SAVE: '/interests/save',
  /** `GET /interests/my` — the signed-in user's own saved interests, used by View Profile's
   * Overview tab (Phase 2). Matches `webSrc/app/dashboard/my-profile/page.tsx`'s
   * `fetchMyInterests()`. */
  MY: '/interests/my',
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
  /** `DELETE /resource/delete/:resourceId` — matches web's `ResourcesSection.tsx`'s own-resource
   * delete (gated by its `showDeleteButton` prop, always `true` on `my-profile`). Powers View
   * Profile's Resources tab (Phase 5) "My Contributions" delete action. Id interpolated at the
   * call site, same convention as every other id-scoped endpoint in this file. */
  DELETE: '/resource/delete',
} as const;

/** View Profile's Overview tab (Phase 2) — matches `webSrc/app/dashboard/my-profile/page.tsx`'s
 * "details" tab exactly (`GET`/`PUT` current-organization at line 2539-2774,
 * `GET /profile/suggested-connections` at line 1133-1210). A distinct record from
 * `PROFILE_ENDPOINTS.UPDATE`'s onboarding-role fields (`designation`/`organization`) — this is
 * its own editable card with its own backend resource. */
export const PROFILE_OVERVIEW_ENDPOINTS = {
  CURRENT_ORGANIZATION: '/profile/current-organization',
  SUGGESTED_CONNECTIONS: '/profile/suggested-connections',
} as const;

/** `GET .../my` lists the signed-in user's own entries; `POST .../add` creates one; ids
 * interpolated at the call site for `PUT`/`DELETE ${BASE}/:id`, same convention as
 * `AI_ENDPOINTS`. Matches `webSrc/app/dashboard/my-profile/page.tsx:2231-2536`
 * (`/api/work-experience/*`). */
export const WORK_EXPERIENCE_ENDPOINTS = {
  MY: '/work-experience/my',
  ADD: '/work-experience/add',
  BASE: '/work-experience',
} as const;

/** Same CRUD shape as `WORK_EXPERIENCE_ENDPOINTS`. Matches
 * `webSrc/app/dashboard/my-profile/page.tsx:717-1123` (`/api/education/*`). */
export const EDUCATION_ENDPOINTS = {
  MY: '/education/my',
  ADD: '/education/add',
  BASE: '/education',
} as const;

/** `GET /testimonial/:username` — matches `webSrc/actions/my-profile.ts`'s `fetchTestimonials`,
 * called with the signed-in user's OWN username (`fetchTestimonials(profile.username)` at
 * `my-profile/page.tsx:4796`) — testimonials received about them, not written by them. Username
 * interpolated at the call site, same convention as `PROFILE_ENDPOINTS.BY_USERNAME`. Powers View
 * Profile's Overview "Latest Testimonial" preview (Phase 2) — real data, contradicting an earlier,
 * wrong memory note that this had no backend at all. */
export const TESTIMONIAL_ENDPOINTS = {
  BY_USERNAME: '/testimonial',
  /** `POST /testimonial/request` — matches `webSrc/actions/my-profile.ts`'s `requestTestimonial`,
   * body `{ user_ids, message }`. Powers View Profile's Testimonial tab (Phase 4) "Request
   * Testimonial" flow. */
  REQUEST: '/testimonial/request',
} as const;

/** `GET /follow/:username/followers?page=&limit=` (Phase 4) / `GET /follow/:username/followings
 * ?page=&limit=` (Phase 6) — matches `webSrc/actions/my-profile.ts`'s `fetchFollowers`/
 * `fetchFollowings` exactly, real siblings under the same base. No FOLLOW endpoint group existed
 * anywhere in this app before Phase 4 — confirmed via direct research (only a notification
 * *preference* boolean referenced "follow" previously, not a real relationship). Username +
 * `/followers` or `/followings` suffix interpolated at the call site. */
export const FOLLOW_ENDPOINTS = {
  BASE: '/follow',
} as const;

/** `GET /profile/analytics/summary` — matches `webSrc/actions/my-profile.ts`'s
 * `fetchAnalyticsSummary`. Confirmed real, wired backend (proper loading/error handling on web,
 * not a stub) despite web's own tab LABEL reading "Analytics" — its internal tab key/component
 * name is `complete-profile`/`CompleteProfileTab`: a profile-completion ring + section breakdown
 * with 4 extra "Match Score Facts" stat numbers bolted on, not an engagement/reach dashboard.
 * Powers View Profile's Analytics tab (Phase 7). A distinct endpoint from
 * `PROFILE_ENDPOINTS.COMPLETION` (`/profile/completion`, already used by Overview's own Profile
 * Insights ring, Phase 2) — web itself has two separate completion mechanisms, this isn't a
 * mobile-side duplication. */
export const ANALYTICS_ENDPOINTS = {
  SUMMARY: '/profile/analytics/summary',
} as const;

/** Role Thesis tab (Phase 8), Intermediary role. `SELLER_COMPLETION` matches web's
 * `fetchSellerThesisCompletion` (`GET /profile/seller-thesis/completion`) — a distinct completion
 * mechanism from `ANALYTICS_ENDPOINTS.SUMMARY`/`PROFILE_ENDPOINTS.COMPLETION` above (web itself has
 * three separate completion endpoints across the app, not a mobile-side duplication). `SIMILAR`
 * matches web's `fetchSimilarProfiles` (`GET /profile/:profileId/similar?role=`), profile id
 * interpolated at the call site same as `TESTIMONIAL_ENDPOINTS.BY_USERNAME`. */
export const ROLE_THESIS_ENDPOINTS = {
  SELLER_COMPLETION: '/profile/seller-thesis/completion',
  /** Matches web's `fetchSearchThesisCompletion` (`my-profile.ts:419-421`). */
  SEARCH_THESIS_COMPLETION: '/profile/search-thesis/completion',
  /** Matches web's `fetchInvestmentThesisCompletion` (`my-profile.ts:415-417`). */
  INVESTMENT_THESIS_COMPLETION: '/profile/investment-thesis/completion',
  /** Matches web's `fetchLendingThesisCompletion` (`GET /profile/lending-thesis/completion`). */
  LENDING_THESIS_COMPLETION: '/profile/lending-thesis/completion',
  /** Matches web's `fetchAdvisorThesisCompletion` (`GET /profile/advisor-thesis/completion`). */
  ADVISOR_THESIS_COMPLETION: '/profile/advisor-thesis/completion',
  /** Matches web's `fetchOperatorThesisCompletion` (`GET /profile/operator-thesis/completion`). */
  OPERATOR_THESIS_COMPLETION: '/profile/operator-thesis/completion',
  SIMILAR: '/profile',
} as const;

/** "Suggest a Feature" — web's `SuggestFeatureModal` (`webSrc/app/dashboard/layout.tsx:23`) posts
 * to `${NEXT_PUBLIC_API_URL}/api/feature-suggestions` with body `{suggestion}`. `apiClient`'s
 * `baseURL` already carries the `/api` prefix, so only the path below is needed here. */
export const FEEDBACK_ENDPOINTS = {
  FEATURE_SUGGESTIONS: '/feature-suggestions',
} as const;
