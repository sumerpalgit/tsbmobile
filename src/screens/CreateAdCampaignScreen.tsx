import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CreateCampaignWizard } from '../components/etaChapters/CreateCampaignWizard/CreateCampaignWizard';
import type { AppStackParamList } from '../navigation/types';

/**
 * Campaign creation wizard — a dedicated pushed screen (registered in `AppNavigator.tsx`)
 * wrapping `CreateCampaignWizard`'s step content. Reached from both Ad Management's "New
 * Campaign" button and ETA Chapters' "+ Create Ad" button (same shared component underneath, no
 * per-caller coupling) — both just navigate here instead of toggling local `Modal` visibility.
 * Was a `Modal` overlay; moved here after it hit the same `useSafeAreaInsets()`-inside-`Modal`
 * unreliability `CreateEventScreen`/`EventDetailScreen`/`MemberProfileScreen` were each moved off
 * `Modal` for.
 */
function CreateAdCampaignScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return <CreateCampaignWizard onClose={() => navigation.goBack()} />;
}

export default CreateAdCampaignScreen;
