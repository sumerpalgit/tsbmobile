import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/directory';
import { IntermediaryThesisTab } from './roleThesis/intermediary/IntermediaryThesisTab';
import { SearcherThesisTab } from './roleThesis/searcher/SearcherThesisTab';
import { InvestorThesisTab } from './roleThesis/investor/InvestorThesisTab';
import { LenderThesisTab } from './roleThesis/lender/LenderThesisTab';
import { AdvisorThesisTab } from './roleThesis/advisor/AdvisorThesisTab';
import { OperatorThesisTab } from './roleThesis/operator/OperatorThesisTab';
import { BusinessOwnerThesisTab } from './roleThesis/seller/BusinessOwnerThesisTab';
import { StudentThesisTab } from './roleThesis/student/StudentThesisTab';
import type { RoleThesisTabHandle } from './roleThesis/RoleThesisTabHandle';

export type { RoleThesisTabHandle };

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
 * All 8 web roles now have real content — Intermediary, Searcher, Investor, Lender, Advisor,
 * Operator, Business Owner, and Student (the last one built) — completing View Profile's Phase 8.
 * The placeholder branch below is unreachable for any of this app's known `role_type` values but is
 * kept as a defensive fallback (an unrecognized/future role value falls through to it rather than
 * crashing) — its ref stays unforwarded (nothing to refresh there); `ViewProfileScreen.tsx`'s
 * pull-to-refresh handler just no-ops if its ref is null.
 *
 * `role_type === 'seller'` (Business Owner) renders `BusinessOwnerThesisTab` — confirmed web's own
 * filename/import-swap bug (`AUTH_ENDPOINTS.INTERMEDIARY`'s doc comment) means this role actually
 * has DIFFERENT real fields/endpoint than what the mobile-side name "Seller" might suggest; don't
 * confuse it with `AUTH_ENDPOINTS.SELLER`, which `role_type === 'intermediary'` above uses instead.
 */
export const ViewProfileRoleThesisTab = forwardRef<
  RoleThesisTabHandle,
  { profile: Profile; roleProfile: unknown; userId: string }
>(function ViewProfileRoleThesisTabImpl({ profile, roleProfile, userId }, ref) {
  const { colors, fonts } = useTheme();
  const role = (profile.role_type ?? '').trim().toLowerCase();

  if (role === 'intermediary') {
    return <IntermediaryThesisTab ref={ref} profile={profile} />;
  }
  if (role === 'searcher') {
    return <SearcherThesisTab ref={ref} profile={profile} roleProfile={roleProfile} userId={userId} />;
  }
  if (role === 'investor') {
    return <InvestorThesisTab ref={ref} profile={profile} />;
  }
  if (role === 'lender') {
    return <LenderThesisTab ref={ref} profile={profile} />;
  }
  if (role === 'advisor') {
    return <AdvisorThesisTab ref={ref} profile={profile} />;
  }
  if (role === 'operator') {
    return <OperatorThesisTab ref={ref} profile={profile} />;
  }
  if (role === 'seller') {
    return <BusinessOwnerThesisTab ref={ref} profile={profile} />;
  }
  if (role === 'student') {
    return <StudentThesisTab ref={ref} profile={profile} />;
  }

  return (
    <View style={styles.comingSoon}>
      <Text style={[fonts.semibold, { color: colors.ink3 }]}>More is coming here in a future update.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  comingSoon: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 30 },
});
