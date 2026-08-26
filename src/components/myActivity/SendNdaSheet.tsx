import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FileText, Check } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';

const NAVY = '#182E43';
const DEFAULT_NDA_URL = 'https://thesearchbridge.com/nda-template';

/** Matches web's `SendNdaModal` (`RequestsOverlay.tsx`) content — recipient/post/template/expiry
 * summary rows, an optional NDA-URL field (blank sends the platform template link), and a
 * required "I confirm I have authority" checkbox — adapted from web's centered dialog into this
 * app's `BottomSheet` shell (the richer-form pattern already used for the card menu's report
 * sheet), not a 1:1 chrome port. */
export function SendNdaSheet({
  visible,
  recipientName,
  recipientRole,
  postTitle,
  sending,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  recipientName: string;
  recipientRole?: string;
  postTitle?: string;
  sending: boolean;
  onConfirm: (ndaUrl: string) => void;
  onClose: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const [checked, setChecked] = useState(false);
  const [ndaUrl, setNdaUrl] = useState('');

  useEffect(() => {
    if (visible) {
      setChecked(false);
      setNdaUrl('');
    }
  }, [visible]);

  const canSend = checked && !sending;
  const rows = [
    { label: 'Recipient', value: [recipientName, recipientRole].filter(Boolean).join(' — ') },
    { label: 'Related post', value: postTitle || 'Your post' },
    { label: 'Template', value: 'Standard mutual NDA' },
    { label: 'Expiry', value: '30 days from send' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!sending}>
      <View style={[styles.icon, { backgroundColor: NAVY }]}>
        <FileText size={26} color={colors.gold} strokeWidth={1.6} />
      </View>
      <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Send Non-Disclosure Agreement</Text>
      <Text style={[fonts.regular, styles.body, { color: colors.ink2 }]}>
        You're about to send an NDA to <Text style={[fonts.bold, { color: colors.ink }]}>{recipientName}</Text>. Once signed, both
        parties can share sensitive deal documents.
      </Text>

      <View style={[styles.rows, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
        {rows.map((row, i) => (
          <View key={row.label} style={[styles.row, i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <Text style={[fonts.regular, styles.rowLabel, { color: colors.ink3 }]}>{row.label}</Text>
            <Text style={[fonts.semibold, styles.rowValue, { color: colors.ink }]} numberOfLines={1}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>
        NDA Document URL <Text style={[fonts.regular, { color: colors.ink3 }]}>(optional — uses platform template if blank)</Text>
      </Text>
      <TextInput
        value={ndaUrl}
        onChangeText={setNdaUrl}
        placeholder="https://drive.google.com/…"
        placeholderTextColor={colors.ink3}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
      />

      <Pressable style={styles.checkboxRow} onPress={() => setChecked(v => !v)}>
        <View
          style={[
            styles.checkbox,
            { borderColor: checked ? colors.accentSolid : colors.border, backgroundColor: checked ? colors.accentSolid : colors.surface },
          ]}
        >
          {checked && <Check size={11} color="#fff" strokeWidth={2.4} />}
        </View>
        <Text style={[fonts.regular, styles.checkboxLabel, { color: colors.ink2 }]}>
          I confirm I have authority to enter this NDA and agree to the platform NDA terms and privacy policy.
        </Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={onClose}
          disabled={sending}
          style={[styles.cancelButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderRadius: radius.lg }]}
        >
          <Text style={[fonts.semibold, styles.cancelLabel, { color: colors.ink2 }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => canSend && onConfirm(ndaUrl.trim() || DEFAULT_NDA_URL)}
          disabled={!canSend}
          style={[styles.sendButton, { backgroundColor: canSend ? colors.accentSolid : colors.creamBorderBold, borderRadius: radius.lg }]}
        >
          <Text style={[fonts.semibold, styles.sendLabel, { color: canSend ? '#fff' : colors.ink3 }]}>
            {sending ? 'Sending…' : 'Send NDA'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 6, letterSpacing: -0.2 },
  body: { fontSize: 12.5, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  rows: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 13, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, gap: 10 },
  rowLabel: { fontSize: 11.5 },
  rowValue: { fontSize: 11.5, flexShrink: 1, textAlign: 'right' },
  fieldLabel: { fontSize: 11.5, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12.5, marginBottom: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 18 },
  checkbox: { width: 19, height: 19, borderRadius: 5, borderWidth: 1.6, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { flex: 1, fontSize: 12, lineHeight: 17.5 },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  cancelButton: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  cancelLabel: { fontSize: 13 },
  sendButton: { flex: 2, height: 46, alignItems: 'center', justifyContent: 'center' },
  sendLabel: { fontSize: 13 },
});
