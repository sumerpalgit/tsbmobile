import { apiClient } from './client';
import { CHAT_ENDPOINTS, FEED_ENDPOINTS, PROFILE_ENDPOINTS, UPLOAD_ENDPOINTS } from './endpoints';
import type { Conversation, Message, PaginationInfo } from '../types/messages';
import type { PickedFile } from '../components/FileUploadButton';

/** Matches webSrc's initial conversations fetch (`page.tsx:432-445`): `GET /chat/conversations`
 * → a **raw array**, not `{ conversations: [...] }` — no wrapping envelope on this one endpoint,
 * unlike AI Assist's `/ai/conversations`. */
export async function fetchConversations(): Promise<Conversation[]> {
  const data = await apiClient.get(CHAT_ENDPOINTS.CONVERSATIONS).then(res => res.data);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((c: any) => ({
    id: c.id,
    name: c.name,
    profileImg: c.profileImg ?? null,
    latestMessage: c.latestMessage ?? null,
    participantId: c.participantId,
    unreadCount: c.unreadCount ?? 0,
    otherParticipantLastReadAt: c.otherParticipantLastReadAt ?? null,
  }));
}

/** Matches webSrc's `startConversationWith`: `POST /chat/conversations` body `{ username2 }` →
 * the conversation object (only `.id` is used by the caller). */
export async function startConversation(username2: string): Promise<string> {
  const data = await apiClient
    .post(CHAT_ENDPOINTS.CONVERSATIONS, { username2 })
    .then(res => res.data);
  const id = data?.id;
  if (!id) throw new Error('Conversation could not be started');
  return id;
}

export type MessagesPage = {
  messages: Message[];
  pagination: PaginationInfo | null;
  /** Freshest available snapshot of the other participant's read-receipt — used for Edit
   * eligibility (`isMessageEditable` in `types/messages.ts`). Present on the response envelope
   * per page fetched; each call just overwrites the caller's copy with the latest. */
  otherParticipantLastReadAt: string | null;
};

/** Matches webSrc's `handleConversationClick`/`loadMoreMessages`: `GET
 * /chat/conversations/:id/messages?page=&limit=50` — response is either a raw array OR
 * `{ messages, pagination }`, web defensively handles both, so this does too. Server returns
 * newest-first; reversed here into chronological order before returning, same as web. */
export async function fetchMessages(
  conversationId: string,
  page = 1,
  limit = 50,
): Promise<MessagesPage> {
  const data = await apiClient
    .get(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`, { params: { page, limit } })
    .then(res => res.data);
  const rows = Array.isArray(data) ? data : data?.messages || [];
  const messages: Message[] = rows
    .map((m: any) => ({
      id: m.id,
      message: m.message,
      created_at: m.created_at,
      isSenderMe: m.isSenderMe,
      sender: { name: m.sender?.name || 'Unknown', username: m.sender?.username, profile_img: m.sender?.profile_img },
      reply_to: m.reply_to ?? null,
      edited_at: m.edited_at ?? null,
    }))
    .reverse();
  return {
    messages,
    pagination: data?.pagination ?? null,
    otherParticipantLastReadAt: (!Array.isArray(data) && data?.otherParticipantLastReadAt) ?? null,
  };
}

/** Matches webSrc's `sendMessage`/`sendFile` shared save call: `POST
 * /chat/conversations/:id/messages` body `{ message, reply_to_message_id? }` → the saved row
 * (`{ id, created_at, reply_to? }`). `message` is a plain string for text, or a
 * `JSON.stringify({type, fileName, fileSize, mimeType, fileUrl})` payload for a file/image —
 * the caller decides which, this function is content-agnostic like web's is. */
export async function sendMessage(
  conversationId: string,
  message: string,
  replyToMessageId?: string,
): Promise<{ id: string; created_at: string; reply_to?: Message['reply_to'] }> {
  const body: Record<string, unknown> = { message };
  if (replyToMessageId) body.reply_to_message_id = replyToMessageId;
  return apiClient
    .post(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`, body)
    .then(res => res.data);
}

