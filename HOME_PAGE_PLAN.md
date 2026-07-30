# TSB Mobile — Home Page Working Plan

## Context
`HomeFV.html` is the design-bundle export for the Home page of the TSB app — a deal/networking platform for business searchers & investors (tagline "FIND. CONNECT. CLOSE."). Visible in the mockup:

- **Header**: hamburger menu (opens side drawer), TSB logo + tagline, theme toggle, notification bell with unread badge
- **Search bar**: "Search posts, members, deals…" input + filter button
- **Profile nudge card**: dismissible "Complete your profile" card with a progress bar ("Profile strength 42%")
- **Role cards**: the main body of the Home page is a set of 7 role cards (one per role), plus an 8th, more complex card/role that is itself built from 8 sub-components

Work is staged so navigation is in place first, then the Home page is built on top of it.

---

## Step 1 — Bottom Tabs
- Confirm/finish `MainNavigator.tsx` (`src/navigation/MainNavigator.tsx`) as the bottom-tab navigator — currently has `Home` and `Profile` tabs via `createBottomTabNavigator`.
- Add tab icons/labels matching the mockup once visible; no new tab names invented beyond what's in the design.
- Files: `src/navigation/MainNavigator.tsx`, `src/navigation/types.ts` (`MainTabParamList`).

## Step 2 — Side Drawer
- The hamburger icon in the mockup's header opens a side drawer, so `MainNavigator` (bottom tabs) needs to be nested inside a Drawer Navigator.
- Add dependency: `@react-navigation/drawer` (plus `react-native-reanimated`, required by the drawer — `react-native-gesture-handler` is already installed).
- New file: `src/navigation/DrawerNavigator.tsx` — wraps `MainNavigator` as the drawer's main screen, with drawer items for settings/menu links from the mockup.
- Update `RootNavigator.tsx` to render `DrawerNavigator` (authenticated) instead of `MainNavigator` directly.
- `HomeHeader`'s menu button calls `navigation.openDrawer()`.

## Step 3 — Home Page Design (7 role cards)
Build `HomeScreen` from these components in `src/components/home/`:
1. `HomeHeader.tsx` — menu button (opens drawer), logo/tagline, theme toggle, notification bell + badge
2. `HomeSearchBar.tsx` — search input + filter trigger button
3. `ProfileCompletionCard.tsx` — dismissible nudge card with progress bar
4. `RoleCardsGrid.tsx` — lays out the 7 role cards
5. `RoleCard.tsx` — single reusable card (icon, role name, description, CTA) rendered once per role
6. `SuggestedConnections.tsx` — horizontal carousel of suggested members/deals
7. `FeedEmptyState.tsx` — empty state when no cards/results

`RoleCard.tsx` is data-driven off a `roles: Role[]` array (7 entries) — role names/icons/copy to be filled in from the mockup/product spec once confirmed.

Shared type: `src/types/home.ts` — `Role` shape used by `RoleCardsGrid`/`RoleCard`.

Files:
- `src/screens/HomeScreen.tsx` — composes the 7 components above
- `src/components/home/HomeHeader.tsx`
- `src/components/home/HomeSearchBar.tsx`
- `src/components/home/ProfileCompletionCard.tsx`
- `src/components/home/RoleCardsGrid.tsx`
- `src/components/home/RoleCard.tsx`
- `src/components/home/SuggestedConnections.tsx`
- `src/components/home/FeedEmptyState.tsx`
- `src/components/home/index.ts` (barrel)
- `src/types/home.ts`

## Step 4 — 8th Card (8 sub-components) — next up
Role/card #8 is complex enough to be its own component group, in `src/components/home/PostCard/`:
1. `PostCard.tsx` — composes the 7 pieces below into the full card
2. `PostCardHeader.tsx` — avatar, name/role, timestamp
3. `PostCardBadge.tsx` — content-type badge
4. `PostCardBody.tsx` — main text content
5. `PostCardMedia.tsx` — optional image/attachment preview
6. `PostCardTags.tsx` — industry/skill tag chips
7. `PostCardStats.tsx` — views/matches/interest counters
8. `PostCardActions.tsx` — like/comment/share/save row + primary CTA button

**Total component count: 7 (Step 3) + 8 (Step 4) = 15 components for the Home page.**

## Also scaffolded
- `src/screens/EmptyScreen.tsx` — generic placeholder (icon + "Coming soon") reused for any future drawer/tab route before its real screen is built.
- Exported from `src/screens/index.ts` alongside existing screens.

## Verification
- `npx tsc --noEmit` — typecheck
- `npm run lint`
- `npm start` + run on Android/iOS simulator; open the drawer, switch bottom tabs, compare `HomeScreen` against `HomeFV.html`
- Basic Jest render smoke test for `HomeScreen` under `__tests__/`
