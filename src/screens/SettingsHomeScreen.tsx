import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, CreditCard, HelpCircle, IdCard, Lock, Sparkles, UserRound } from 'lucide-react-native';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { SettingsListRow } from '../components/settings/SettingsListRow';
import type { AppStackParamList } from '../navigation/types';

/**
 * Settings index — hero banner + 3 grouped `SettingsListRow` cards (7 rows), matching both the
 * real web page's tab grouping and the mobile mockup's index exactly (same 3 groups, same order
 * — see the plan at `delightful-seeking-snowglobe.md`). Reached from both the Profile menu's
 * "Settings" row and the Drawer's own "Settings" row (`menuConfig.ts`'s `stackScreen` variant).
 * Pure navigation, no data of its own to fetch.
 */
function SettingsHomeScreen() {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View>
          <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>YOUR ACCOUNT</Text>
          <Text style={[fonts.regular, styles.eyebrowSub, { color: colors.ink3 }]}>
            Manage your account, preferences, billing and how TSB works for you.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <SettingsListRow
            Icon={UserRound}
            title="Account & Security"
            subtitle="Personal info, password, sessions"
            onPress={() => navigation.navigate('SettingsAccount')}
          />
          <SettingsListRow
            Icon={IdCard}
            title="Profile & Visibility"
            subtitle="How others see you across TSB"
            onPress={() => navigation.navigate('SettingsProfile')}
          />
          <SettingsListRow
            Icon={Sparkles}
            title="Matching Preferences"
            subtitle="Who you want to meet"
            onPress={() => navigation.navigate('SettingsMatching')}
            last
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <SettingsListRow
            Icon={Bell}
            title="Notifications"
            subtitle="What triggers an in-app alert"
            onPress={() => navigation.navigate('SettingsNotifications')}
          />
          <SettingsListRow
            Icon={Lock}
            title="Privacy & Messaging"
            subtitle="Your data, exported on request"
            onPress={() => navigation.navigate('SettingsPrivacy')}
            last
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <SettingsListRow
            Icon={CreditCard}
            title="Billing & Subscription"
            subtitle="Plan, features and payment history"
            onPress={() => navigation.navigate('SettingsBilling')}
          />
          <SettingsListRow
            Icon={HelpCircle}
            title="Support & Help"
            subtitle="Report an issue, FAQs, policies"
            onPress={() => navigation.navigate('SettingsSupport')}
            last
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 16,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  eyebrowSub: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  card: {
    overflow: 'hidden',
  },
});

export default SettingsHomeScreen;
