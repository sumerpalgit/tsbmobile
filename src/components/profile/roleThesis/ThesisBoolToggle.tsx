import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Tri-state Yes/No toggle for Searcher's Execution Strength card (`hasPriorAcquisition` etc.) —
 * web's real `BoolToggle` component; tapping the already-active option again clears it back to
 * `null` (unanswered), matching its real tri-state behavior. Confirmed against a real web
 * screenshot: the active button (whichever of Yes/No is selected) is a solid navy pill with white
 * text — same `--tsb-accent-solid`/`colors.hero1` treatment as the Time Commitment toggle
 * elsewhere in this tab, NOT the green/red read-mode pill tones this file originally guessed at
 * (those only apply to the read-mode display, not this edit control). The inactive button is
 * plain white/bordered with `ink2` text, matching the screenshot's "No" state exactly.
 */
export function ThesisBoolToggle({ value, onChange }: { value: boolean | null; onChange: (value: boolean | null) => void }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(value === true ? null : true)}
        style={[
          styles.button,
          value === true ? { backgroundColor: colors.hero1, borderColor: colors.hero1 } : { backgroundColor: colors.authField, borderColor: colors.authFieldBorder },
        ]}
      >
        <Text style={[value === true ? fonts.bold : fonts.semibold, styles.label, { color: value === true ? '#fff' : colors.ink2 }]}>Yes</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(value === false ? null : false)}
        style={[
          styles.button,
          value === false ? { backgroundColor: colors.hero1, borderColor: colors.hero1 } : { backgroundColor: colors.authField, borderColor: colors.authFieldBorder },
        ]}
      >
        <Text style={[value === false ? fonts.bold : fonts.semibold, styles.label, { color: value === false ? '#fff' : colors.ink2 }]}>No</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12.5 },
});
