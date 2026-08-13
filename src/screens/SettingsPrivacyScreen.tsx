import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Privacy & Messaging" section — bare shell for Phase 1; real content (data-export
 * only, matching web's real scope despite the section name) lands in Phase 6. */
function SettingsPrivacyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Privacy & Messaging" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Privacy & Messaging" icon="lock" phase="Settings Phase 6" />
    </View>
  );
}

export default SettingsPrivacyScreen;
