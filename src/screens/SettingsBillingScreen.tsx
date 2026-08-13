import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Billing & Subscription" section — bare shell for Phase 1; real content (current
 * plan card, hardcoded feature map, payment history) lands in Phase 7. */
function SettingsBillingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Billing & Subscription" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Billing & Subscription" icon="barChart" phase="Settings Phase 7" />
    </View>
  );
}

export default SettingsBillingScreen;
