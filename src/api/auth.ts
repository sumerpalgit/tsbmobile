import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { AUTH_ENDPOINTS } from './endpoints';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  /** Whether the account has completed onboarding step 2 (profile setup). */
  step2: boolean;
};

export async function login(payload: LoginRequest) {
  const data = await apiClient.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, payload).then(res => res.data);
  await AsyncStorage.setItem('accessToken', data.token);
  await AsyncStorage.setItem('refreshToken', data.refreshToken);
  // Persisted (not just held in React state) so a relaunch with a still-valid token can tell
  // whether to resume Onboarding instead of skipping straight into the app — see AuthContext's
  // bootstrap check.
  await AsyncStorage.setItem('onboardingComplete', String(data.step2));
  return data;
}

export type OAuthSignInResponse = {
  exists: boolean;
  /** Whether the account has a completed profile — same role as `login`'s `step2`. */
  complete: boolean;
  message?: string;
  redirectTo?: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    [key: string]: unknown;
  };
};

/** `POST /api/auth/oauth-signin` — used by Google/LinkedIn sign-in once the native SDK has
 * already confirmed the identity; the backend just needs the email to find-or-create the
 * account and issue a token. No `refreshToken` comes back on this path (unlike `login`). */
export async function oauthSignIn(email: string) {
  const data = await apiClient.post<OAuthSignInResponse>(AUTH_ENDPOINTS.OAUTH_SIGNIN, { email }).then(res => res.data);
  await AsyncStorage.setItem('accessToken', data.token);
  await AsyncStorage.setItem('onboardingComplete', String(data.complete));
  return data;
}

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
};

export type RegisterResponse = {
  message: string;
  data: {
    id: string;
    email: string;
    name: string;
    username: string;
  };
};

/** No token comes back — the account needs email verification before it can log in.
 * `platform` is added automatically (not part of the caller-facing `RegisterRequest`) so the
 * backend can tell which client an account registered through and pick the right verification
 * flow (OTP for mobile vs. the link-based flow web still uses). */
export function register(payload: RegisterRequest) {
  return apiClient
    .post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, { ...payload, platform: Platform.OS })
    .then(res => res.data);
}

export type VerifyEmailResponse = {
  message: string;
  data: {
    profile: {
      id: string;
      email: string;
      name: string;
      username: string;
    };
  };
};

/** Matches webSrc's `/auth/verify` page: called once with the token embedded in the
 * verification email's link (reached here via the tsb://verify-email deep link). The
 * documented contract only lists `token`, but the real emailed link also carries a
 * `userId` — forwarded when present in case the backend uses it. */
export function verifyEmail(token: string, userId?: string) {
  return apiClient
    .get<VerifyEmailResponse>(AUTH_ENDPOINTS.VERIFY_EMAIL, { params: { token, userId } })
    .then(res => res.data);
}

export type VerifyEmailOtpResponse = {
  message?: string;
  /** Not confirmed whether the backend logs the user in on successful OTP verification —
   * handled as optional so the screen still works (routes to Login) if it never comes back. */
  token?: string;
  refreshToken?: string;
};

/** `POST /api/auth/verify-otp` — the OTP-based email verification flow, replacing the
 * link-click flow's cross-device dead-link problem for accounts registered via this app
 * (see `register`'s `platform` field). */
export async function verifyEmailOtp(email: string, code: string) {
  const data = await apiClient
    .post<VerifyEmailOtpResponse>(AUTH_ENDPOINTS.VERIFY_OTP, { email, code })
    .then(res => res.data);
  if (data.token) {
    await AsyncStorage.setItem('accessToken', data.token);
    // A freshly-verified account has never been through Onboarding — see `login`'s
    // `onboardingComplete` write for why this is persisted, not just in React state.
    await AsyncStorage.setItem('onboardingComplete', 'false');
  }
  if (data.refreshToken) {
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
  }
  return data;
}

export type ResendVerificationResponse = {
  message: string;
};

export function resendVerification(email: string) {
  return apiClient
    .post<ResendVerificationResponse>(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email })
    .then(res => res.data);
}

export type ForgotPasswordResponse = {
  message: string;
};