/** `PATCH /chat/conversations/:id/messages/:messageId` body `{ message }` — content-agnostic like
 * `sendMessage`, the caller decides the shape: a plain string for a text edit or to remove an
 * image/file message's attachment (converts it to a text message), or the full
 * `JSON.stringify({type, fileName, fileUrl, ...})` payload to keep or replace an attachment while
 * editing its caption (see `MessagesScreen`'s `handleSaveEdit`). Returns the updated row;
 * `edited_at` on it is authoritative, used to patch local state in place. Caller must catch
 * 401/403/404/409 — 409 covers three distinct reasons (edit window expired, already read, or
 * deleted) the response body doesn't distinguish between, so callers show one generic "can no
 * longer be edited" message for it. */
export async function editMessage(
  conversationId: string,
  messageId: string,
  message: string,
): Promise<{ id: string; message: string; created_at: string; edited_at: string }> {
  return apiClient
    .patch(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages/${messageId}`, { message })
    .then(res => res.data);
}

/** `DELETE /chat/conversations/:id/messages/:messageId` — soft delete, no body, no time/read
 * restriction. The server replaces the message's real content with a `{"type":"deleted"}`
 * tombstone for every future response that includes it (history, conversation preview, reply
 * quotes) — the caller only needs to patch its own local copy to the same tombstone shape. */
export async function deleteMessage(conversationId: string, messageId: string): Promise<{ success: boolean; deletedAt: string }> {
  return apiClient
    .delete(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages/${messageId}`)
    .then(res => res.data);
}

/** Matches webSrc's `sendFile` upload step: images go to `/upload/image-upload` (field `image`),
 * everything else (pdf/doc/docx) goes to `/upload/document` (field `file`) — response field name
 * differs too (`imageUrl` vs `fileUrl`), web checks both, so this does too. Caller is responsible
 * for MIME/size validation before calling this, same convention as `uploadAiDocument`. */
export async function uploadChatFile(file: PickedFile): Promise<string> {
  const isImage = (file.mimeType ?? '').startsWith('image/');
  const endpoint = isImage ? UPLOAD_ENDPOINTS.IMAGE_UPLOAD : UPLOAD_ENDPOINTS.DOCUMENT;
  const fieldName = isImage ? 'image' : 'file';

  const form = new FormData();
  form.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? (isImage ? 'image/jpeg' : 'application/octet-stream'),
  } as unknown as Blob);

  const data = await apiClient
    .post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(res => res.data);
  return data?.fileUrl || data?.imageUrl || '';
}

/** Matches webSrc's `markAsRead`: `POST /chat/conversations/:id/read`. */
export function markConversationRead(conversationId: string) {
  return apiClient.post(`${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/read`).then(res => res.data);
}

export type SharedFeedPreview = {
  title: string;
  snippet: string;
  authorName: string | null;
};

/** Matches webSrc's `SharedFeedPreview.tsx`: `GET /feed/single/:feedId` → `{ data: { feed,
 * profile, item, feed_type } }`. This is a deliberately scoped-down port — web renders the full
 * feed-post card here; mobile shows a compact title/snippet card only (see the plan's decision
 * #7). Defensive field extraction since the feed-item schema varies by `feed_type` and isn't
 * otherwise modeled in this mobile app yet. */
export async function fetchSharedFeedPreview(feedId: string): Promise<SharedFeedPreview | null> {
  try {
    const data = await apiClient.get(`${FEED_ENDPOINTS.SINGLE}/${feedId}`).then(res => res.data);
    const item = data?.data?.item ?? data?.item ?? {};
    const profile = data?.data?.profile ?? data?.profile ?? {};
    const title: string = item.title || item.question || item.headline || 'Shared post';
    const snippet: string = (item.description || item.body || item.content || '').toString().slice(0, 90);
    return { title, snippet, authorName: profile.name ?? null };
  } catch {
    return null;
  }
}

export type UserSearchResult = {
  id: string;
  name: string;
  username: string;
  profile_img?: string | null;
};

/** Matches webSrc's new-chat search: `GET /profile/search?query=&limit=8` — response is either
 * `{ profiles }`, `{ data }`, or a raw array, web defensively handles all three, so this does
 * too. Excluding the current user from results is the caller's job (needs `useMe()`), same as
 * web filters by `username !== user?.profile?.username` outside this call. */
export async function searchUsers(query: string, limit = 8): Promise<UserSearchResult[]> {
  const data = await apiClient
    .get(PROFILE_ENDPOINTS.SEARCH, { params: { query, limit } })
    .then(res => res.data);
  const rows = data?.profiles ?? data?.data ?? (Array.isArray(data) ? data : []);
  return rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    username: p.username,
    profile_img: p.profile_img ?? p.profileImg ?? null,
  }));
}
