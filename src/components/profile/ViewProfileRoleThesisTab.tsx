import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/directory';
import { IntermediaryThesisTab } from './roleThesis/intermediary/IntermediaryThesisTab';
import { SearcherThesisTab } from './roleThesis/searcher/SearcherThesisTab';

/**
 * Role Thesis tab dispatcher — Phase 8, built one role at a time (per explicit instruction:
 * build one, verify on-device, then move to the next). `role_type` is compared
 * case-insensitively (`.trim().toLowerCase()`), matching web's own defensive dispatch
 * (`my-profile/page.tsx:4406-4407`) rather than assuming a fixed case — this app's own
 * `role_type` values are Title-Case elsewhere (`types/directory.ts`'s `ROLE_TYPES`/
 * `SUB_CATEGORIES`), but web itself doesn't trust that and neither does this.
 *
 * `roleProfile`/`userId` are passed through unused by Intermediary (which fetches its own data via
 * a dedicated `GET /auth/seller`) but ARE needed by Searcher — web's `SearcherThesisTab` has no
 * dedicated GET at all, reading straight off `GET /profile/me`'s own `roleProfile` object (a
 * SEPARATE key from the general `profile` object in that same response — confirmed via
 * `webSrc/actions/my-profile.ts:46-48`'s `{ profile?: any; roleProfile?: any }` return type; role
 * fields like `searchType`/`searchFirmName` live only on `roleProfile`, not `profile`). Mobile's
 * `useMe()` now surfaces this as `User.roleProfile` (`src/api/profile.ts`) — no second network call
 * needed, just passed down. `userId` (`useMe()`'s `User.id`) is the reliable, role-agnostic source
 * for the "this profile's id" every role's "Similar Xs you may know" row needs — more robust than
 * depending on each role-specific endpoint happening to echo back its own `profile_id` field
 * (Intermediary's `/auth/seller` does; Searcher's flow doesn't call a fetch endpoint at all to
 * have one).
 *
 * Only Intermediary and Searcher have real content so far; every other role still shows the same
 * "coming soon" placeholder `ViewProfileScreen.tsx` showed for ALL of Role Thesis before this
 * phase, so an Investor/Lender/Advisor/etc. profile's own experience is unaffected until its own
 * future phase lands.
 */
export function ViewProfileRoleThesisTab({
  profile,
  roleProfile,
  userId,
}: {
  profile: Profile;
  roleProfile: unknown;
  userId: string;
}) {
  const { colors, fonts } = useTheme();
  const role = (profile.role_type ?? '').trim().toLowerCase();

  if (role === 'intermediary') {
    return <IntermediaryThesisTab profile={profile} />;
  }
  if (role === 'searcher') {
    return <SearcherThesisTab profile={profile} roleProfile={roleProfile} userId={userId} />;
  }

  return (
    <View style={styles.comingSoon}>
      <Text style={[fonts.semibold, { color: colors.ink3 }]}>More is coming here in a future update.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  comingSoon: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 30 },
});
