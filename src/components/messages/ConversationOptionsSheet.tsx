import React from 'react';
import { FolderOpen } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { ActionSheet, type ActionSheetItem } from '../ai-assist/ActionSheet';
import type { Conversation } from '../../types/messages';

/** Conversation-row "More"/thread-header options sheet — reuses the bottom-sheet chrome already
 * built for AI Assist (`components/ai-assist/ActionSheet.tsx`) rather than duplicating it.
 * Items: Open conversation, Mark as read (only when actually unread), View profile.
 *
 * Only ONE direction of read-state is real: web has `POST /chat/conversations/:id/read`
 * (mark-read) but no mark-*unread* endpoint at all — the mockup's toggle between "Mark as read"/
 * "Mark as unread" is cosmetic on the read side too (its own local `read[]` state flips freely,
 * no backend call either way). Per the plan's decision #1 (omit actions with no real backend —
 * already applied to Mute/Block/Delete), "Mark as unread" is dropped the same way: the row only
 * shows "Mark as read" conditionally, when there's something real to do. */
export function ConversationOptionsSheet({
  visible,
  onClose,
  conversation,
  onOpen,
  onMarkRead,
  // Kept in the prop signature (and still passed by every caller) so re-enabling "View profile"
  // below is a one-line uncomment, not a signature change.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onViewProfile,
}: {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onOpen: () => void;
  onMarkRead: () => void;
  onViewProfile: () => void;
}) {
  const { colors } = useTheme();
  const isUnread = !!conversation && conversation.unreadCount > 0;

  const items: ActionSheetItem[] = [
    { key: 'open', label: 'Open conversation', icon: <FolderOpen size={17} color={colors.goldDark} strokeWidth={1.5} />, onPress: onOpen },
  ];
  if (isUnread) {
    items.push({
      key: 'read',
      label: 'Mark as read',
      icon: <Icon name="check" size={16} color={colors.goldDark} />,
      onPress: onMarkRead,
    });
  }
  // Temporarily disabled — `resolveParticipantUsername` (`MessagesScreen.tsx`) only works when
  // the thread already has a message FROM the other participant carrying a `sender.username`
  // field; a new/empty conversation (or one where they haven't replied yet) has nothing to scan
  // and this fails with "Could not open this profile". Re-enable once that resolution is made
  // reliable (or a real per-conversation participant-username endpoint exists to use instead).
  // items.push({
  //   key: 'profile',
  //   label: 'View profile',
  //   icon: <Icon name="account" size={16} color={colors.goldDark} />,
  //   onPress: onViewProfile,
  // });

  return (
    <ActionSheet visible={visible} onClose={onClose} title={conversation?.name} subtitle="Conversation options" items={items} />
  );
}
