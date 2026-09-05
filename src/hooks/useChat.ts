import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService } from '../services';
import type { ChatMessage } from '../models';

/**
 * Carrega as mensagens mais recentes e envia novas. As mensagens novas do
 * próprio usuário são espelhadas localmente para dar resposta imediata; na
 * próxima leitura o servidor entrega a fonte da verdade.
 */
export function useChat(groupId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const refreshing = useRef(false);

  const reload = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setLoading(true);
    try {
      const list = await chatService.list(groupId);
      setMessages(list);
    } catch (e) {
      // mantém o que já estava carregado
    } finally {
      setLoading(false);
      refreshing.current = false;
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || sending) return false;
      setSending(true);
      try {
        const sent = await chatService.send(groupId, trimmed);
        setMessages((prev) => [...prev, sent]);
        return true;
      } catch (e) {
        return false;
      } finally {
        setSending(false);
      }
    },
    [groupId, sending],
  );

  return { messages, loading, sending, reload, send };
}