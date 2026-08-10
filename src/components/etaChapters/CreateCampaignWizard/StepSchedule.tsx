import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';
import { DateTimeField } from '../../events/CreateEventWizard/DateTimeField';
import { Field } from './StepBrand';
import { actualDays, computeCampaignCost, DURATION_PRESETS } from './types';
import type { CampaignDraft } from './types';

export function StepSchedule({ draft, onChange }: { draft: CampaignDraft; onChange: (patch: Partial<CampaignDraft>) => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const days = actualDays(draft);
  const cost = computeCampaignCost(draft.placement, draft.bannerTier, draft.chapterIds.length, days);

  return (
    <View style={styles.gap}>
      <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>RUN TIME</Text>

      <Field label="Campaign start date" required>
        <DateTimeField value={draft.startDate} mode="date" placeholder="Select a start date" onChange={v => onChange({ startDate: v })} />
      </Field>

      <Field label="Campaign duration" required>
        <View style={styles.chipRow}>
          {DURATION_PRESETS.map(d => {
            const active = draft.durationDays === d;
            return (
              <Pressable
                key={d}
                onPress={() => onChange({ durationDays: d })}
                style={[
                  styles.pill,
                  { borderRadius: radius.lg },
                  active ? { borderColor: colors.goldLight, backgroundColor: colors.chip } : { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{d} days</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => onChange({ durationDays: 'custom' })}
            style={[
              styles.pill,
              { borderRadius: radius.lg },
              draft.durationDays === 'custom' ? { borderColor: colors.goldLight, backgroundColor: colors.chip } : { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Text style={[fonts.semibold, { fontSize: fontSize.small, color: draft.durationDays === 'custom' ? colors.goldDark : colors.ink2 }]}>Custom</Text>
          </Pressable>
        </View>
        {draft.durationDays === 'custom' && (
          <TextInput
            value={draft.customDays}
            onChangeText={t => onChange({ customDays: t.replace(/[^0-9]/g, '') })}
            placeholder="Number of days"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            style={[fonts.regular, styles.customInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
          />
        )}
      </Field>

      <LinearGradient colors={[colors.hero1, colors.hero2]} style={[styles.costCard, { borderRadius: radius.xl }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={[fonts.bold, styles.costLabel, { color: colors.goldLight }]}>ESTIMATED COST</Text>
        <View style={styles.costRows}>
          <CostRow label="Placement" value={draft.placement === 'home' ? 'Home Feed' : draft.placement === 'eta' ? 'ETA Chapter' : 'Home + ETA Chapter'} />
          <CostRow label="Banner tier" value={draft.bannerTier === 'premium' ? 'Premium · 2.5×' : 'Standard · 1×'} />
          <CostRow label="Duration" value={`${days} days`} />
        </View>
        <View style={[styles.totalRow, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={[fonts.bold, styles.totalLabel, { color: colors.goldLight }]}>ESTIMATED TOTAL</Text>
          <Text style={[fonts.display, styles.totalValue, { color: '#fff' }]}>${cost}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  const { fonts, fontSize } = useTheme();
  return (
    <View style={styles.costRow}>
      <Text style={[fonts.regular, { fontSize: fontSize.small, color: 'rgba(255,255,255,0.8)' }]}>{label}</Text>
      <Text style={[fonts.bold, { fontSize: fontSize.small, color: '#fff' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 13,
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
  pill: {
    height: 34,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  customInput: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
    marginTop: 8,
  },
  costCard: {
    padding: 14,
  },
  costLabel: {
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
  costRows: {
    gap: 6,
    marginTop: 9,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
  },
  totalValue: {
    fontSize: 22,
  },
});
