import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';

/**
 * Lightweight comment composer sheet — Home feed has no comment-thread display anywhere yet (a
 * genuine Home-feed task beyond what My Activity needs, see the plan's Phase 0 scope note), so
 * this only composes and submits one comment; it doesn't show existing ones. Doubles as My
 * Activity's "Edit comment" sheet (Phase 1, `ActivityCardWrapper`'s Commented Posts bar) via
 * `initialValue`/`title`/`submitLabel` — same shell, pre-filled and relabeled.
 */
export function CommentComposerSheet({
  visible,
  onClose,
  onSubmit,
  submitting,
  initialValue = '',
  title = 'Add a Comment',
  submitLabel = 'Post Comment',
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  submitting: boolean;
  initialValue?: string;
  title?: string;
  submitLabel?: string;
}) {
  const { colors, fonts, radius } = useTheme();
  const [content, setContent] = useState(initialValue);

  useEffect(() => {
    if (visible) setContent(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!submitting}>
      <View style={styles.headerRow}>
        <Text style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]}>{title}</Text>
        <Pressable
          onPress={onClose}
          disabled={submitting}
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}
        >
          <X size={16} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>

      <TextInput
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        autoFocus
        placeholder="Write a comment…"
        placeholderTextColor={colors.ink3}
        style={[styles.textarea, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
      />

      <Pressable
        onPress={handleSubmit}
        disabled={!content.trim() || submitting}
        style={[styles.sendButton, { backgroundColor: !content.trim() ? colors.surfaceSunken : colors.gold }]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={!content.trim() ? colors.ink3 : '#fff'} />
        ) : (
          <Text style={[fonts.bold, styles.sendButtonText, { color: !content.trim() ? colors.ink3 : '#fff' }]}>
            {submitLabel}
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
  textarea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    minHeight: 96,
    textAlignVertical: 'top',
    marginTop: 14,
  },
  sendButton: { height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 4 },
  sendButtonText: { fontSize: 13.5 },
});
