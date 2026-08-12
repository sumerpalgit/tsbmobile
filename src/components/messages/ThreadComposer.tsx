import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, FileText, Paperclip, Send, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { formatFileSize } from '../../types/messages';
import type { ReplyTo } from '../../types/messages';
import type { PickedFile } from '../FileUploadButton';

const MAX_INPUT_HEIGHT = 120;

/** Thread composer — auto-growing input, attach (image/doc via `@react-native-documents/picker`),
 * pending-file preview strip, reply-to bar, send. No emoji button — the device keyboard already
 * provides one, so a second (stub, non-functional) picker button was dropped rather than kept as
 * dead chrome. */
export function ThreadComposer({
  value,
  onChangeText,
  onSend,
  onAttach,
  pendingFile,
  onRemovePendingFile,
  isUploadingFile,
  replyTo,
  onCancelReply,
  disabled,
  editingPreview,
  onCancelEdit,
  editingAllowsAttach,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  pendingFile: PickedFile | null;
  onRemovePendingFile: () => void;
  isUploadingFile: boolean;
  replyTo: ReplyTo | null;
  onCancelReply: () => void;
  disabled: boolean;
  /** Set while editing an existing message — swaps the reply bar for an "Editing message" bar and
   * the send icon for a checkmark. `onSend` still fires either way; the caller (`MessagesScreen`)
   * branches on whether an edit target is set. */
  editingPreview?: string | null;
  onCancelEdit?: () => void;
  /** Attach stays enabled while editing an image/file message (swap or add an attachment, per the
   * real edit contract) but disabled while editing a plain-text message (converting a text
   * message into an attachment one isn't part of that contract) — the caller decides which
   * applies based on the edit target's original content type. Ignored when not editing. */
  editingAllowsAttach?: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const isEditing = !!editingPreview;
  const canSend = (value.trim().length > 0 || !!pendingFile) && !disabled;
  const isPendingImage = pendingFile?.mimeType?.startsWith('image/');
  const attachDisabled = isUploadingFile || (isEditing && !editingAllowsAttach);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.borderSoft, borderTopWidth: borderWidth.thin }]}
    >
      {isEditing ? (
        <View style={[styles.replyBar, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>Editing message</Text>
            <Text numberOfLines={1} style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink2 }]}>
              {editingPreview}
            </Text>
          </View>
          <Pressable onPress={onCancelEdit} hitSlop={8}>
            <X size={15} color={colors.ink3} strokeWidth={1.8} />
          </Pressable>
        </View>
      ) : replyTo ? (
        <View style={[styles.replyBar, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.goldDark }]}>Replying to {replyTo.author}</Text>
            <Text numberOfLines={1} style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink2 }]}>
              {replyTo.text}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <X size={15} color={colors.ink3} strokeWidth={1.8} />
          </Pressable>
        </View>
      ) : null}

      {pendingFile ? (
        <View style={[styles.pendingFile, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}>
          {isPendingImage ? (
            <Image source={{ uri: pendingFile.uri }} style={[styles.pendingThumb, { borderRadius: radius.sm }]} />
          ) : (
            <View style={[styles.pendingIconWell, { backgroundColor: colors.chip, borderRadius: radius.sm }]}>
              <FileText size={16} color={colors.goldDark} strokeWidth={1.6} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[fonts.semibold, { fontSize: fontSize.small + 1, color: colors.ink }]}>
              {pendingFile.name}
            </Text>
            {pendingFile.size ? (
              <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]}>{formatFileSize(pendingFile.size)}</Text>
            ) : null}
          </View>
          <Pressable onPress={onRemovePendingFile} hitSlop={8}>
            <X size={15} color={colors.ink3} strokeWidth={1.8} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          onPress={onAttach}
          disabled={attachDisabled}
          accessibilityLabel="Attach file"
          style={[
            styles.iconButton,
            { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, backgroundColor: colors.surfaceSunken, opacity: attachDisabled ? 0.4 : 1 },
          ]}
        >
          {isUploadingFile ? <ActivityIndicator size="small" color={colors.gold} /> : <Paperclip size={17} color={colors.ink2} strokeWidth={1.5} />}
        </Pressable>
        <View style={[styles.inputWrap, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xxl, backgroundColor: colors.surfaceSunken }]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={isEditing ? 'Edit message…' : 'Type a message…'}
            placeholderTextColor={colors.ink3}
            multiline
            style={[fonts.regular, styles.input, { fontSize: fontSize.ui, color: colors.ink, maxHeight: MAX_INPUT_HEIGHT }]}
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityLabel={isEditing ? 'Save edit' : 'Send message'}
          style={[styles.sendButton, { borderRadius: radius.xl, backgroundColor: canSend ? colors.gold : colors.surfaceSunken }]}
        >
          {isEditing ? (
            <Check size={18} color={canSend ? '#fff' : colors.ink3} strokeWidth={2.2} />
          ) : (
            <Send size={17} color={canSend ? '#fff' : colors.ink3} strokeWidth={1.9} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
    gap: 8,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pendingFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pendingThumb: {
    width: 40,
    height: 40,
  },
  pendingIconWell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: {
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
