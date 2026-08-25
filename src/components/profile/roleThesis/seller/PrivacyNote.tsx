import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../../../../theme';

/** Small lock-icon info banner — matches web's real `PrivacyNote` (`IntermediaryThesisTab.tsx:
 * 378-385`), used across Business Snapshot's and Growth & Risks' edit sheets and Supporting
 * Materials' both edit and read modes, each with a different message. Lives in its own file (not
 * `BusinessOwnerThesisTab.tsx`) purely to avoid a circular import — the tab imports every edit
 * sheet, and several sheets need this component too. */
export function PrivacyNote({ children }: { children: React.ReactNode }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.privacyNote, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      <Lock size={13} color={colors.ink3} strokeWidth={1.6} style={styles.privacyIcon} />
      <Text style={[fonts.regular, styles.privacyText, { color: colors.ink3 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  privacyIcon: { marginTop: 2 },
  privacyText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 18 },
});
