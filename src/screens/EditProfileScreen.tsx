import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Repeat2 } from 'lucide-react-native';
import { useTheme } from '../theme';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import { SettingsListRow } from '../components/settings/SettingsListRow';
import { DualProfileManagementSheet } from '../components/profile/DualProfileManagementSheet';
import { checkDualProfile, deleteDualProfile } from '../api/dual-profile';
import { ME_QUERY_KEY } from '../api/queryKeys';
import type { AppStackParamList } from '../navigation/types';

/**
 * Edit Profile — the destination for `ViewProfileScreen`'s "Edit Profile" button, which was
 * `disabled` behind a TODO until now.
 *
 * Mirrors web's structure rather than its layout: web has no Edit Profile *page*: navigating to
 * any `/dashboard/my-profile/edit*` route swaps its whole left sidebar for a 4-item edit menu
 * (`webSrc/app/dashboard/layout.tsx:264-270`) — Profile Pictures, Account Details, Criteria &
 * Interests, Dual Profile Management. Mobile has no sidebar to swap, so that menu becomes a real
 * pushed screen.
 *
 * **Only Dual Profile Management is listed here, by explicit decision.** The other three web edit
 * pages are already covered elsewhere on mobile and are deliberately NOT duplicated onto this
 * screen: Profile Pictures + Account Details map to `SettingsProfileScreen` (cover/profile photo,
 * display name, headline, bio, location) and `SettingsAccountScreen`, and Criteria & Interests is
 * covered by View Profile's own per-role Role Thesis edit sheets. Adding rows for them here would
 * mean two entry points to the same forms. If that changes, add them as `SettingsListRow`s
 * pointing at those existing screens — no new forms needed.
 */
function EditProfileScreen() {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasDualProfile, setHasDualProfile] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [deleting, setDeleting] = useState(false);

  /** Web checks dual-profile status on the management page's own mount
   * (`dual-profile-management/page.tsx:21-38`). Checked on focus here instead of once on mount,
   * so returning from the Create Dual Profile wizard reflects the new state without a remount. */
  const loadStatus = useCallback(() => {
    let cancelled = false;
    setChecking(true);
    checkDualProfile()
      .then(data => {
        if (!cancelled) setHasDualProfile(!data.isDualIdNull);
      })
      .catch(() => {
        // Leave `hasDualProfile` null — the sheet renders its own "couldn't check" state rather
        // than guessing, so we never offer Delete to someone who has no dual profile (or Create
        // to someone who already does).
        if (!cancelled) setHasDualProfile(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(loadStatus);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const data = await deleteDualProfile();
      // `deleteDualProfile` already applies the rotated token internally (`applyRotatedToken`),
      // which is the manual `setToken()` + `validateToken()` web does at its own call site.
      // Invalidating `ME_QUERY_KEY` is the RN equivalent of web's `router.refresh()` — every
      // `useMe()` consumer (this screen's parent, TopBar avatar, DrawerContent header) refetches
      // under the new token. Same treatment as `ViewProfileScreen`'s `handleSwitchProfile`.
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      setHasDualProfile(false);
      setSheetOpen(false);
      Toast.show({
        type: 'success',
        text1: data?.message || 'Dual profile deleted successfully.',
      });
      // Web redirects back to My Profile 900ms after deleting. Going back one screen is the
      // mobile equivalent — this screen was pushed from View Profile, so `goBack()` lands there.
      navigation.goBack();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not delete dual profile',
        text2: 'Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.pageBg }}
    >
      <AdScreenHeader title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.group}>
          <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>
            PROFILE
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.xl,
                borderWidth: borderWidth.thin,
              },
            ]}
          >
            <SettingsListRow
              Icon={Repeat2}
              title="Dual Profile Management"
              onPress={() => setSheetOpen(true)}
              last
            />
          </View>
        </View>
      </ScrollView>

      <DualProfileManagementSheet
        visible={sheetOpen}
        checking={checking}
        hasDualProfile={hasDualProfile}
        deleting={deleting}
        onClose={() => setSheetOpen(false)}
        onDelete={handleDelete}
        onCreate={() => {
          setSheetOpen(false);
          navigation.navigate('CreateDualProfile');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 18 },
  group: { gap: 8 },
  groupLabel: { fontSize: 10.5, letterSpacing: 0.7, marginLeft: 2 },
  card: { overflow: 'hidden' },
});

export default EditProfileScreen;