/** `platform` is added automatically (not part of the caller-facing signature), same as
 * `register` — lets the backend pick OTP vs. the link-based reset flow for this request. */
export function forgotPassword(email: string) {
  return apiClient
    .post<ForgotPasswordResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email, platform: Platform.OS })
    .then(res => res.data);
}

export type ResetPasswordResponse = {
  message?: string;
};

/** Matches webSrc's `/auth/reset-password` page: called once with the token embedded in
 * the reset email's link (reached here via the tsb://reset-password deep link — kept as a
 * fallback, not the primary path; see `resetPasswordWithOtp`). */
export function resetPassword(token: string, newPassword: string) {
  return apiClient
    .post<ResetPasswordResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword })
    .then(res => res.data);
}

export type VerifyResetOtpResponse = {
  message?: string;
};

/** `POST /api/auth/verify-reset-otp` — standalone code check for Reset Password's `code` step,
 * separate from the final `resetPasswordWithOtp` submit (which re-validates the code anyway
 * when it's sent along with the new password). */
export function verifyResetOtp(email: string, code: string) {
  return apiClient
    .post<VerifyResetOtpResponse>(AUTH_ENDPOINTS.VERIFY_RESET_OTP, { email, code })
    .then(res => res.data);
}

export type ResetPasswordOtpResponse = {
  message?: string;
};

/** `POST /api/auth/reset-password-otp` — the primary password-reset path for accounts
 * registered via this app; the backend picks OTP vs. the link-based flow off `register`'s
 * `platform` field, same as email verification. */
export function resetPasswordWithOtp(email: string, code: string, newPassword: string) {
  return apiClient
    .post<ResetPasswordOtpResponse>(AUTH_ENDPOINTS.RESET_PASSWORD_OTP, { email, code, newPassword })
    .then(res => res.data);
}

export type ResendForgotPasswordOtpResponse = {
  message: string;
};

/** `POST /api/auth/resend-forgot-password-otp` — dedicated resend for Reset Password's OTP,
 * distinct from `resendVerification` (email verification's resend). */
export function resendForgotPasswordOtp(email: string) {
  return apiClient
    .post<ResendForgotPasswordOtpResponse>(AUTH_ENDPOINTS.RESEND_FORGOT_PASSWORD_OTP, { email })
    .then(res => res.data);
}

export type CompleteProfileRequest = {
  linkedinUrl: string;
  roleType: string;
  subCategory: string;
  userSelectedLocation: string;
  stateCode: string;
  countryCode: string;
};

export type CompleteProfileResponse = {
  message?: string;
};

/** Matches webSrc's `/auth/complete-profile` step (Onboarding Step 1 there and here). */
export function completeProfile(payload: CompleteProfileRequest) {
  return apiClient.post<CompleteProfileResponse>(AUTH_ENDPOINTS.COMPLETE_PROFILE, payload).then(res => res.data);
}

export type SubmitRoleProfileResponse = {
  message?: string;
};

/** Matches webSrc's `role-form/page.tsx` `handleComplete`: one `PUT /api/auth/{roleEndpoint}`
 * per role (`searcher`/`investor`/`lender`/`advisor`/`seller`/`operator`/`intermediary`/
 * `student` — see `ROLE_TYPE_MAP`), body wrapped under a `formData` key, submitting Onboarding
 * Step 3 + Step 4's combined fields in one call (mirrors web's single two-sub-step submit). */
export function submitRoleProfile(roleEndpoint: string, formData: Record<string, unknown>) {
  return apiClient
    .put<SubmitRoleProfileResponse>(`/auth/${roleEndpoint}`, { formData })
    .then(res => res.data);
}

export type CheckLinkedinResponse = {
  available: boolean;
  message?: string;
};

/** Matches webSrc's `/auth/complete-profile` live LinkedIn validation (`check-linkedin`,
 * debounced 600ms there — same debounce used in Onboarding's Step 1). */
export function checkLinkedin(linkedinUrl: string) {
  return apiClient
    .post<CheckLinkedinResponse>(AUTH_ENDPOINTS.CHECK_LINKEDIN, { linkedin_url: linkedinUrl })
    .then(res => res.data);
}
