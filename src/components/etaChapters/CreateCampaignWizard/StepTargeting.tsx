import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { AUDIENCE_OPTIONS, GEOGRAPHY_OPTIONS } from './types';
import type { CampaignDraft } from './types';

export function StepTargeting({ draft, onChange }: { draft: CampaignDraft; onChange: (patch: Partial<CampaignDraft>) => void }) {
  const { colors, fonts, fontSize } = useTheme();

  const toggle = (field: 'audience' | 'geography', value: string) => {
    const list = draft[field];
    onChange({ [field]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] } as Partial<CampaignDraft>);
  };

  return (
    <View style={styles.gap}>
      <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>WHO SHOULD SEE IT?</Text>

      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>Audience</Text>
        <View style={styles.chipRow}>
          {AUDIENCE_OPTIONS.map(a => (
            <Chip key={a} label={a} active={draft.audience.includes(a)} onPress={() => toggle('audience', a)} />
          ))}
        </View>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Leave empty to reach all members.</Text>
      </View>

      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>Geography</Text>
        <View style={styles.chipRow}>
          {GEOGRAPHY_OPTIONS.map(g => (
            <Chip key={g} label={g} active={draft.geography.includes(g)} onPress={() => toggle('geography', g)} />
          ))}
        </View>
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Leave empty to reach all locations.</Text>
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderRadius: radius.lg },
        active ? { borderColor: colors.goldLight, backgroundColor: colors.chip } : { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 16,
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  hint: {
    fontSize: 10.5,
  },
});
