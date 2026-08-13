import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Notifications" section — bare shell for Phase 1; real content (5 in-app toggles)
 * lands in Phase 5. */
function SettingsNotificationsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Notifications" icon="bell" phase="Settings Phase 5" />
    </View>
  );
}

export default SettingsNotificationsScreen;
