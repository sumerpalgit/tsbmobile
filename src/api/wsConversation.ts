import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_HTTP_URL } from '@env';

/**
 * Registers/unregisters this device's socket into a conversation's broadcast room on the
 * separate WS/chat-notification server (`WS_HTTP_URL`) — a DIFFERENT server than the main REST
 * backend `apiClient` talks to, matching web's own `actions/eta-conversation.ts` (which calls this
 * same pair of routes as a Server Action specifically to sidestep CORS; mobile has no such
 * restriction, so this just calls it directly).
 *
 * This was the actual root cause of "a message sent from web never arrives live on mobile" for
 * both ETA group chat and DMs: web calls `conversation-init` whenever a conversation/chapter is
 * opened (`useEffect` keyed on `selectedGroup`/`selectedConversationId` in
 * `my-eta-chapters/page.tsx` and `messages/page.tsx`), which is how the WS server knows to
 * broadcast that conversation's `NEW_MESSAGE` events to this socket at all — group broadcasts
 * are room-scoped, not blasted to every connected socket. Mobile never called this, so its socket
 * never joined any room and silently received nothing for a conversation, regardless of who sent
 * the message (confirmed via diagnostic logging: not even a raw, unfiltered socket event arrived).
 *
 * Fire-and-forget by design, matching web's own try/catch around this same call ("WS HTTP server
 * unavailable — real-time delivery unaffected") — a failed register/unregister call shouldn't
 * block opening or leaving a chat.
 */
async function callConversationRoute(path: '/chat/conversation-init' | '/chat/conversation-leave', conversationId: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;
    await axios.post(
      `${WS_HTTP_URL}${path}`,
      { conversationId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    // WS HTTP server unavailable — real-time delivery unaffected, matches web.
  }
}

export function initConversation(conversationId: string): Promise<void> {
  return callConversationRoute('/chat/conversation-init', conversationId);
}

export function leaveConversation(conversationId: string): Promise<void> {
  return callConversationRoute('/chat/conversation-leave', conversationId);
}
