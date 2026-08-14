import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Calendar, CircleAlert, Heart, Info, MessageCircle, UserPlus } from 'lucide-react-native';
import { useTheme } from '../theme';
import { fetchNotificationPrefs, saveNotificationPrefs } from '../api/settings';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { Switch } from '../components/Switch';
import { DEFAULT_NOTIF_PREFS, NotificationPrefs, NotifKey } from '../types/settings';
import type { AppStackParamList } from '../navigation/types';

const NOTIF_ITEMS: { key: NotifKey; label: string; description: string; Icon: typeof UserPlus }[] = [
  { key: 'follow', label: 'New followers', description: 'When someone follows your profile.', Icon: UserPlus },
  { key: 'like', label: 'Likes on your posts', description: "When someone likes something you've posted.", Icon: Heart },
  { key: 'comment', label: 'Comments on your posts', description: 'When someone replies to or comments on your content.', Icon: MessageCircle },
  { key: 'system', label: 'System & platform alerts', description: 'Important updates from The Search Bridge team.', Icon: CircleAlert },
  { key: 'eta_invitation', label: 'ETA chapter invitations', description: "When you're invited to join an ETA chapter.", Icon: Calendar },
];

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

/**
 * Settings' "Notifications" section — ported from the decoded mobile mockup
 * (`standalone/TSB Profile - Mobile.html`'s "NOTIFICATIONS" block): one card with 5 in-app
 * toggles and a Discard/Save footer, plus a standalone info banner below the card. Real GET/PUT
 * wiring against `fetchNotificationPrefs`/`saveNotificationPrefs` (already built in Phase 1).
 *
 * Discard is real functionality wins over mockup-only decoration (same convention as the rest of
 * Settings) — the mobile mockup itself only shows a single "Save changes" button, but desktop
 * web's real Notifications tab has a Discard alongside it, and every other Settings section that
 * has a deferred-save form (Account, Profile, Matching) already has one, so this one shouldn't
 * be the odd one out just because the mockup dropped it.
 */
function SettingsNotificationsScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);
  const [savedPrefs, setSavedPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotificationPrefs()
      .then(p => {
        setPrefs(p);
        setSavedPrefs(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isDirty = (Object.keys(prefs) as NotifKey[]).some(key => prefs[key] !== savedPrefs[key]);

  const handleDiscard = () => setPrefs(savedPrefs);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveNotificationPrefs(prefs);
      Toast.show({ type: 'success', text1: 'Preferences saved' });
      setPrefs(saved);
      setSavedPrefs(saved);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>IN-APP</Text>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Notification preferences</Text>
            <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>Choose which activity triggers an in-app notification for you.</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 16 }} />
          ) : (
            NOTIF_ITEMS.map(({ key, label, description, Icon }, index) => (
              <View
                key={key}
                style={[
                  styles.row,
                  index < NOTIF_ITEMS.length - 1 && { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin },
                ]}
              >
                <View style={[styles.iconWell, { borderRadius: radius.lg, backgroundColor: colors.chip }]}>
                  <Icon size={16} color={colors.goldDark} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>{label}</Text>
                  <Text style={[fonts.regular, styles.rowDescription, { color: colors.ink3 }]}>{description}</Text>
                </View>
                <Switch value={prefs[key]} onValueChange={v => setPrefs(prev => ({ ...prev, [key]: v }))} onColor="#182e43" />
              </View>
            ))
          )}

          <View style={[styles.footer, { backgroundColor: colors.surfaceSunken }]}>
            <Text style={[fonts.regular, styles.footerText, { color: colors.ink3 }]}>{isDirty ? 'Unsaved changes' : 'All changes saved'}</Text>
            <View style={styles.footerButtonRow}>
              <Pressable
                onPress={handleDiscard}
                disabled={!isDirty}
                style={({ pressed }) => [
                  styles.discardButton,
                  { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: borderWidth.thin, opacity: isDirty ? 1 : 0.4 },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[fonts.semibold, styles.saveButtonText, { color: colors.ink2 }]}>Discard</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!isDirty || saving}
                style={({ pressed }) => [styles.saveButton, { backgroundColor: '#182E43', borderRadius: radius.xl, opacity: isDirty ? 1 : 0.4 }, pressed && styles.pressed]}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, styles.saveButtonText, { color: '#fff' }]}>Save changes</Text>}
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderSoft, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
          <Info size={14} color={colors.ink3} strokeWidth={1.6} style={{ marginTop: 1 }} />
          <Text style={[fonts.regular, styles.infoText, { color: colors.ink3 }]}>
            These preferences control in-app notifications only. Transactional emails (password reset, email verification, chapter invites) are always sent regardless of these settings.
          </Text>
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
    paddingVertical: 12,
  },
  iconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowDescription: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 11,
    flexShrink: 1,
  },
  footerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discardButton: {
    height: 36,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    height: 36,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 12.5,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16.5,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default SettingsNotificationsScreen;
