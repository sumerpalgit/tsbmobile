import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { MemberProfileView } from '../components/directory/MemberProfileView';
import { useMessageMutations } from '../hooks/useMessageMutations';
import { saveContact, removeSavedContact } from '../api/directory';
import type { AppStackParamList } from '../navigation/types';

/** Directory's Member Profile — a dedicated pushed screen (registered in `AppNavigator.tsx`),
 * same reasoning as `EventDetailScreen.tsx`: was a `Modal` sheet (`MemberDetailSheet.tsx`), moved
 * here so "View Profile" gets a real native push transition and back gesture, matching real web's
 * own `router.push`. Save state is local to this screen for now (optimistic, revert on failure,
 * same pattern as `useDirectoryMutations.ts`) — keeping it in sync with the Directory list's own
 * save-state when you navigate back is a separate follow-up, not part of this fix. */
function MemberProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'MemberProfile'>>();
  const { profile, initialSaved } = route.params;
  const { startConversation } = useMessageMutations();

  const [saved, setSaved] = useState(initialSaved);
  const [startingChat, setStartingChat] = useState(false);

  const handleToggleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      if (wasSaved) await removeSavedContact(profile.username);
      else await saveContact(profile.username);
    } catch {
      setSaved(wasSaved);
      Toast.show({ type: 'error', text1: 'Could not update saved members', text2: 'Please try again.' });
    }
  };

  const handleMessage = async () => {
    if (startingChat) return;
    setStartingChat(true);
    try {
      const conversationId = await startConversation({ username: profile.username, name: profile.name, profileImg: profile.profile_img });
      navigation.navigate('Drawer', {
        screen: 'Tabs',
        params: { screen: 'Messages', params: { openConversation: { id: conversationId, name: profile.name, profileImg: profile.profile_img ?? null, participantId: conversationId, unreadCount: 0 } } },
      });
    } catch {
      // startConversation's own mutation already surfaces a toast on failure.
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <MemberProfileView
      profile={profile}
      saved={saved}
      onBack={() => navigation.goBack()}
      onToggleSave={handleToggleSave}
      onMessage={handleMessage}
    />
  );
}

export default MemberProfileScreen;
