import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import { Pill } from '../../Pill';
import { Switch } from '../../Switch';
import { ROLE_COUNTS, ROLE_OPTIONS, WizardDraft } from './types';

const QUICK_PRESETS: { label: string; roles: string[] }[] = [
  { label: 'Everyone', roles: ROLE_OPTIONS },
  { label: 'Searchers + Investors', roles: ['Searchers', 'Investors'] },
  { label: 'Operators only', roles: ['Operators'] },
];

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every(x => b.includes(x));
}

/** Step 3 — quick-select role presets, individual role chips, Require RSVP toggle. Notifying
 * roles is additive to visibility (matches the mockup's own copy: "Your event stays visible to
 * everyone. Tagging roles just makes sure it reaches your intended audience via notifications."). */
export function StepAudience({ draft, onChange }: { draft: WizardDraft; onChange: (patch: Partial<WizardDraft>) => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const toggleRole = (role: string) => {
    const next = draft.roles.includes(role) ? draft.roles.filter(r => r !== role) : [...draft.roles, role];
    onChange({ roles: next });
  };

  // Matches web's `estimatedReach` (`event.tsx:134`): sum of AUDIENCE_ROLES' hardcoded counts
  // for currently-selected roles.
  const estimatedReach = draft.roles.reduce((sum, role) => sum + (ROLE_COUNTS[role] ?? 0), 0);

  return (
    <View style={styles.wrap}>
      <View>
        <Text style={[fonts.bold, styles.label, { color: colors.ink }]}>Notify these roles</Text>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>
          Your event stays visible to everyone. Tagging roles just makes sure it reaches your intended audience via
          notifications.
        </Text>
      </View>

      <View>
        <Text style={[fonts.bold, styles.quickLabel, { color: colors.gold }]}>QUICK SELECT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {QUICK_PRESETS.map(preset => {
            const active = sameSet(draft.roles, preset.roles);
            return (
              <Pressable
                key={preset.label}
                onPress={() => onChange({ roles: preset.roles })}
                style={({ pressed }) => [
                  styles.quickChip,
                  { borderRadius: radius.lg, borderWidth: borderWidth.thin },
                  active ? { backgroundColor: colors.chip, borderColor: colors.gold } : { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="people" size={13} color={active ? colors.goldDark : colors.ink2} />
                <Text style={[fonts.semibold, styles.quickText, { color: active ? colors.goldDark : colors.ink2 }]}>{preset.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.roleWrap}>
        {ROLE_OPTIONS.map(role => (
          <Pill key={role} label={role} selected={draft.roles.includes(role)} onPress={() => toggleRole(role)} />
        ))}
      </View>

      <View style={styles.notifiedRow}>
        <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>MEMBERS NOTIFIED</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink }]}>
          ~<Text style={{ color: colors.goldDark }}>{estimatedReach.toLocaleString()}</Text> members
        </Text>
      </View>

      <View style={[styles.rsvpCard, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}>
        <View style={[styles.rsvpIcon, { backgroundColor: colors.chip, borderRadius: radius.md }]}>
          <Icon name="checkmark" size={16} color={colors.goldDark} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[fonts.bold, styles.rsvpTitle, { color: colors.ink }]}>Require RSVP</Text>
          <Text style={[fonts.regular, styles.rsvpHint, { color: colors.ink3 }]}>Track attendance and send a confirmation email with event details.</Text>
        </View>
        <Switch value={draft.rsvp} onValueChange={v => onChange({ rsvp: v })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingTop: 17,
  },
  label: {
    fontSize: 13,
  },
  hint: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 5,
  },
  quickLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
    marginBottom: 9,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 13,
  },
  quickText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
  },
  roleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  rsvpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  rsvpIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpTitle: {
    fontSize: 13,
  },
  rsvpHint: {
    fontSize: 11.5,
    lineHeight: 15,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.65,
  },
});
