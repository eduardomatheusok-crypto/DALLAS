export interface ChatMessage {
  id: string;
  userId?: string;
  authorName: string;
  text: string;
  isSystem: boolean;
  sentAt: string;
}