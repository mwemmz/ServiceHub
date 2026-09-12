import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingById } from '@/services/bookingService';
import { submitDispute } from '@/services/disputeService';
import type { DisputeType } from '@/types';

const TYPE_OPTIONS: { value: DisputeType; label: string }[] = [
  { value: 'dispute', label: 'Dispute' },
  { value: 'safety', label: 'Safety report' },
];

export default function FileDisputeScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [type, setType] = useState<DisputeType>('dispute');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { data: booking } = useAsyncData(() => getBookingById(bookingId), [bookingId]);

  async function submit() {
    if (!booking || !reason.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await submitDispute({
        bookingId: booking.id,
        type,
        reason: reason.trim(),
        description: description.trim(),
      });
      router.replace('/(customer)/reports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Report a problem" subtitle="File a dispute or a safety report about this booking." />
      <Text style={styles.intro}>
        Our support team reviews every report. Safety reports are prioritised.
      </Text>
      <View style={styles.toggle}>
        {TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.toggleItem, type === option.value && styles.toggleActive]}
            onPress={() => setType(option.value)}>
            <Text style={[styles.toggleLabel, type === option.value && styles.toggleLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <InputField
        label="Reason"
        value={reason}
        onChangeText={setReason}
        placeholder="Briefly describe what went wrong"
        icon="chatbubble-outline"
      />
      <InputField
        label="Details (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Add more detail for our team"
        multiline
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        label={type === 'safety' ? 'Submit safety report' : 'Submit dispute'}
        onPress={submit}
        loading={submitting}
        disabled={!reason.trim()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: Colors.textMuted, fontSize: FontSize.md, lineHeight: 22, marginVertical: 6 },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginVertical: 10,
  },
  toggleItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.accentSoft },
  toggleLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
  toggleLabelActive: { color: Colors.accent },
  error: { color: Colors.error, fontSize: FontSize.sm },
});