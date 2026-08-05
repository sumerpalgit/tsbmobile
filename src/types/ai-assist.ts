/**
 * AI Assist — types matching webSrc's own interfaces at the top of
 * `webSrc/src/app/dashboard/ai-assist/page.tsx` exactly, so a value can always be traced back to
 * the web source. See `src/api/ai-assist.ts` for which endpoint returns which shape.
 */

/** One transcript entry rendered on screen. Distinct from `ConversationMessage` (the raw backend
 * row) — `id` here may be a locally-generated placeholder (e.g. `${Date.now()}-ai`) while a
 * streaming reply is still in flight, before the backend has assigned a real message id. */
export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  is_saved?: boolean;
  share_token?: string | null;
};

/** Raw row from `GET /ai/conversations/:id/messages`. */
export type ConversationMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  message_type: 'user' | 'assistant';
  content: string;
  created_at: string;
  message_order: number;
  reaction?: string | null;
};

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasMore: boolean;
};

export type MessageReaction = 'like' | 'dislike';

/** `PROMPT_LIBRARY` entries — business content ported verbatim from web, not UI, so category ids
 * are shared between the filter-tab logic and the card list. */
export type PromptLibraryEntry = {
  cat: string;
  label: string;
  text: string;
  desc: string;
};

export type PromptCategory = {
  id: string;
  label: string;
};
