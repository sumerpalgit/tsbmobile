import React from 'react';
import { FolderOpen, Pencil, Share2, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';
import { ActionSheet } from './ActionSheet';
import type { Conversation } from '../../types/ai-assist';

/** History Drawer row's "⋮" sheet — Open / Rename / Save / Share / Delete for that specific
 * conversation. Matches the mockup's `chatMenuItems`; "Save" is the mockup's "Save to library"
 * label mapped onto web's real `is_saved` bookmark toggle (the closest real backend feature —
 * neither reference has a literal saved-prompts library concept tied to a whole conversation). */
export function ChatOptionsSheet({
  visible,
  onClose,
  conversation,
  onOpen,
  onRename,
  onToggleSave,
  onShare,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  onOpen: () => void;
  onRename: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const isSaved = !!conversation?.is_saved;

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title={conversation?.title}
      subtitle="Chat options"
      items={[
        { key: 'open', label: 'Open', icon: <FolderOpen size={17} color={colors.goldDark} strokeWidth={1.5} />, onPress: onOpen },
        { key: 'rename', label: 'Rename', icon: <Pencil size={16} color={colors.goldDark} strokeWidth={1.5} />, onPress: onRename },
        {
          key: 'save',
          label: isSaved ? 'Remove from saved' : 'Save chat',
          icon: <Icon name="bookmark" size={16} color={colors.goldDark} filled={isSaved} />,
          onPress: onToggleSave,
        },
        { key: 'share', label: 'Share', icon: <Share2 size={15} color={colors.goldDark} strokeWidth={1.4} />, onPress: onShare },
        { key: 'delete', label: 'Delete', icon: <Trash2 size={16} color={colors.danger} strokeWidth={1.5} />, danger: true, onPress: onDelete },
      ]}
    />
  );
}
