import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';

const NAVY = '#182E43';
const TEAL = '#0e7490';

/** Matches web's `SendCimModal` (`RequestsOverlay.tsx`) — recipient/post/document/status summary
 * rows plus a required CIM-URL field (no default template, unlike the NDA sheet). Same
 * `BottomSheet`-shell adaptation as `SendNdaSheet.tsx`. */
export function SendCimSheet({
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
  onConfirm: (cimUrl: string) => void;
  onClose: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const [cimUrl, setCimUrl] = useState('');

  useEffect(() => {
    if (visible) setCimUrl('');
  }, [visible]);

  const canSend = cimUrl.trim().length > 0 && !sending;
  const rows = [
    { label: 'Recipient', value: [recipientName, recipientRole].filter(Boolean).join(' — ') },
    { label: 'Related post', value: postTitle || 'Your post' },
    { label: 'Document', value: 'Confidential Information Memorandum' },
    { label: 'Status', value: 'NDA signed — ready to share' },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!sending}>
      <View style={[styles.icon, { backgroundColor: NAVY }]}>
        <FileText size={26} color={TEAL} strokeWidth={1.6} />
      </View>
      <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Send Confidential Information Memorandum</Text>
      <Text style={[fonts.regular, styles.body, { color: colors.ink2 }]}>
        The NDA has been signed. Paste the link to your CIM document to share it with{' '}
        <Text style={[fonts.bold, { color: colors.ink }]}>{recipientName}</Text>.
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
        CIM Document URL <Text style={{ color: '#be123c' }}>*</Text>
      </Text>
      <TextInput
        value={cimUrl}
        onChangeText={setCimUrl}
        placeholder="https://drive.google.com/…"
        placeholderTextColor={colors.ink3}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
      />

      <View style={styles.buttonRow}>
        <Pressable
          onPress={onClose}
          disabled={sending}
          style={[styles.cancelButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderRadius: radius.lg }]}
        >
          <Text style={[fonts.semibold, styles.cancelLabel, { color: colors.ink2 }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => canSend && onConfirm(cimUrl.trim())}
          disabled={!canSend}
          style={[styles.sendButton, { backgroundColor: canSend ? TEAL : colors.creamBorderBold, borderRadius: radius.lg }]}
        >
          <Text style={[fonts.semibold, styles.sendLabel, { color: canSend ? '#fff' : colors.ink3 }]}>
            {sending ? 'Sending…' : 'Send CIM'}
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
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12.5, marginBottom: 18 },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  cancelButton: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  cancelLabel: { fontSize: 13 },
  sendButton: { flex: 2, height: 46, alignItems: 'center', justifyContent: 'center' },
  sendLabel: { fontSize: 13 },
});
