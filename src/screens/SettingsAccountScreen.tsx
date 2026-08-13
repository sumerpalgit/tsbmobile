import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Account & Security" section — bare shell for Phase 1 (routing/index only); real
 * content (Personal info, Password & sign-in, Active Sessions, Danger Zone) lands in Phase 2.
 * See the plan at `delightful-seeking-snowglobe.md`. */
function SettingsAccountScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Account & Security" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Account & Security" icon="account" phase="Settings Phase 2" />
    </View>
  );
}

export default SettingsAccountScreen;
