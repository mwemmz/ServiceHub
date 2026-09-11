import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { initializePayment, verifyPayment } from '@/services/paymentService';

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [method, setMethod] = useState('mobile_money');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ref, setRef] = useState('');

  async function pay() {
    if (!bookingId || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await initializePayment(bookingId, method);
      if (result.transactionRef) setRef(result.transactionRef);
      if (result.paymentUrl) {
        await Linking.openURL(result.paymentUrl);
      } else {
        setError('Payment initialized. No gateway URL returned yet — verify when ready.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment.');
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!ref || loading) {
      if (!ref) setError('No transaction reference to verify.');
      return;
    }
    setLoading(true);
    try {
      await verifyPayment(ref);
      router.replace(`/(customer)/booking/${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Payment" subtitle="Pay for your completed booking." />
      <View style={styles.card}>
        <Text style={styles.label}>Method</Text>
        {(['mobile_money', 'card', 'cash'] as const).map((item) => (
          <SecondaryButton
            key={item}
            label={item.replace('_', ' ')}
            onPress={() => setMethod(item)}
            style={method === item ? styles.selected : undefined}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {ref ? <Text style={styles.ref}>Ref: {ref}</Text> : null}
      <PrimaryButton label="Initialize payment" onPress={pay} loading={loading} />
      <SecondaryButton label="Verify payment" onPress={confirm} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, gap: 10, marginVertical: 12 },
  label: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  selected: { borderColor: Colors.accent, borderWidth: 2 },
  error: { color: Colors.error, marginBottom: 8 },
  ref: { color: Colors.textMuted, marginBottom: 8 },
});
