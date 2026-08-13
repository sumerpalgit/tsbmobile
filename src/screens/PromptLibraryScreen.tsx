import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { PromptLibrary } from '../components/ai-assist/PromptLibrary';
import type { AppStackParamList } from '../navigation/types';

/**
 * AI Assist's Prompt Library — a dedicated pushed screen (registered in `AppNavigator.tsx`)
 * wrapping `PromptLibrary`'s content. Was a full-screen `Modal`; moved here for the same
 * `useSafeAreaInsets()`-inside-`Modal` reliability reasons as `CreateAdCampaignScreen`/
 * `ContributeResourceScreen`. `goBack()` has no return-value primitive, so selecting a prompt
 * instead navigates back into the `AiAssist` tab with a `selectedPrompt` param — the same
 * "deliver data into an already-mounted tab screen" pattern `MessagesScreen`'s `openConversation`
 * param already uses.
 */
function PromptLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PromptLibrary'>>();

  return (
    <PromptLibrary
      initialCategory={route.params?.initialCategory ?? 'all'}
      onClose={() => navigation.goBack()}
      onSelectPrompt={text =>
        navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'AiAssist', params: { selectedPrompt: text } } })
      }
    />
  );
}

export default PromptLibraryScreen;
