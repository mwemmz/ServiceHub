import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMessages, sendMessage } from '@/services/messageService';
import { formatTime } from '@/utils/format';

export default function ChatScreen() {
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [text, setText] = useState('');
  const { data, loading, reload } = useAsyncData(() => getMessages(bookingId), [bookingId]);

  async function send() {
    if (!text.trim() || !user) return;
    await sendMessage(bookingId, user.id, text);
    setText('');
    reload();
  }

  if (loading && !data) return <LoadingState />;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader title="Chat" subtitle="Local messages only until a realtime backend is connected." />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.msg, mine && styles.mineText]}>{item.text}</Text>
                <Text style={[styles.time, mine && styles.mineText]}>{formatTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <View style={{ flex: 1 }}>
            <InputField value={text} onChangeText={setText} placeholder="Write a message" />
          </View>
          <PrimaryButton label="Send" onPress={send} style={{ alignSelf: 'flex-end', minHeight: 54, paddingHorizontal: 16 }} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 8, paddingBottom: 24 },
  bubble: { maxWidth: '80%', borderRadius: Radii.lg, padding: 12 },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.accent },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface },
  msg: { color: Colors.charcoal },
  mineText: { color: '#FFFFFF' },
  time: { fontSize: FontSize.xs, marginTop: 4, color: Colors.textMuted },
  composer: { flexDirection: 'row', gap: 8, padding: 16, alignItems: 'flex-end' },
});
