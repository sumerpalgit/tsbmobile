import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { searchEtaChapters } from '../../../api/eta';
import type { EtaChapter } from '../../../api/eta';
import type { CampaignDraft } from './types';

const PLACEMENTS: { value: CampaignDraft['placement']; title: string; sub: string }[] = [
  { value: 'home', title: 'Home Feed', sub: 'Right rail of every TSB home page · ~12K weekly impressions' },
  { value: 'eta', title: 'ETA Chapter Page', sub: 'Targeted to specific local chapters · higher engagement' },
  { value: 'both', title: 'Home + ETA Chapter', sub: 'Maximum reach across both surfaces · 15% bundle discount' },
];

const BANNER_TIERS: { value: CampaignDraft['bannerTier']; title: string; sub: string; rate: string }[] = [
  { value: 'standard', title: 'Standard Banner', sub: '260 × 200 · static or single image', rate: 'Base rate' },
  { value: 'premium', title: 'Premium Banner', sub: '260 × 200 · priority rotation slot, 2× visibility', rate: '2.5× base' },
];

export function StepPlacement({ draft, onChange }: { draft: CampaignDraft; onChange: (patch: Partial<CampaignDraft>) => void }) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const [chapterQuery, setChapterQuery] = useState('');
  const [chapterResults, setChapterResults] = useState<EtaChapter[]>([]);
  const needsEta = draft.placement === 'eta' || draft.placement === 'both';

  useEffect(() => {
    if (!needsEta) return;
    const timer = setTimeout(() => {
      searchEtaChapters(chapterQuery.trim())
        .then(res => setChapterResults(res.slice(0, 10)))
        .catch(() => setChapterResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [chapterQuery, needsEta]);

  const toggleChapter = (id: string) =>
    onChange({ chapterIds: draft.chapterIds.includes(id) ? draft.chapterIds.filter(c => c !== id) : [...draft.chapterIds, id] });

  return (
    <View style={styles.gap}>
      <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>WHERE SHOULD YOUR AD APPEAR?</Text>

      <View style={styles.gap}>
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>
          Ad placement <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        {PLACEMENTS.map(p => {
          const active = draft.placement === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => onChange({ placement: p.value })}
              style={[styles.radioRow, { borderColor: active ? colors.goldLight : colors.border, backgroundColor: active ? colors.chip : colors.surface, borderRadius: radius.xl }]}
            >
              <View style={[styles.dot, { borderColor: active ? colors.gold : colors.border, borderWidth: active ? 5 : 1.5 }]} />
              <View style={styles.radioText}>
                <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>{p.title}</Text>
                <Text style={[fonts.regular, styles.radioSub, { color: colors.ink3 }]}>{p.sub}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {needsEta && (
        <View style={[styles.chapterPicker, { backgroundColor: colors.surfaceSunken, borderRadius: radius.xl }]}>
          <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>Choose ETA chapters</Text>
          <TextInput
            value={chapterQuery}
            onChangeText={setChapterQuery}
            placeholder="Search chapters…"
            placeholderTextColor={colors.ink3}
            style={[fonts.regular, styles.chapterSearchInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.lg }]}
          />
          <View style={styles.chipRow}>
            {chapterResults.map(c => {
              const active = draft.chapterIds.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggleChapter(c.id)}
                  style={[
                    styles.chapterChip,
                    active
                      ? { borderColor: colors.goldLight, backgroundColor: colors.chip, borderRadius: radius.lg }
                      : { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg },
                  ]}
                >
                  <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.gap}>
        <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>
          Banner tier <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        {BANNER_TIERS.map(t => {
          const active = draft.bannerTier === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => onChange({ bannerTier: t.value })}
              style={[styles.radioRow, { borderColor: active ? colors.goldLight : colors.border, backgroundColor: active ? colors.chip : colors.surface, borderRadius: radius.xl }]}
            >
              <View style={[styles.dot, { borderColor: active ? colors.gold : colors.border, borderWidth: active ? 5 : 1.5 }]} />
              <View style={styles.radioText}>
                <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]}>{t.title}</Text>
                <Text style={[fonts.regular, styles.radioSub, { color: colors.ink3 }]}>{t.sub}</Text>
              </View>
              <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink3 }]}>{t.rate}</Text>
            </Pressable>
          );
        })}
      </View>
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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderWidth: 1,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  radioText: {
    flex: 1,
    minWidth: 0,
  },
  radioSub: {
    fontSize: 11,
    marginTop: 2,
  },
  chapterPicker: {
    padding: 12,
    gap: 8,
  },
  chapterSearchInput: {
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chapterChip: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
