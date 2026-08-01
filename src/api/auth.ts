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

/** No token comes back — the account needs email verification before it can log in. */
export function register(payload: RegisterRequest) {
  return apiClient.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, payload).then(res => res.data);
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

export function forgotPassword(email: string) {
  return apiClient
    .post<ForgotPasswordResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email })
    .then(res => res.data);
}

export type ResetPasswordResponse = {
  message?: string;
};

/** Matches webSrc's `/auth/reset-password` page: called once with the token embedded in
 * the reset email's link (reached here via the tsb://reset-password deep link). */
export function resetPassword(token: string, newPassword: string) {
  return apiClient
    .post<ResetPasswordResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, { token, newPassword })
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

/** Matches webSrc's `/auth/complete-profile` step (Onboarding Step 1 there and here — web's
 * Steps 2-3, ETA join and role-specific business details, aren't wired yet: mobile's Onboarding
 * Steps 2-4 still use static placeholder data, not real per-role fields to submit). */
export function completeProfile(payload: CompleteProfileRequest) {
  return apiClient.post<CompleteProfileResponse>(AUTH_ENDPOINTS.COMPLETE_PROFILE, payload).then(res => res.data);
}
