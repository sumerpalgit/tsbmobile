import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Matching Preferences" section — bare shell for Phase 1; real content (audience
 * toggles with debounced auto-save, behavior toggles + daily limit, explicit save) lands in
 * Phase 4. */
function SettingsMatchingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Matching Preferences" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Matching Preferences" icon="star" phase="Settings Phase 4" />
    </View>
  );
}

export default SettingsMatchingScreen;
