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
  /** `selectedPrompt` is set by `PromptLibraryScreen` when a prompt card is tapped — since
   * `goBack()` has no return-value primitive, it instead navigates back into this tab with the
   * chosen text as a param, the exact same "deliver data into an already-mounted tab screen"
   * pattern `Messages`' `openConversation` below uses. Consumed via `useEffect` + cleared via
   * `navigation.setParams` once handled, for the same stale-param reason. */
  AiAssist: { selectedPrompt?: string } | undefined;
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
  // Settings moved to `AppStackParamList` — a plain pushed screen like `AdManagement`, not a
  // drawer-nested one, so both the Drawer's own row and the Profile menu's row converge on the
  // exact same real screen instead of two separate destinations. See `menuConfig.ts`'s
  // `stackScreen` `DrawerItem` variant.
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
  /** Profile menu's "View Profile" ("See how others view you") — Phase 1 of the plan at
   * `delightful-seeking-snowglobe.md`. Deliberately not the same route as `MemberProfile` above:
   * that one's params (`profile`/`initialSaved`) come from a Directory search result via route
   * params, while this one is always the signed-in user's own profile, fetched by the screen
   * itself from `useMe()` — no params needed. Renders the same `MemberProfileView` component in
   * its `isOwnProfile` mode. */
  ViewProfile: undefined;
  /** Ad Management — reached from Profile's menu list (`ProfileMenuList.tsx`), same "pushed,
   * covers the bottom bar, owns its own header" treatment as `CreateEvent`/`EventDetail` above,
   * not the mockup's own internal overlay/view-switching (`adOpen`/`adView` state) — matches this
   * app's established precedent of real navigation pushes over `Modal`-with-internal-state for
   * anything beyond a single lightweight sheet (see `CreateEvent`'s own doc comment for why). */
  AdManagement: undefined;
  AdCampaignDetail: { adId: string };
  AdInsights: { metric: 'impressions' | 'clicks' | 'spend' | 'cpm' };
  AdCampaignEdit: { adId: string };
  /** Campaign creation wizard — reached from both Ad Management's "New Campaign" and ETA
   * Chapters' "+ Create Ad" (same shared `CreateCampaignWizard` component, zero per-caller
   * coupling internally). Was a `Modal`; moved here for the same reason as `AdManagement` above
   * — hit a real `useSafeAreaInsets()`-inside-`Modal` bug on Android (status-bar-flush header,
   * previously patched with a `StatusBar.currentHeight` workaround), and this is the actual fix. */
  CreateAdCampaign: undefined;
  /** My Resources' "Contribute a resource" form — reached from `ResourcesHeader`'s "+" button.
   * Was a bottom-sheet `Modal`; moved to a real pushed screen for consistency with this app's
   * established precedent (`CreateEvent`/`CreateAdCampaign`/etc.) rather than a bug fix this
   * time — the sheet's own `Modal`-on-Android keyboard handling was already correct. */
  ContributeResource: undefined;
  /** AI Assist's Prompt Library — reached from the Composer's library icon, the empty-state
   * topic chips (`initialCategory` deep-links straight into that category), and the History
   * drawer. Was a full-screen `Modal`; moved here for the same `useSafeAreaInsets()`-inside-
   * `Modal` reliability reasons as `CreateAdCampaign`/`ContributeResource` above. See `AiAssist`
   * above for how a selected prompt gets back to the chat. */
  PromptLibrary: { initialCategory?: string } | undefined;
  /** Settings — reached from both the Profile menu's "Settings" row and the Drawer's own
   * "Settings" row (see `menuConfig.ts`'s `stackScreen` variant + `DrawerContent.tsx`'s
   * `getParent()` bubble-up), same "pushed, covers the bottom bar, owns its own header"
   * treatment as `AdManagement`. One index screen + 7 separate pushed section screens, matching
   * this app's Ad Management precedent over one screen with internal view-switching state — see
   * the plan at `delightful-seeking-snowglobe.md`. */
  SettingsHome: undefined;
  SettingsAccount: undefined;
  SettingsProfile: undefined;
  SettingsMatching: undefined;
  SettingsNotifications: undefined;
  SettingsPrivacy: undefined;
  SettingsBilling: undefined;
  SettingsSupport: undefined;
  /** Create Dual Profile — reached from Profile's menu list (`ProfileMenuList.tsx`'s `'dual'`
   * row), same "pushed, covers the bottom bar, owns its own header" treatment as
   * `AdManagement`/`SettingsHome` above, not a `Modal` — see those screens' doc comments for the
   * real `useSafeAreaInsets()`-inside-`Modal` Android bug this convention avoids. One screen
   * owning a local step-state-machine wizard (mirrors `CreateEvent`'s
   * screen-owns-lifecycle/wizard-owns-steps split), not one route per step — see the plan at
   * `delightful-seeking-snowglobe.md`. */
  CreateDualProfile: undefined;
};
