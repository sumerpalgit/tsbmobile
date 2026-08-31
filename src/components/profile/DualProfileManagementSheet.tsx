import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';

/**
 * Dual Profile Management — the modal behind Edit Profile's one row (`EditProfileScreen.tsx`).
 *
 * Ports web's `DualProfileManagementPage`
 * (`webSrc/app/dashboard/my-profile/edit/dual-profile-management/page.tsx`), which is a whole
 * route on web but only ever renders a heading, a blurb, and **one** button whose identity
 * depends on dual-profile status: "Delete Dual Profile" when you have one, "Create Dual Profile"
 * (a link to the wizard) when you don't. A modal is the right mobile weight for that, and it's
 * what the user asked for.
 *
 * The blurb copy is verbatim from web ("Manage your dual profiles here. This section allows you
 * to manage your secondary profile within the search fund ecosystem."), as are both button
 * labels and the "Checking dual profile status..." loading line.
 *
 * Nothing visual is ported: web's page is raw Tailwind defaults (`bg-red-600`, `bg-blue-600`,
 * `text-2xl font-bold`) with no TSB design tokens anywhere, so it matches no other screen in
 * either app. This uses the app's own `BottomSheet` + `colors.danger`/`colors.gold` instead.
 *
 * Presentational only — status, loading and both actions are owned by `EditProfileScreen`, which
 * is where the API calls and the post-delete token/cache invalidation live.
 */
export function DualProfileManagementSheet({
  visible,
  checking,
  hasDualProfile,
  deleting,
  onClose,
  onDelete,
  onCreate,
}: {
  visible: boolean;
  /** Status check in flight — renders web's own "Checking dual profile status..." line. */
  checking: boolean;
  /** `null` means the check failed; neither action is offered rather than guessing wrong. */
  hasDualProfile: boolean | null;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
  onCreate: () => void;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!deleting}>
      <View style={styles.headerRow}>
        <Text
          style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]}
        >
          Dual Profile Management
        </Text>
        <Pressable
          onPress={onClose}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[
            styles.closeButton,
            { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg },
          ]}
        >
          <X size={16} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>

      <Text
        style={[
          fonts.regular,
          styles.blurb,
          { fontSize: fontSize.body, color: colors.ink2 },
        ]}
      >
        Manage your dual profiles here. This section allows you to manage your
        secondary profile within the search fund ecosystem.
      </Text>

      {checking ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text
            style={[
              fonts.regular,
              { fontSize: fontSize.body, color: colors.ink3 },
            ]}
          >
            Checking dual profile status...
          </Text>
        </View>
      ) : hasDualProfile === null ? (
        <Text
          style={[
            fonts.regular,
            styles.statusText,
            { fontSize: fontSize.body, color: colors.ink3 },
          ]}
        >
          Unable to check dual profile status. Please close this and try again.
        </Text>
      ) : hasDualProfile ? (
        <>
          <Text
            style={[
              fonts.regular,
              styles.statusText,
              { fontSize: fontSize.caption, color: colors.ink3 },
            ]}
          >
            This permanently removes your secondary profile. You can create a
            new one afterwards.
          </Text>
          <Pressable
            onPress={onDelete}
            disabled={deleting}
            accessibilityRole="button"
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.danger,
                borderRadius: radius.lg,
                opacity: deleting ? 0.7 : 1,
              },
            ]}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[fonts.bold, styles.actionButtonText]}>
                Delete Dual Profile
              </Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text
            style={[
              fonts.regular,
              styles.statusText,
              { fontSize: fontSize.caption, color: colors.ink3 },
            ]}
          >
            You don't have a dual profile yet.
          </Text>
          <Pressable
            onPress={onCreate}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.gold,
                borderRadius: radius.lg,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[fonts.bold, styles.actionButtonText]}>
              Create Dual Profile
            </Text>
          </Pressable>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  title: { fontSize: 17, letterSpacing: -0.2 },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  blurb: { marginTop: 12, lineHeight: 19 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 18,
  },
  statusText: { marginTop: 18, lineHeight: 17 },
  actionButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  actionButtonText: { fontSize: 13.5, color: '#fff' },
});
