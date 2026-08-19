import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMe } from '../hooks/useMe';
import { ROLE_TYPE_MAP } from './onboarding/constants';
import { CreateDualProfileWizard } from '../components/profile/CreateDualProfileWizard/CreateDualProfileWizard';
import type { AppStackParamList } from '../navigation/types';

/** Thin wrapper — owns `useMe()` and the navigation lifecycle, matching `CreateEventScreen.tsx`'s
 * screen-owns-data/wizard-owns-steps split. See `types.ts`'s `CreateDualProfile` doc comment and
 * the plan at `delightful-seeking-snowglobe.md`. */
function CreateDualProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: me } = useMe();

  const profile = me?.profile as Record<string, unknown> | undefined;
  const backendRoleType = String(profile?.roleType ?? profile?.role_type ?? '').trim();
  // Reverse-lookup of `ROLE_TYPE_MAP` (mobile label → backend value) — the account's *existing*
  // role, shown as disabled + "Current" on Choose Role and in Get Started's profile strip.
  const currentRoleLabel = Object.keys(ROLE_TYPE_MAP).find(label => ROLE_TYPE_MAP[label] === backendRoleType);

  return (
    <CreateDualProfileWizard
      currentName={me?.name}
      currentImageUri={me?.profileImg}
      currentRoleLabel={currentRoleLabel}
      onClose={() => navigation.goBack()}
    />
  );
}

export default CreateDualProfileScreen;
