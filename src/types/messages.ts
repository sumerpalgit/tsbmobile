/**
 * Messages — types matching webSrc's own interfaces in `webSrc/src/app/dashboard/messages/page.tsx`
 * exactly, so a value can always be traced back to the web source. See `src/api/messages.ts` for
 * which endpoint returns which shape, and `src/hooks/useWebSocket.ts` for the real-time payloads.
 */

export type Conversation = {
  id: string;
  name: string;
  profileImg?: string | null;
  latestMessage?: { message: string; created_at: string; sender: { name: string } } | null;
  participantId: string;
  unreadCount: number;
};

export type ReplyTo = {
  id: string;
  author: string;
  text: string;
};

export type Message = {
  id: string;
  message: string;
  created_at: string;
  isSenderMe: boolean;
  sender: { name: string; username?: string; profile_img?: string };
  reply_to?: { id: string; message: string; sender_name: string } | null;
};

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasMore: boolean;
};

/** The `message` column is always a plain string in the DB — non-text content is JSON-encoded
 * into it client-side. Matches webSrc's parse-with-fallback exactly (`page.tsx`'s inline
 * `JSON.parse(rawMessage)` calls in `getConversationPreview` and the bubble renderer): a string
 * that fails to parse as JSON is treated as plain text. */
export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; fileName: string; fileSize: number; mimeType: string; fileUrl: string; text?: string }
  | { type: 'file'; fileName: string; fileSize: number; mimeType: string; fileUrl: string; text?: string }
  | { type: 'shared_feed'; feedId: string };

export function parseMessageContent(raw: string): MessageContent {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type === 'image' || parsed?.type === 'file' || parsed?.type === 'shared_feed') {
      return parsed;
    }
    return { type: 'text', text: parsed?.text ?? raw };
  } catch {
    return { type: 'text', text: raw };
  }
}

/** Conversation-list preview line — matches webSrc's `getConversationPreview` exactly (same
 * emoji/truncation choices, so the inbox reads identically to web). */
export function getConversationPreview(rawMessage?: string | null): string {
  if (!rawMessage) return '';
  const parsed = parseMessageContent(rawMessage);
  if (parsed.type === 'shared_feed') return '📎 Shared a post';
  if (parsed.type === 'file') return `📄 ${parsed.fileName || 'Document'}`;
  if (parsed.type === 'image') return `🖼 ${parsed.fileName || 'Image'}`;
  return (parsed.text || '').slice(0, 40);
}

/** What "Copy" (the message long-press action) copies — matches web's own
 * `navigator.clipboard.writeText(parsed.text || "")`: a text message's own text, an image/file
 * message's caption (`null` if it wasn't captioned — copying an empty string isn't useful), or
 * `null` for a shared-post message (nothing textual to copy). `null` also tells the action sheet
 * to hide the Copy row entirely rather than show a no-op. */
export function getCopyableText(parsed: MessageContent): string | null {
  if (parsed.type === 'text') return parsed.text;
  if (parsed.type === 'image' || parsed.type === 'file') return parsed.text || null;
  return null;
}

/** Matches webSrc's `formatFileSize` exactly. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Deterministic per-conversation avatar color — matches webSrc's `avatarColor` hash + palette
 * exactly (same 8 colors, same char-code hash), so avatars are stable but not tied to any real
 * per-conversation color field (there isn't one). */
const AVATAR_COLORS = [
  '#182E43', '#1f3a52', '#2a4d66', '#6366f1', '#e85d04', '#c2410c', '#B45309', '#1a7a48',
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // eslint-disable-next-line no-bitwise -- exact port of webSrc's hash (`page.tsx`'s `avatarColor`), not a bug.
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
}

export type MsgGroup = { isMine: boolean; senderName: string; messages: Message[] };
export type DateGroup = { dateLabel: string; groups: MsgGroup[] };

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Groups a chronological message list into date sections, each with consecutive-same-sender
 * sub-groups (so the avatar/name renders once per group, not once per message) — matches
 * webSrc's `groupMessages` exactly. */
export function groupMessages(messages: Message[]): DateGroup[] {
  const result: DateGroup[] = [];
  let currentDateLabel = '';
  let currentDateGroup: DateGroup | null = null;
  let currentMsgGroup: MsgGroup | null = null;

  for (const msg of messages) {
    const label = formatDateLabel(msg.created_at);
    if (label !== currentDateLabel) {
      currentDateLabel = label;
      currentDateGroup = { dateLabel: label, groups: [] };
      result.push(currentDateGroup);
      currentMsgGroup = null;
    }
    if (!currentMsgGroup || currentMsgGroup.isMine !== msg.isSenderMe) {
      currentMsgGroup = { isMine: msg.isSenderMe, senderName: msg.sender.name, messages: [] };
      currentDateGroup!.groups.push(currentMsgGroup);
    }
    currentMsgGroup.messages.push(msg);
  }
  return result;
}

/** De-dupes by id when merging fetched/incoming messages into local state — matches webSrc's
 * `appendUniqueMessages` (a later entry with the same id overwrites the earlier one, which is
 * what lets an optimistic temp message get patched in place by its real server counterpart if
 * both ever end up passed through this in the same call). */
export function appendUniqueMessages(prev: Message[], incoming: Message[]): Message[] {
  const map = new Map<string, Message>();
  for (const msg of prev) map.set(msg.id, msg);
  for (const msg of incoming) map.set(msg.id, msg);
  return Array.from(map.values());
}
