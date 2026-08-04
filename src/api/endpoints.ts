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
} as const;

export const FEED_ENDPOINTS = {
  LIST: '/feed',
  SEARCH: '/feed/search',
} as const;

export const LOCATION_ENDPOINTS = {
  CITIES: '/location/cities',
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
} as const;
