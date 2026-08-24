import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import { BottomSheet } from '../../BottomSheet';
import { fetchFollowers, Follower } from '../../../api/follow';
import { requestTestimonial } from '../../../api/testimonials';

const DEFAULT_MESSAGE =
  "Hi! I'd really appreciate if you could write a brief testimonial for my TSB profile. Thank you!";

/**
 * "Request Testimonial" bottom sheet — matches web's full flow (`my-profile/page.tsx`'s request
 * modal): fetches the profile owner's followers (`GET /follow/:username/followers`, web uses
 * limit 50), lets the user multi-select recipients (already-requested rows are shown as sent and
 * excluded from selection, matching web's inline `testimonial_request_sent` flag), an editable
 * personal-message textarea pre-filled with the same canned default web uses, and a submit button
 * that sends `POST /testimonial/request` with the selected ids + message.
 */
export function RequestTestimonialSheet({
  visible,
  username,
  onClose,
  onSent,
}: {
  visible: boolean;
  username: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const [loading, setLoading] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSelected(new Set());
    setMessage(DEFAULT_MESSAGE);
    fetchFollowers(username, 1, 50)
      .then(res => setFollowers(res.items))
      .finally(() => setLoading(false));
  }, [visible, username]);

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const result = await requestTestimonial(Array.from(selected), message.trim());
      Toast.show({
        type: 'success',
        text1: `Request sent to ${result.sent} connection${result.sent === 1 ? '' : 's'}`,
        text2: result.skipped > 0 ? `${result.skipped} skipped` : undefined,
      });
      onSent();
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not send request', text2: 'Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!sending}>
      <View style={styles.headerRow}>
        <Text style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]}>Request Testimonial</Text>
        <Pressable
          onPress={onClose}
          disabled={sending}
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}
        >
          <X size={16} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>
      <Text style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]}>
        Select connections to send a testimonial request:
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.ink3} style={styles.loading} />
      ) : followers.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surfaceSunken }]}>
          <Text style={[fonts.semibold, styles.emptyText, { color: colors.ink3 }]}>No connections to request from.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {followers.map(f => {
            const sent = f.testimonial_request_sent;
            const isSelected = selected.has(f.id);
            return (
              <Pressable
                key={f.id}
                onPress={() => !sent && toggle(f.id)}
                disabled={sent}
                style={[styles.row, { opacity: sent ? 0.5 : 1 }]}
              >
                <Avatar name={f.name} imageUri={f.profile_img} size={34} />
                <View style={styles.rowMeta}>
                  <Text style={[fonts.semibold, styles.rowName, { color: colors.ink }]} numberOfLines={1}>{f.name}</Text>
                  {sent && (
                    <Text style={[fonts.regular, styles.rowSentText, { color: colors.ink3 }]}>Request Already Sent</Text>
                  )}
                </View>
                {!sent && (
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: isSelected ? colors.gold : colors.border },
                      isSelected && { backgroundColor: colors.gold },
                    ]}
                  >
                    {isSelected && <Check size={13} color="#fff" strokeWidth={2.4} />}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Personal message</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
        style={[styles.textarea, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
      />

      <Pressable
        onPress={handleSend}
        disabled={selected.size === 0 || sending}
        style={[
          styles.sendButton,
          { backgroundColor: selected.size === 0 ? colors.surfaceSunken : colors.gold },
        ]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={selected.size === 0 ? colors.ink3 : '#fff'} />
        ) : (
          <Text style={[fonts.bold, styles.sendButtonText, { color: selected.size === 0 ? colors.ink3 : '#fff' }]}>
            Send to {selected.size} Connection{selected.size === 1 ? '' : 's'}
          </Text>
        )}
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 18, letterSpacing: -0.2 },
  subtitle: { fontSize: 12.5, marginTop: 9, marginBottom: 12 },
  loading: { paddingVertical: 24 },
  emptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 12.5 },
  list: { maxHeight: 220, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  rowMeta: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13 },
  rowSentText: { fontSize: 11, marginTop: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.6, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, marginTop: 14, marginBottom: 6 },
  textarea: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, fontSize: 13, minHeight: 84, textAlignVertical: 'top' },
  sendButton: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 4 },
  sendButtonText: { fontSize: 13.5 },
});
