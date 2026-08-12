import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { LogOut } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAuth } from '../store/AuthContext';
import { useMe } from '../hooks/useMe';
import { normalizeProfile } from '../api/directory';
import { TopBar } from '../components/TopBar';
import { IdentityCard } from '../components/profile/IdentityCard';
import { ProfileMenuList } from '../components/profile/ProfileMenuList';
import { AppStackParamList } from '../navigation/types';

/**
 * Profile — the identity card + menu list from `Profile.html`. Ad Management is real
 * (`AdManagementScreen`, see the plan at `delightful-seeking-snowglobe.md`); Create Dual Profile
 * and Settings are still separate future phases, so those 2 rows (+ View Profile, which has no
 * built destination on the mockup either) stay toast-only.
 *
 * Mounted in two different navigator contexts (`src/navigation/types.ts`): as the Profile bottom
 * tab (nested inside `DrawerNavigator`, which suppresses its own shared `TopBar` for this tab —
 * see `DrawerNavigator.tsx`) and as a direct `AppStackParamList` push (what the shared `TopBar`'s
 * avatar button does today). Only the first context has a drawer to open, so the leading header
 * button is context-aware — but `navigation.canGoBack()` is NOT the right signal for that: it
 * returned true (wrongly showing a back arrow) for the ordinary "focused Profile tab" case too,
 * because `MainNavigator`'s `backBehavior="history"` gives its own Tab.Navigator a visited-tab
 * history the moment you've switched tabs once (e.g. Home → Profile), which also makes
 * `canGoBack()` true — a completely different "back" than the one this header cares about.
 * `useNavigation()` returns the nav prop of whichever navigator immediately renders this screen,
 * so `getState().type` reliably tells the two contexts apart instead: `'tab'` when nested inside
 * `MainNavigator` (drawer is reachable — bubble a drawer-open action up), `'stack'` when pushed
 * directly on `AppNavigator` (no drawer in that context — go back instead).
 */
function ProfileScreen() {
  const { logout } = useAuth();
  const { colors, fonts, fontSize, spacing, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: user, isLoading } = useMe();

  const pushedContext = navigation.getState()?.type === 'stack';
  const profile = user?.profile ? normalizeProfile(user.profile) : null;

  const showToast = (text1: string) => Toast.show({ type: 'info', text1 });

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <TopBar
        backMode={pushedContext}
        onMenuPress={() => (pushedContext ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer()))}
        onBellPress={() => navigation.navigate('Notifications')}
        onAvatarPress={() => {}}
        showAvatar={false}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { padding: spacing.xl, paddingBottom: insets.bottom + spacing.xxxl, gap: spacing.lg }]}
      >
        <IdentityCard profile={profile} loading={isLoading} />

        <ProfileMenuList
          onItemPress={(key, title) =>
            key === 'ads' ? navigation.navigate('AdManagement') : showToast(`${title} — coming soon`)
          }
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
          <Pressable
            onPress={logout}
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOutRow, pressed && styles.pressed]}
          >
            <LogOut size={17} color={colors.danger} strokeWidth={1.8} />
            <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.danger }]}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  card: {
    overflow: 'hidden',
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default ProfileScreen;
