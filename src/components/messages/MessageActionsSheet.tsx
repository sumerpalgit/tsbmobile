import React from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ActionSheet, type ActionSheetItem } from '../ai-assist/ActionSheet';
import { isMessageDeletable, isMessageEditable } from '../../types/messages';
import type { Message } from '../../types/messages';

/** Long-press-on-a-bubble action sheet — Copy, Edit, Delete. Reply is triggered by a swipe-right
 * gesture on the bubble instead (`SwipeToReply` in `ThreadMessageBubble.tsx`), a deliberate
 * product decision to split it out from this sheet rather than collapsing every action into one
 * gesture.
 *
 * Edit covers text, image, and file messages (a shared-post message has no edit orchestration in
 * the real contract, so it stays un-editable) — see `MessagesScreen`'s `handleStartEdit`/
 * `handleSaveEdit` for the keep-caption / replace-attachment / remove-attachment branches, matching
 * `api/messages.ts`'s `editMessage` doc comment. Delete has no content-type restriction either — it
 * applies to every message type per the real contract.
 *
 * `MessagesScreen` only wires this long-press at all when there's at least one eligible action
 * (copyable text, or a message this sheet would show Edit/Delete for) — never opens to show
 * nothing. */
export function MessageActionsSheet({
  visible,
  onClose,
  message,
  otherParticipantLastReadAt,
  copyableText,
  onCopy,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  message: Message | null;
  otherParticipantLastReadAt: string | null;
  copyableText: string | null;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();

  const items: ActionSheetItem[] = [];
  if (copyableText) {
    items.push({ key: 'copy', label: 'Copy', icon: <Copy size={16} color={colors.goldDark} strokeWidth={1.6} />, onPress: onCopy });
  }
  if (message && isMessageEditable(message, otherParticipantLastReadAt)) {
    items.push({ key: 'edit', label: 'Edit', icon: <Pencil size={16} color={colors.goldDark} strokeWidth={1.6} />, onPress: onEdit });
  }
  if (message && isMessageDeletable(message)) {
    items.push({ key: 'delete', label: 'Delete', icon: <Trash2 size={16} color={colors.danger} strokeWidth={1.6} />, danger: true, onPress: onDelete });
  }

  return <ActionSheet visible={visible} onClose={onClose} items={items} />;
}
