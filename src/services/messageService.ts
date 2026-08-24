import { getStoredMessages, saveMessages } from '@/services/localDb';
import { createId } from '@/utils/id';
import type { ChatMessage } from '@/types';

export async function getMessages(bookingId: string): Promise<ChatMessage[]> {
  const items = await getStoredMessages();
  return items
    .filter((item) => item.bookingId === bookingId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export async function sendMessage(bookingId: string, senderId: string, text: string): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: createId('msg'),
    bookingId,
    senderId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  const items = await getStoredMessages();
  await saveMessages([...items, message]);
  return message;
}
