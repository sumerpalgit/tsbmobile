import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ContributeResourceSheet } from '../components/resources/ContributeResourceSheet';
import type { AppStackParamList } from '../navigation/types';

/**
 * My Resources' "Contribute a resource" form — a dedicated pushed screen (registered in
 * `AppNavigator.tsx`) wrapping `ContributeResourceSheet`'s content. Was a bottom-sheet `Modal`;
 * moved here for consistency with this app's established precedent of real navigation pushes
 * (`CreateEventScreen`/`CreateAdCampaignScreen`/etc.) rather than a bug fix — this component's
 * own Android keyboard handling was already correct as a Modal.
 */
function ContributeResourceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return <ContributeResourceSheet onClose={() => navigation.goBack()} />;
}

export default ContributeResourceScreen;
