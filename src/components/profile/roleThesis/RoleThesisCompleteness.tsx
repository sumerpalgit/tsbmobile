import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Top-of-tab completeness card — matches the mockup's `imPctLabel`/`imBarStyle`/`imDoneLabel`/
 * `imSteps` block verbatim (decoded `profilelast_decoded_role.html:2487-2503`): a gold progress
 * bar + "{done} of {total} sections complete" line, then one small dot+label chip per section
 * (green dot once that section's own `complete` flag is true, outline dot otherwise). Driven by
 * the real `GET /profile/seller-thesis/completion` response (`fetchIntermediaryThesisCompletion`),
 * not computed client-side the way the mockup's own demo state does — same "server truth over
 * client-computed" choice already made for the Analytics tab's own completion ring.
 */
export function RoleThesisCompleteness({
  percentage,
  doneCount,
  totalCount,
  sections,
}: {
  percentage: number;
  doneCount: number;
  totalCount: number;
  sections: { label: string; complete: boolean }[];
}) {
  const { colors, fonts } = useTheme();
  const pct = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.authFieldBorder }]}>
      <View style={styles.topRow}>
        <Text style={[fonts.bold, styles.label, { color: colors.ink }]}>Profile completeness</Text>
        <Text style={[fonts.bold, styles.pct, { color: colors.gold }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.gold }]} />
      </View>
      <Text style={[fonts.regular, styles.doneLabel, { color: colors.ink3 }]}>
        {doneCount} of {totalCount} sections complete
      </Text>
      {sections.length > 0 && (
        <View style={styles.stepsRow}>
          {sections.map(section => (
            <View key={section.label} style={styles.step}>
              <View style={[styles.dot, section.complete ? { backgroundColor: colors.success } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.authFieldBorder }]} />
              <Text style={[fonts.regular, styles.stepLabel, { color: colors.ink3 }]}>{section.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 12.5 },
  pct: { fontSize: 12.5 },
  track: { height: 6, borderRadius: 3, marginTop: 9, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  doneLabel: { fontSize: 11, marginTop: 8 },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stepLabel: { fontSize: 10 },
});
