import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { CheckCircle2, Download } from 'lucide-react-native';
import { useTheme } from '../theme';
import { requestDataExport } from '../api/settings';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import type { AppStackParamList } from '../navigation/types';

// Mockup's exact order (`standalone/TSB ProfileLast.html`'s `dataIncluded` list) — same 5 items
// as web's own checklist, just a different order; mockup governs layout/copy per this project's
// convention.
const DATA_INCLUDED = [
  'Profile information & settings',
  'Messages & conversation history',
  "Support tickets you've raised",
  'Posts, connections & activity',
  'Billing & payment records',
];

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

/**
 * Settings' "Privacy & Messaging" section — despite the name, real web (`webSrc/app/dashboard/
 * settings/page.tsx`'s `activeTab === "privacy"`) and the mobile mockup both have zero
 * messaging-privacy controls (no block list, no who-can-DM-me); the whole tab is data export
 * only. Two cards: an "Export" button hitting the real `requestDataExport()` (already built in
 * Phase 1), and a static "What's included" checklist.
 *
 * Web's success path can additionally trigger a synthetic browser file download when the
 * response includes raw `data` — no mobile equivalent (no filesystem dependency for this), so
 * this just surfaces whatever `message` string the response contains, same as the original
 * plan's scope cut.
 */
function SettingsPrivacyScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { message } = await requestDataExport();
      Toast.show({ type: 'success', text1: 'Export requested', text2: message });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not request export', text2: extractErrorMessage(err) });
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Privacy & Messaging" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>YOUR DATA</Text>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Privacy & data</Text>
            <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>Download a copy of everything TSB holds about you.</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWell, { borderRadius: radius.lg, backgroundColor: colors.chip }]}>
              <Download size={16} color={colors.goldDark} strokeWidth={1.7} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>Download my data</Text>
              <Text style={[fonts.regular, styles.rowDescription, { color: colors.ink3 }]}>Get a full export of your personal data as JSON.</Text>
            </View>
          </View>

          <View style={styles.exportButtonWrap}>
            <Pressable
              onPress={handleExport}
              disabled={exporting}
              style={({ pressed }) => [styles.exportButton, { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: exporting ? 0.7 : 1 }, pressed && styles.pressed]}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Download size={13} color="#fff" strokeWidth={1.8} />
                  <Text style={[fonts.bold, styles.exportButtonText, { color: '#fff' }]}>Export</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface, padding: 16 }]}>
          <Text style={[fonts.bold, styles.includedLabel, { color: colors.ink3 }]}>WHAT'S INCLUDED</Text>
          {DATA_INCLUDED.map(item => (
            <View key={item} style={styles.includedRow}>
              <CheckCircle2 size={14} color={colors.success} strokeWidth={1.6} />
              <Text style={[fonts.regular, styles.includedText, { color: colors.ink2 }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 15,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 17,
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowDescription: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  exportButtonWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 42,
  },
  exportButtonText: {
    fontSize: 13,
  },
  includedLabel: {
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 6,
  },
  includedText: {
    fontSize: 12.5,
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SettingsPrivacyScreen;
