import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { Bell, CreditCard, HelpCircle, IdCard, Lock, Sparkles, UserRound } from 'lucide-react-native';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { SettingsListRow } from '../components/settings/SettingsListRow';
import type { AppStackParamList } from '../navigation/types';

const HERO_GRADIENT_START = { x: 0.15, y: 0.15 };
const HERO_GRADIENT_END = { x: 0.85, y: 0.85 };

/**
 * Settings index — hero card + 3 labeled groups of `SettingsListRow` cards (7 rows total),
 * matching the reference screenshot exactly: a gradient hero card with an icon well (135deg
 * `colors.chip → colors.surface2` gradient + `colors.homeCardBorder` border, per the exact
 * `linear-gradient(135deg,var(--chip) 0%,var(--surf2) 120%)` / `1px solid var(--line2)` spec) and
 * a gold icon badge, and a small-caps group label sitting
 * *above* each card rather than inside it. Section grouping/order matches both the real web page
 * and the mobile mockup (see the plan at `delightful-seeking-snowglobe.md`). Reached from both
 * the Profile menu's "Settings" row and the Drawer's own "Settings" row (`menuConfig.ts`'s
 * `stackScreen` variant). Pure navigation, no data of its own to fetch.
 */
function SettingsHomeScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[colors.chip, colors.surface2]}
          start={HERO_GRADIENT_START}
          end={HERO_GRADIENT_END}
          style={[styles.hero, { borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}
        >
          <View style={[styles.heroIconWell, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
            <Sparkles size={18} color={colors.onGold} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fonts.bold, styles.heroEyebrow, { color: colors.ink }]}>YOUR ACCOUNT</Text>
            <Text style={[fonts.regular, styles.heroDescription, { fontSize: fontSize.caption, color: colors.ink2 }]}>
              Manage your account, preferences, billing and how TSB works for you.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.group}>
          <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>ACCOUNT</Text>
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
        </View>

        <View style={styles.group}>
          <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>COMMUNICATION</Text>
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
        </View>

        <View style={styles.group}>
          <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>PLAN & HELP</Text>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 18,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  heroIconWell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  heroDescription: {
    lineHeight: 16,
    marginTop: 3,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 10.5,
    letterSpacing: 0.7,
    marginLeft: 2,
  },
  card: {
    overflow: 'hidden',
  },
});

export default SettingsHomeScreen;
