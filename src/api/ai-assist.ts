import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_PREFIX } from '@env';
import { apiClient } from './client';
import { AI_ENDPOINTS } from './endpoints';
import type {
  Conversation,
  ConversationMessage,
  MessageReaction,
  PaginationInfo,
} from '../types/ai-assist';
import type { PickedFile } from '../components/FileUploadButton';

/** Matches webSrc's `fetchAiConversations`: `GET /api/ai/conversations` → `{ conversations }`. */
export async function fetchAiConversations(): Promise<Conversation[]> {
  const data = await apiClient.get(AI_ENDPOINTS.CONVERSATIONS).then(res => res.data);
  return Array.isArray(data?.conversations) ? data.conversations : [];
}

/** Matches webSrc's `createAiConversation`: `POST /api/ai/conversations` body `{ title }` →
 * `{ conversation: { id } }`. */
export async function createAiConversation(title = 'New Chat'): Promise<string> {
  const data = await apiClient.post(AI_ENDPOINTS.CONVERSATIONS, { title }).then(res => res.data);
  const id = data?.conversation?.id;
  if (!id) throw new Error('Conversation could not be initialized');
  return id;
}

/** Matches webSrc's `deleteAiConversation`: `DELETE /api/ai/conversations/:id`. */
export function deleteAiConversation(conversationId: string) {
  return apiClient.delete(`${AI_ENDPOINTS.CONVERSATIONS}/${conversationId}`).then(res => res.data);
}

export type ConversationMessagesResponse = {
  messages: ConversationMessage[];
  pagination: PaginationInfo | null;
};

/** Matches webSrc's `fetchAiConversationMessages`: `GET
 * /api/ai/conversations/:id/messages?page=&limit=` → `{ messages, pagination }`. Same 50-per-page
 * default web's `loadConversationMessages` uses. */
export async function fetchAiConversationMessages(
  conversationId: string,
  page = 1,
  limit = 50,
): Promise<ConversationMessagesResponse> {
  const data = await apiClient
    .get(`${AI_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`, { params: { page, limit } })
    .then(res => res.data);
  return {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    pagination: data?.pagination ?? null,
  };
}

/** Matches webSrc's `updateAiConversation`: `PATCH /api/ai/conversations/:id` body
 * `{ title?, is_saved? }` — powers both rename and the bookmark/save toggle. */
export function updateAiConversation(
  conversationId: string,
  updates: { title?: string; is_saved?: boolean },
) {
  return apiClient
    .patch(`${AI_ENDPOINTS.CONVERSATIONS}/${conversationId}`, updates)
    .then(res => res.data);
}

/** Matches webSrc's `reactToAiMessage`: `POST /api/ai/messages/:id/reaction` body `{ reaction }`,
 * `reaction: null` clears an existing like/dislike (tapping the same one twice). */
export function reactToAiMessage(messageId: string, reaction: MessageReaction | null) {
  return apiClient
    .post(`${AI_ENDPOINTS.MESSAGES}/${messageId}/reaction`, { reaction })
    .then(res => res.data);
}

/** Matches webSrc's `shareAiConversation`: `POST /api/ai/conversations/:id/share` →
 * `{ shareUrl, shareToken }`. */
export async function shareAiConversation(conversationId: string): Promise<string | null> {
  const data = await apiClient
    .post(`${AI_ENDPOINTS.CONVERSATIONS}/${conversationId}/share`)
    .then(res => res.data);
  return data?.shareUrl ?? null;
}

/** Matches webSrc's `summariseAiMessage`: `POST /api/ai/messages/:id/summarise` → `{ summary }`. */
export async function summariseAiMessage(messageId: string): Promise<string> {
  const data = await apiClient
    .post(`${AI_ENDPOINTS.MESSAGES}/${messageId}/summarise`)
    .then(res => res.data);
  return data?.summary ?? 'No summary available.';
}

/** Matches webSrc's `uploadAiDocument`: `POST /api/ai/documents/upload`, multipart (`file` +
 * `conversationId`). Same PDF-only/15MB validation as web — enforced by the caller before this
 * is invoked, same as `FileUploadButton`'s pattern of validating before the network call. */
export function uploadAiDocument(file: PickedFile, conversationId: string) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/pdf',
  } as unknown as Blob);
  form.append('conversationId', conversationId);

  return apiClient
    .post(AI_ENDPOINTS.UPLOAD_DOCUMENT, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(res => res.data);
}

