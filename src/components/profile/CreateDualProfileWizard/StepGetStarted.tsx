import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowRight, CreditCard, RefreshCw, Users } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import { GroundRuleCard } from '../../../screens/onboarding/components/GroundRuleCard';

/** Step 1 — informational splash, no fields. Reuses `GroundRuleCard` (built for onboarding's
 * ground-rules step) for the 3 benefit cards — same icon+title+description card shape, and
 * deliberately kept in onboarding's own `ob*` visual identity (not the plain dashboard palette)
 * since this step content is, functionally, a re-run of the same "set up a profile" flow the
 * user already went through once at signup — see the plan's reuse-matrix note. */
export function StepGetStarted({
  currentName,
  currentImageUri,
  currentRoleLabel,
}: {
  currentName?: string | null;
  currentImageUri?: string | null;
  currentRoleLabel?: string;
}) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <View style={{ gap: 22 }}>
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrap}>
          <Avatar name={currentName} imageUri={currentImageUri} size={56} />
          {!!currentRoleLabel && (
            <View style={[styles.roleBadge, { backgroundColor: '#182E43' }]}>
              <Text style={[fonts.bold, styles.roleBadgeText, { color: '#fff' }]} numberOfLines={1}>
                {currentRoleLabel}
              </Text>
            </View>
          )}
        </View>
        <ArrowRight size={18} color={colors.obInk3} strokeWidth={1.8} />
        <View style={styles.avatarWrap}>
          <View style={[styles.newRoleCircle, { backgroundColor: colors.obGold }]}>
            <Text style={[fonts.bold, { fontSize: 22, color: colors.onAccent }]}>+</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.obChip }]}>
            <Text style={[fonts.bold, styles.roleBadgeText, { color: colors.obGold }]}>New role</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[fonts.display, styles.headline, { color: colors.obInk }]}>Add a second role to your account</Text>
        <Text style={[fonts.regular, styles.body, { color: colors.obInk2 }]}>
          Many members wear multiple hats — searcher by day, advisor by night. A dual profile lets you show
          up fully for both.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <GroundRuleCard
          icon={RefreshCw}
          title="Switch in one tap"
          description="Profile switcher in your avatar menu. No second login required."
        />
        <GroundRuleCard
          icon={Users}
          title="Separate networks"
          description="Your searcher network stays separate from your advisor pipeline."
        />
        <GroundRuleCard
          icon={CreditCard}
          title="One billing account"
          description="A single discounted membership covers both roles."
        />
      </View>

      {!!currentName && (
        <View style={[styles.currentStrip, { backgroundColor: colors.obChip, borderColor: colors.obGoldLight }]}>
          <Avatar name={currentName} imageUri={currentImageUri} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={[fonts.bold, styles.currentEyebrow, { color: colors.obGold }]}>YOUR CURRENT PROFILE</Text>
            <Text style={[fonts.bold, { fontSize: fontSize.small + 1, color: colors.obInk, marginTop: 2 }]} numberOfLines={1}>
              {currentRoleLabel ? `${currentName} — ${currentRoleLabel}` : currentName}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  avatarWrap: { alignItems: 'center', gap: 6 },
  newRoleCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  roleBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  roleBadgeText: { fontSize: 8.5, letterSpacing: 0.3, textTransform: 'uppercase' },
  headline: { fontSize: 21, lineHeight: 26, letterSpacing: -0.3, textAlign: 'center' },
  body: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  currentStrip: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 14, borderWidth: 1 },
  currentEyebrow: { fontSize: 9, letterSpacing: 0.8 },
});
