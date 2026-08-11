import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MyEventItem } from '../types/events';
import type { Conversation } from '../types/messages';
import type { Profile } from '../types/directory';

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
  /** Optional chapter scope — set when arriving from ETA Chapters' "View member directory"
   * (matches web's `?group_id=&chapterName=`, scoping every search call to that chapter). */
  Directory: { groupId?: string; chapterName?: string } | undefined;
  AiAssist: undefined;
  /** `openConversation` is set (by Directory's "Message" action, or anywhere else that starts a
   * conversation and wants to land directly in its thread) to the exact stub shape
   * `MessagesScreen.tsx`'s own `handleSelectNewUser` already constructs — avoids depending on the
   * conversations list query having resolved by the time this tab is focused. Cleared via
   * `navigation.setParams` once consumed, since tab screens stay mounted and a stale param would
   * otherwise re-fire on the next focus. */
  Messages: { openConversation?: Pick<Conversation, 'id' | 'name' | 'profileImg' | 'participantId' | 'unreadCount'> } | undefined;
  Profile: undefined;
};

/**
 * Side menu — item list and row chrome match the app bar/drawer reference
 * (`TSB Home FV.html`) instead of Phase 0's original Phase-plan list: Home, Directory, AI
 * Assist and Messages route into the bottom tabs (see `menuConfig.ts`'s `kind: 'tab'` items)
 * rather than being drawer-only screens; ETA Chapters/My Matches/My Activities/My Events/My
 * Resources/Settings are. Sign Out isn't in that reference's drawer — it already lives on the
 * Profile screen, so it's dropped here rather than duplicated. "AI Toolkit" (a Phase 0
 * placeholder) was removed entirely — it has no concept anywhere in `webSrc`'s real dashboard
 * nav, confirmed by reading `DashboardNavbar.tsx` directly (My Profile / Ad Management / Create
 * Dual Profile / Settings only). My Activities/My Resources are real web sections
 * (`webSrc/src/app/dashboard/layout.tsx`'s `sections`, `/dashboard/my-activities` and
 * `/dashboard/my-resources`) that were simply missing here — added as placeholders for now,
 * matching My Matches/Settings until built out.
 */
export type DrawerParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  EtaChapters: undefined;
  MyMatches: undefined;
  MyActivities: undefined;
  MyEvents: undefined;
  MyResources: undefined;
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
  /** My Events' "Create a New Event" wizard — a dedicated pushed screen (was a `Modal` overlay
   * living inside `MyEventsScreen` itself; moved here so it gets its own native push transition
   * and back gesture like `Notifications`/`Profile` above, instead of stacking a second `Modal`
   * on top of My Events' own screen). Presence of `event` switches it into edit mode, pre-filling
   * the wizard from that event (`CreateEventScreen`'s `buildDraftFromEvent`) instead of creating
   * a new one. */
  CreateEvent: { event?: MyEventItem } | undefined;
  /** My Events' event detail view — same reasoning as `CreateEvent` above: was a `Modal` overlay
   * inside `MyEventsScreen`, moved here after `Modal`'s coordinate-space quirks caused a real bug
   * (`useSafeAreaInsets()` read inside a `Modal` isn't reliable on Android in every case — the
   * hero banner touching the top of the screen "in some cases" was that, not a spacing mistake). */
  EventDetail: { event: MyEventItem };
  /** Directory's "View Profile" — real navigation (matches web's own
   * `router.push('/dashboard/profiles/:username')`), not a `Modal` sheet. `initialSaved` is a
   * snapshot of the Directory list's save-state at the moment of navigation; this screen manages
   * its own local save toggle independently rather than sharing `DirectoryScreen`'s list state —
   * syncing the two back together (so the list reflects a toggle made here) is a separate,
   * later task, not part of this navigation fix. */
  MemberProfile: { profile: Profile; initialSaved: boolean };
};
