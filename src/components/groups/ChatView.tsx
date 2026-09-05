import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { Icon } from '../../theme/icons';
import { formatTime } from '../../services';
import { useChat } from '../../hooks';
import type { ChatMessage } from '../../models';

function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  if (message.isSystem) {
    return (
      <View style={styles.systemWrap}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : null]}>
      {!mine ? <Text style={styles.author}>{message.authorName}</Text> : null}
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
        ]}
      >
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.text}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(message.sentAt)}</Text>
      </View>
    </View>
  );
}

export default function ChatView({ groupId, myUserId }: { groupId: string; myUserId?: string }) {
  const { messages, sending, send } = useChat(groupId);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);

  const data = [...messages].reverse();

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    const ok = await send(text);
    if (ok) {
      setDraft('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={data}
        inverted
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} mine={!!myUserId && item.userId === myUserId} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sem mensagens por aqui ainda.</Text>
          </View>
        }
      />
      <View style={styles.composer}>
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder="Mensagem para o grupo..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={sending || !draft.trim()}
          style={({ pressed }) => [
            styles.send,
            (sending || !draft.trim()) && styles.sendDisabled,
            pressed && styles.sendPressed,
          ]}
        >
          <Icon name="send" size="sm" color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  systemWrap: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginVertical: 4,
    maxWidth: '85%',
  },
  systemText: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  bubbleRow: {
    alignItems: 'flex-start',
  },
  bubbleRowMine: {
    alignItems: 'flex-end',
  },
  author: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: spacing.sm + 2,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: 'rgba(229, 9, 20, 0.22)',
    borderBottomRightRadius: borderRadius.xs,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomLeftRadius: borderRadius.xs,
  },
  bubbleText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  time: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  timeMine: {
    color: 'rgba(255,255,255,0.55)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 110,
    fontSize: 14,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendPressed: {
    opacity: 0.85,
  },
});