export type StreamAiGenerateCallbacks = {
  onStart?: (conversationId: string | null) => void;
  onToken?: (token: string, fullText: string) => void;
  onDone?: (finalText: string, conversationId: string | null) => void;
  onError?: (message: string) => void;
};

/** Matches webSrc's `generateContent`: `POST /api/ai/generate-stream` body
 * `{ message, conversationId }`, an SSE stream of `start` / `token` / `done` / `error` events
 * (see `webSrc/src/app/api/ai/generate-stream/route.ts`, which just proxies this same backend
 * route). Ported onto `XMLHttpRequest` + `onprogress` rather than `fetch`'s streaming body —
 * RN/Hermes doesn't reliably expose a readable `response.body` without a polyfill this app
 * doesn't have, while XHR's progressive `responseText` is the standard dependency-free RN
 * technique. Returns an `abort()` handle so the caller can cancel mid-stream (e.g. screen unmount
 * or starting a new chat while one is in flight).
 *
 * `apiClient`'s axios instance isn't reused here — its interceptors assume a single
 * request/response pair, not a long-lived progressively-read one — so the base URL and bearer
 * token are read the same way `client.ts`'s request interceptor does, by hand.
 */
export async function streamAiGenerate(
  payload: { message: string; conversationId: string | null },
  callbacks: StreamAiGenerateCallbacks,
): Promise<{ abort: () => void }> {
  const token = await AsyncStorage.getItem('accessToken');
  const xhr = new XMLHttpRequest();
  let lastLength = 0;
  let buffer = '';
  let fullResponse = '';
  let streamConversationId: string | null = payload.conversationId;

  const processSSEChunk = (chunk: string) => {
    const lines = chunk.split('\n');
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, '');
      if (!line || line.startsWith(':')) continue;
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;

    let data: any = null;
    try {
      data = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }

    if (eventName === 'start') {
      if (data?.conversationId) {
        streamConversationId = data.conversationId;
        callbacks.onStart?.(streamConversationId);
      }
      return;
    }
    if (eventName === 'token') {
      const token_ = data?.token || '';
      if (!token_) return;
      fullResponse += token_;
      callbacks.onToken?.(token_, fullResponse);
      return;
    }
    if (eventName === 'done') {
      const final = data?.response || fullResponse;
      fullResponse = final || fullResponse;
      if (data?.conversationId) streamConversationId = data.conversationId;
      callbacks.onDone?.(fullResponse, streamConversationId);
      return;
    }
    if (eventName === 'error') {
      callbacks.onError?.(data?.error || data?.details || 'Streaming request failed.');
    }
  };

  const drain = () => {
    const text = xhr.responseText || '';
    const chunk = text.slice(lastLength);
    lastLength = text.length;
    buffer += chunk;
    let idx = buffer.indexOf('\n\n');
    while (idx !== -1) {
      processSSEChunk(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 2);
      idx = buffer.indexOf('\n\n');
    }
  };

  xhr.open('POST', `${API_BASE_URL}${API_PREFIX}${AI_ENDPOINTS.GENERATE_STREAM}`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  xhr.onprogress = drain;
  xhr.onload = () => {
    drain();
    if (buffer.trim()) processSSEChunk(buffer.trim());
    if (xhr.status < 200 || xhr.status >= 300) {
      // Same status-specific copy as webSrc's `generateContent` (`ai-assist/page.tsx:608-614`).
      const STATUS_MESSAGES: Record<number, string> = {
        401: 'Authentication failed. Please log in again.',
        403: 'Access denied. Please verify your account.',
        429: 'Rate limit exceeded. Please try again later.',
        503: 'AI service temporarily unavailable. Please try again later.',
      };
      let serverMessage: string | undefined;
      try {
        serverMessage = JSON.parse(xhr.responseText || '{}')?.error;
      } catch {
        // Non-JSON error body — fall through to the generic message below.
      }
      callbacks.onError?.(
        STATUS_MESSAGES[xhr.status] || serverMessage || `Request failed: ${xhr.status} ${xhr.statusText}`,
      );
      return;
    }
    if (!fullResponse.trim()) callbacks.onError?.('Empty AI response');
  };
  xhr.onerror = () => callbacks.onError?.('Network error — please try again.');
  xhr.onabort = () => {
    // Caller-initiated cancellation — not an error state.
  };

  xhr.send(JSON.stringify(payload));

  return { abort: () => xhr.abort() };
}
