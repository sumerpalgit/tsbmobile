import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  CheckEmail: { email: string };
  /** Reached via the tsb://verify-email?token=...&userId=... deep link. userId isn't in the
   * documented API contract for GET /auth/verify-email, but the real emailed link includes it
   * alongside token, so it's captured here and passed through if present. */
  VerifyEmail: { token?: string; userId?: string };
  /** Reached via the tsb://reset-password?token=... deep link — kept as a fallback, not the
   * primary path (see `ResetPasswordOtp`). */
  ResetPassword: { token?: string };
  /** Reached via the tsb://linkedin-callback?token=...&complete=... deep link once webSrc's
   * betterAuth LinkedIn flow finishes server-side (see `SocialSignIn`'s `handleLinkedInSignIn`
   * in authShared.tsx). `complete`/`error` arrive as strings, same as every other query-param
   * route here — parsed in `LinkedInCallbackScreen`. */
  LinkedInCallback: { token?: string; complete?: string; error?: string };
  /** Primary password-reset path — OTP code + new password on one screen, reached right after
   * `ForgotPasswordScreen` submits, same shape as `CheckEmail`/email verification. */
  ResetPasswordOtp: { email: string };
  Onboarding: undefined;
};

/**
 * Bottom bar — matches the app bar/drawer reference (`TSB Home FV.html`)'s `tabDefs` exactly:
 * Home, Directory, AI Assist, Messages, Profile. Supersedes Phase 0's original plan ("Home,
 * Directory, Post, Matches, Messages") — Post and Matches are no longer tabs; My Matches is a
 * drawer destination instead (see `DrawerParamList`), and Post has no destination yet. Profile
 * reuses the same `ProfileScreen` the top bar's avatar already pushes onto `AppStackParamList`
 * — intentionally reachable both ways, same as the reference's own AI Assist (both a tab and a
 * drawer item pointing at the same screen).
 */
export type MainTabParamList = {
  Home: undefined;
  Directory: undefined;
  AiAssist: undefined;
  Messages: undefined;
  Profile: undefined;
};

/**
 * Side menu — item list and row chrome match the app bar/drawer reference
 * (`TSB Home FV.html`) instead of Phase 0's original Phase-plan list: Home, Directory, AI
 * Assist and Messages route into the bottom tabs (see `menuConfig.ts`'s `kind: 'tab'` items)
 * rather than being drawer-only screens; ETA Chapters/My Matches/My Events/AI Toolkit/Settings
 * are. Sign Out isn't in that reference's drawer — it already lives on the Profile screen, so
 * it's dropped here rather than duplicated.
 */
export type DrawerParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  EtaChapters: undefined;
  MyMatches: undefined;
  MyEvents: undefined;
  AiToolkit: undefined;
  Settings: undefined;
};

/**
 * Screens reachable from the top bar. They push over the drawer rather than
 * living inside it, so the bottom bar is hidden while they are open.
 */
export type AppStackParamList = {
  Drawer: NavigatorScreenParams<DrawerParamList>;
  Notifications: undefined;
  Profile: undefined;
};
