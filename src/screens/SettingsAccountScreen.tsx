import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Check, Laptop, Smartphone } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { ME_QUERY_KEY } from '../api/queryKeys';
import { updateProfile } from '../api/profile';
import { fetchSessions, logoutAllDevices, pauseAccount, revokeSession } from '../api/settings';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import { ToggleRow } from '../components/settings/ToggleRow';
import { ChangePasswordSheet } from '../components/settings/ChangePasswordSheet';
import { DeleteAccountModal } from '../components/settings/DeleteAccountModal';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import { FieldSelect } from '../components/events/CreateEventWizard/FieldSelect';
import type { Session } from '../types/settings';
import type { AppStackParamList } from '../navigation/types';

const PHONE_COUNTRY_OPTIONS = ['+1', '+44', '+61', '+91', '+49', '+33', '+81', '+86', '+55', '+971', '+65', '+64', '+353', '+27', '+52'].map(c => ({
  value: c,
  label: c,
}));

// Verbatim from web's real `<optgroup>` list (`webSrc/.../settings/page.tsx`) — flattened since
// `FieldSelect` has no group header support, same order preserved (Americas/Europe/Asia-Pacific/Africa).
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time — New York (ET)' },
  { value: 'America/Chicago', label: 'Central Time — Chicago (CT)' },
  { value: 'America/Denver', label: 'Mountain Time — Denver (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time — Los Angeles (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Toronto', label: 'Eastern Time — Toronto (ET)' },
  { value: 'America/Vancouver', label: 'Pacific Time — Vancouver (PT)' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'Europe/Paris', label: 'Paris / Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
];

type PersonalSnapshot = { firstName: string; lastName: string; phone: string; phoneCountry: string; timezone: string };

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

/**
 * Settings' "Account & Security" section — Personal information, Password & sign-in (+ Login
 * Alerts, a real UI toggle that saves nowhere on real web either — see `ChangePasswordSheet`'s
 * sibling doc comments and the plan at `delightful-seeking-snowglobe.md`), Active Sessions,
 * Danger Zone (Pause/Delete).
 */
function SettingsAccountScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: user } = useMe();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+1');
  const [timezone, setTimezone] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<PersonalSnapshot | null>(null);
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);

  // Hydrates from the already-loaded `useMe()` user — matches web's own split of `user.name` into
  // first/last (there's no separate first/last DB field), `user.profile.phone`/`phone_country`/
  // `timezone` for the rest (`page.tsx:853-862`).
  useEffect(() => {
    if (!user) return;
    const rawProfile = (user.profile ?? {}) as Record<string, unknown>;
    const nameParts = (user.name || '').trim().split(' ');
    const next: PersonalSnapshot = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' '),
      phone: String(rawProfile.phone ?? ''),
      phoneCountry: String(rawProfile.phone_country ?? '+1'),
      timezone: String(rawProfile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''),
    };
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setPhone(next.phone);
    setPhoneCountry(next.phoneCountry);
    setTimezone(next.timezone);
    setSavedSnapshot(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isPersonalInfoDirty =
    !!savedSnapshot &&
    (firstName !== savedSnapshot.firstName ||
      lastName !== savedSnapshot.lastName ||
      phone !== savedSnapshot.phone ||
      phoneCountry !== savedSnapshot.phoneCountry ||
      timezone !== savedSnapshot.timezone);

  const handleDiscard = () => {
    if (!savedSnapshot) return;
    setFirstName(savedSnapshot.firstName);
    setLastName(savedSnapshot.lastName);
    setPhone(savedSnapshot.phone);
    setPhoneCountry(savedSnapshot.phoneCountry);
    setTimezone(savedSnapshot.timezone);
  };

  const handleSavePersonalInfo = async () => {
    setSavingPersonalInfo(true);
    try {
      const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      await updateProfile({ name, phone, phone_country: phoneCountry, timezone });
      Toast.show({ type: 'success', text1: 'Account details saved' });
      setSavedSnapshot({ firstName, lastName, phone, phoneCountry, timezone });
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setSavingPersonalInfo(false);
    }
  };

  // Fake — real web never fetches or saves this (`page.tsx:608`, `setLoginAlerts` only appears at
  // its own onClick). Local-only state, no API call on toggle.
  const [loginAlerts, setLoginAlerts] = useState(true);

  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const loadSessions = () => {
    setSessionsLoading(true);
    fetchSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  };
  useEffect(loadSessions, []);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not sign out that device', text2: extractErrorMessage(err) });
    } finally {
      setRevokingId(null);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await logoutAllDevices();
      Toast.show({ type: 'success', text1: 'Signed out of all devices' });
      loadSessions();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not sign out all devices', text2: extractErrorMessage(err) });
    } finally {
      setSigningOutAll(false);
    }
  };

  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handlePause = async () => {
    setPausing(true);
    try {
      await pauseAccount();
      Toast.show({ type: 'success', text1: 'Account paused' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not pause account', text2: extractErrorMessage(err) });
    } finally {
      setPausing(false);
      setPauseConfirmOpen(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Account & Security" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SettingsSectionCard
          eyebrow="Identity"
          title="Personal information"
          description="Your name and email are used for sign-in and how you appear to other searchers."
        >
          <View style={styles.row}>
            <Field label="First name" style={{ flex: 1 }}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={[fonts.regular, styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
              />
            </Field>
            <Field label="Last name" style={{ flex: 1 }}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={[fonts.regular, styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
              />
            </Field>
          </View>

          <Field label="Email address">
            <View style={[styles.input, styles.readonlyInput, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
              <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink2, flex: 1 }]} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
            <View style={styles.verifiedRow}>
              <Check size={12} color={colors.success} strokeWidth={2.4} />
              <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.success }]}>Verified</Text>
            </View>
          </Field>

          <Field label="Phone number" hint="Optional — used for account recovery and security alerts.">
            <View style={styles.row}>
              <View style={{ width: 84 }}>
                <FieldSelect value={phoneCountry} placeholder="+1" options={PHONE_COUNTRY_OPTIONS} onChange={setPhoneCountry} />
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 000-0000"
                placeholderTextColor={colors.ink3}
                keyboardType="phone-pad"
                style={[fonts.regular, styles.input, { flex: 1, backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, color: colors.ink, fontSize: fontSize.body }]}
              />
            </View>
          </Field>

          <Field label="Time zone">
            <FieldSelect value={timezone} placeholder="Select time zone…" options={TIMEZONE_OPTIONS} onChange={setTimezone} />
          </Field>

          <View style={styles.saveBar}>
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]}>
              {isPersonalInfoDirty ? 'Unsaved changes' : 'All changes saved'}
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={handleDiscard} disabled={!isPersonalInfoDirty} style={({ pressed }) => [styles.smallButton, { opacity: isPersonalInfoDirty ? 1 : 0.4 }, pressed && styles.pressed]}>
              <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>Discard</Text>
            </Pressable>
            <Pressable
              onPress={handleSavePersonalInfo}
              disabled={!isPersonalInfoDirty || savingPersonalInfo}
              style={({ pressed }) => [styles.saveButton, { backgroundColor: '#182E43', borderRadius: radius.lg, opacity: isPersonalInfoDirty ? 1 : 0.4 }, pressed && styles.pressed]}
            >
              {savingPersonalInfo ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, { fontSize: fontSize.small + 1, color: '#fff' }]}>Save changes</Text>}
            </Pressable>
          </View>
        </SettingsSectionCard>

        <SettingsSectionCard eyebrow="Security" title="Password & sign-in" description="Strong authentication keeps your deal flow and conversations private.">
          <View style={[styles.row, { alignItems: 'flex-end' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink }]}>Password</Text>
              <View style={[styles.input, styles.readonlyInput, { marginTop: 7, backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
                <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink3 }]}>••••••••••••</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setPasswordSheetOpen(true)}
              style={({ pressed }) => [styles.changePasswordButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: borderWidth.thin }, pressed && styles.pressed]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>Change password</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 6 }}>
            <ToggleRow
              label="Email me on new sign-ins"
              description="Get an email whenever a new device signs into your account."
              value={loginAlerts}
              onValueChange={setLoginAlerts}
              last
            />
          </View>
        </SettingsSectionCard>

        <SettingsSectionCard
          eyebrow="Active sessions"
          title="Where you're signed in"
          description="Review devices currently signed in to your account."
          rightAction={
            <Pressable onPress={handleSignOutAll} disabled={signingOutAll} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
              {signingOutAll ? <ActivityIndicator size="small" color={colors.danger} /> : <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.danger }]}>Sign out all</Text>}
            </Pressable>
          }
        >
          {sessionsLoading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 8 }} />
          ) : sessions.length === 0 ? (
            <Text style={[fonts.regular, { fontSize: fontSize.small + 1, color: colors.ink3 }]}>No active sessions found.</Text>
          ) : (
            sessions.map((session, index) => {
              const isMobileDevice = /iphone|android|mobile|phone/i.test(session.device);
              const DeviceIcon = isMobileDevice ? Smartphone : Laptop;
              return (
                <View key={session.id} style={[styles.sessionRow, index < sessions.length - 1 && { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
                  <View style={[styles.sessionIconWell, { backgroundColor: colors.chip, borderRadius: radius.md }]}>
                    <DeviceIcon size={15} color={colors.goldDark} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink }]} numberOfLines={1}>
                      {session.device || 'Unknown device'}
                    </Text>
                    <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]} numberOfLines={1}>
                      {session.location || 'Unknown location'} · {session.lastSeen || '—'}
                    </Text>
                  </View>
                  {session.isCurrent ? (
                    <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.ink3 }]}>This device</Text>
                  ) : (
                    <Pressable onPress={() => handleRevoke(session.id)} disabled={revokingId === session.id} hitSlop={6}>
                      {revokingId === session.id ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Text style={[fonts.semibold, { fontSize: fontSize.caption, color: colors.danger }]}>Sign out</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </SettingsSectionCard>

        <SettingsSectionCard eyebrow="Danger zone" title="Pause or delete your account">
          <Pressable onPress={() => setPauseConfirmOpen(true)} style={({ pressed }) => [styles.dangerRow, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }, pressed && styles.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.semibold, { fontSize: fontSize.ui, color: colors.ink }]}>Pause account</Text>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]}>Temporarily hide your profile. You can come back anytime.</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => setDeleteModalOpen(true)} style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.semibold, { fontSize: fontSize.ui, color: colors.danger }]}>Delete account</Text>
              <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]}>Permanently removed after 30 days.</Text>
            </View>
          </Pressable>
        </SettingsSectionCard>
      </ScrollView>

      <ChangePasswordSheet visible={passwordSheetOpen} onClose={() => setPasswordSheetOpen(false)} />
      <DeleteAccountModal visible={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} />
      <ConfirmDialog
        visible={pauseConfirmOpen}
        title="Pause your account?"
        message="Your profile will be hidden until you sign back in."
        confirmLabel={pausing ? 'Pausing…' : 'Pause account'}
        cancelLabel="Keep active"
        destructive
        onConfirm={handlePause}
        onCancel={() => setPauseConfirmOpen(false)}
      />
    </View>
  );
}

function Field({ label, hint, style, children }: { label: string; hint?: string; style?: object; children: React.ReactNode }) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <View style={[{ marginTop: 14 }, style]}>
      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink }]}>{label}</Text>
      <View style={{ marginTop: 7 }}>{children}</View>
      {!!hint && <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 5, lineHeight: 15 }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 13,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12.5,
  },
  input: {
    height: 44,
    paddingHorizontal: 13,
  },
  readonlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  saveButton: {
    height: 38,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordButton: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
  },
  sessionIconWell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerRow: {
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default SettingsAccountScreen;
