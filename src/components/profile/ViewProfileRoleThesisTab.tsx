import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/directory';
import { IntermediaryThesisTab } from './roleThesis/intermediary/IntermediaryThesisTab';

/**
 * Role Thesis tab dispatcher — Phase 8, built one role at a time (per explicit instruction:
 * build one, verify on-device, then move to the next). `role_type` is compared
 * case-insensitively (`.trim().toLowerCase()`), matching web's own defensive dispatch
 * (`my-profile/page.tsx:4406-4407`) rather than assuming a fixed case — this app's own
 * `role_type` values are Title-Case elsewhere (`types/directory.ts`'s `ROLE_TYPES`/
 * `SUB_CATEGORIES`), but web itself doesn't trust that and neither does this.
 *
 * Only Intermediary has real content so far; every other role still shows the same
 * "coming soon" placeholder `ViewProfileScreen.tsx` showed for ALL of Role Thesis before this
 * phase, so an Investor/Searcher/Lender/etc. profile's own experience is unaffected until its own
 * future phase lands.
 */
export function ViewProfileRoleThesisTab({ profile }: { profile: Profile }) {
  const { colors, fonts } = useTheme();
  const role = (profile.role_type ?? '').trim().toLowerCase();

  if (role === 'intermediary') {
    return <IntermediaryThesisTab profile={profile} />;
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
