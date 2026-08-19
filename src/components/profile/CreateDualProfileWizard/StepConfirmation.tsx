import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';

/**
 * Confirmation — matches the real mockup's compact `dpIsDone` block exactly (decoded source):
 * a success checkmark, "Dual profile activated" + a subtitle naming the new role, and one
 * profile-card row (avatar, name, "{currentRole} · {newRole}" line, a "Dual" badge) — not real
 * web's separate full desktop confirmation page (two side-by-side profile cards + switch icon +
 * an info-tip box + "Stay on current profile"/"View my profiles" CTAs). That desktop layout was
 * clearly built for a much wider screen than this app's phone frame targets; the standalone
 * mockup (`#tsbPhone`-rooted, the same phone-frame source every other step in this wizard was
 * built against) is the one actually meant for mobile, so it governs this screen's layout too —
 * same "the phone mockup wins for mobile layout" call already made throughout this wizard.
 *
 * Rendered by the wizard once `createDualProfile` succeeds; the header stays visible behind it
 * (clamped to "STEP 5 OF 5" / "ALL SET", full gold bar) — confirmed against the decoded source's
 * own `dpStepNum: step > 5 ? 5 : step` clamp, not hidden as an earlier draft of this plan assumed.
 */
export function StepConfirmation({
  currentName,
  currentImageUri,
  currentRoleLabel,
  newRoleLabel,
}: {
  currentName?: string | null;
  currentImageUri?: string | null;
  currentRoleLabel?: string;
  newRoleLabel: string;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.hero}>
        <View style={[styles.checkCircle, { backgroundColor: colors.successSurface }]}>
          <Check size={28} color={colors.success} strokeWidth={2.4} />
        </View>
        <Text style={[fonts.display, styles.headline, { color: colors.obInk }]}>Dual profile activated</Text>
        <Text style={[fonts.regular, styles.body, { color: colors.obInk3 }]}>
          Your {newRoleLabel} profile is live. Switch between roles anytime from your avatar in the top bar.
        </Text>
      </View>

      <View style={[styles.profileRow, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}>
        <Avatar name={currentName} imageUri={currentImageUri} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={[fonts.bold, styles.name, { color: colors.obInk }]} numberOfLines={1}>
            {currentName}
          </Text>
          <Text style={[fonts.regular, styles.roleLine, { color: colors.obInk3 }]} numberOfLines={1}>
            {currentRoleLabel ? `${currentRoleLabel} · ${newRoleLabel}` : newRoleLabel}
          </Text>
        </View>
        <View style={[styles.dualBadge, { backgroundColor: colors.successSurface }]}>
          <Text style={[fonts.bold, styles.dualBadgeText, { color: colors.success }]}>Dual</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 9, paddingTop: 10, paddingHorizontal: 6 },
  checkCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  headline: { fontSize: 22, lineHeight: 27, letterSpacing: -0.3, textAlign: 'center' },
  body: { fontSize: 12.5, lineHeight: 19, textAlign: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  name: { fontSize: 12.5 },
  roleLine: { fontSize: 11, marginTop: 2 },
  dualBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  dualBadgeText: { fontSize: 8.5, letterSpacing: 0.4, textTransform: 'uppercase' },
});
