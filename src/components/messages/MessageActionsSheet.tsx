import React from 'react';
import { Copy } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { ActionSheet, type ActionSheetItem } from '../ai-assist/ActionSheet';

/** Long-press-on-a-bubble action sheet — Copy only. Reply is triggered by a swipe-right gesture
 * on the bubble instead (`SwipeToReply` in `ThreadMessageBubble.tsx`), a deliberate product
 * decision to split the two actions across two distinct gestures rather than collapsing both into
 * one sheet. `MessagesScreen` only wires this long-press at all when the message has copyable
 * text (an uncaptioned image/file or a shared post has nothing to copy), so the sheet never opens
 * to show nothing. */
export function MessageActionsSheet({ visible, onClose, onCopy }: { visible: boolean; onClose: () => void; onCopy: () => void }) {
  const { colors } = useTheme();

  const items: ActionSheetItem[] = [
    { key: 'copy', label: 'Copy', icon: <Copy size={16} color={colors.goldDark} strokeWidth={1.6} />, onPress: onCopy },
  ];

  return <ActionSheet visible={visible} onClose={onClose} items={items} />;
}
