import { getStoredMessages, saveMessages } from '@/services/localDb';
import { createId } from '@/utils/id';
import { api } from '@/services/apiClient';
import { getJson, setJson, StorageKeys } from '@/services/storage';
import type { ChatMessage } from '@/types';

interface ApiMessage {
  id?: string;
  sender_id?: string;
  text?: string;
  created_at?: string;
  createdAt?: string;
}

interface ApiConversationResult {
  conversation?: { id?: string };
  booking_id?: string;
}

interface ApiSendResult extends ApiMessage {
  message?: ApiMessage;
}

const conversationCache = new Map<string, string>();

async function getOrCreateConversationId(bookingId: string): Promise<string | null> {
  const cached = conversationCache.get(bookingId);
  if (cached) return cached;

  // Persisted map survives app restarts without another create call.
  const stored = await getJson<Record<string, string>>(StorageKeys.conversations);
  if (stored?.[bookingId]) {
    conversationCache.set(bookingId, stored[bookingId]);
    return stored[bookingId];
  }

  try {
    const data = await api.get<ApiConversationResult>(`/conversations/booking/${bookingId}`);
    const conversationId = data?.conversation?.id;
    if (conversationId) {
      conversationCache.set(bookingId, conversationId);
      await setJson(StorageKeys.conversations, { ...(stored ?? {}), [bookingId]: conversationId });
      return conversationId;
    }
  } catch {
    // offline / local-mock bookings fall back to the local store below.
  }
  return null;
}

function mapMessage(item: ApiMessage, bookingId: string): ChatMessage {
  return {
    id: item.id ?? createId('msg'),
    bookingId,
    senderId: item.sender_id ?? '',
    text: item.text ?? '',
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
  };
}

export async function getMessages(bookingId: string): Promise<ChatMessage[]> {
  const conversationId = await getOrCreateConversationId(bookingId);
  if (conversationId) {
    try {
      const data = await api.get<{ messages?: ApiMessage[] } | ApiMessage[]>(
        `/conversations/${conversationId}/messages`,
      );
      const list = Array.isArray(data) ? data : data.messages ?? [];
      if (list.length > 0) return list.map((item) => mapMessage(item, bookingId));
    } catch {
      // fall through to local
    }
  }

  const items = await getStoredMessages();
  return items
    .filter((item) => item.bookingId === bookingId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export async function sendMessage(bookingId: string, senderId: string, text: string): Promise<ChatMessage> {
  const trimmed = text.trim();
  const conversationId = await getOrCreateConversationId(bookingId);
  if (conversationId) {
    try {
      const data = await api.post<ApiSendResult>(`/conversations/${conversationId}/messages`, { text: trimmed });
      const created = data.message ?? data;
      if (created?.id) {
        const message = mapMessage(created, bookingId);
        const items = await getStoredMessages();
        await saveMessages([...items, message]);
        return message;
      }
    } catch {
      // fall through to local
    }
  }

  const message: ChatMessage = {
    id: createId('msg'),
    bookingId,
    senderId,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
  const items = await getStoredMessages();
  await saveMessages([...items, message]);
  return message;
}