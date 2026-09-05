import { groupsApi, ensureApiOnline } from '../api';
import type { ChatMessage } from '../models';

export class ChatService {
  async list(groupId: string, before?: string, limit?: number): Promise<ChatMessage[]> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para ver o chat.');
    }
    return groupsApi.messages(groupId, before, limit);
  }

  async send(groupId: string, text: string): Promise<ChatMessage> {
    if (!(await ensureApiOnline())) {
      throw new Error('Conecte-se à internet para enviar mensagens.');
    }
    return groupsApi.sendMessage(groupId, text);
  }
}

export const chatService = new ChatService();