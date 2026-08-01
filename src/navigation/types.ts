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
  /** Reached via the tsb://reset-password?token=... deep link. */
  ResetPassword: { token?: string };
  Onboarding: undefined;
};

/**
 * Bottom bar — Phase 0 item 3:
 * "Bottom bar: Home, Directory, Post, Matches, Messages"
 */
export type MainTabParamList = {
  Home: undefined;
  Directory: undefined;
  Post: undefined;
  Matches: undefined;
  Messages: undefined;
};

/**
 * Side menu — Phase 0 item 3:
 * "Side menu: ETA Chapters, AI Assist, My Activities, My Events,
 *  My Resources, Ad Management, Settings, Suggest a Feature, Sign Out"
 *
 * Sign Out is an action rather than a destination, so it has no entry here.
 */
export type DrawerParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  EtaChapters: undefined;
  AiAssist: undefined;
  MyActivities: undefined;
  MyEvents: undefined;
  MyResources: undefined;
  AdManagement: undefined;
  Settings: undefined;
  SuggestFeature: undefined;
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
