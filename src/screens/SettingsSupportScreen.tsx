import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { PlaceholderScreen } from './PlaceholderScreen';
import type { AppStackParamList } from '../navigation/types';

/** Settings' "Support & Help" section — bare shell for Phase 1; real content (bug/complaint
 * forms, FAQs/Terms/Privacy links) lands in Phase 8. */
function SettingsSupportScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Support & Help" onBack={() => navigation.goBack()} />
      <PlaceholderScreen title="Support & Help" icon="suggest" phase="Settings Phase 8" />
    </View>
  );
}

export default SettingsSupportScreen;
