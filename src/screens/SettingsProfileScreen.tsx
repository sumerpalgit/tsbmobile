import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Profile & Visibility" section — bare shell for Phase 1; real content (cover/avatar
 * upload, display name/headline/bio/city, visibility toggles) lands in Phase 3. */
function SettingsProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Profile & Visibility" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Profile & Visibility" icon="idCard" phase="Settings Phase 3" />
    </View>
  );
}

export default SettingsProfileScreen;
