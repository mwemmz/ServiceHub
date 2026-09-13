import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { InputField } from '@/components/InputField';
import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { confirmEndorsement, declineEndorsement, getPendingEndorsements } from '@/services/endorsementService';
import { formatDateTime, formatKwacha } from '@/utils/format';

/**
 * Peer verification (spec rule 7): a DIFFERENT worker vouches for a job so it
 * counts as confirmed work history and feeds the worker's rating.
 */
export default function ProviderEndorsementsScreen() {
  const { data, loading, error, reload } = useAsyncData(getPendingEndorsements, []);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState('');
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const endorsements = data ?? [];

  async function onConfirm(id: string) {
    if (busyId) return;
    setBusyId(id);
    setErrorText('');
    try {
      await confirmEndorsement(id, noteById[id]?.trim() || undefined);
      await reload();
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not confirm. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function onDeclineConfirmed() {
    if (!declineTarget || busyId) return;
    setBusyId(declineTarget);
    setErrorText('');
    try {
      await declineEndorsement(declineTarget);
      await reload();
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not decline. Please try again.');
    } finally {
      setBusyId(null);
      setDeclineTarget(null);
    }
  }

  function setNote(id: string, value: string) {
    setNoteById((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Verify jobs"
        subtitle="Fellow workers asked you to vouch that their jobs really happened. This is the anti-fraud proof that makes work history trustworthy."
      />

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      {endorsements.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="Nothing to verify"
          message="When a fellow worker asks you to confirm one of their completed jobs, it appears here. Honest confirmations protect the whole marketplace."
        />
      ) : (
        <View style={styles.list}>
          {endorsements.map((item) => (
            <GlassPanel key={item.id} borderRadius={18} contentStyle={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.serviceName}</Text>
                  <Text style={styles.cardMeta}>{item.requester} asked you to verify</Text>
                  <Text style={styles.cardMeta}>
                    {formatDateTime(item.scheduledAt)}
                  </Text>
                  <Text style={styles.cardMeta}>Customer: {item.customerName}</Text>
                </View>
                <Text style={styles.cardAmount}>{formatKwacha(item.amount)}</Text>
              </View>

              <InputField
                label="Any notes? (optional)"
                value={noteById[item.id] ?? ''}
                onChangeText={(value) => setNote(item.id, value)}
                placeholder="e.g. I was there — this job happened."
                multiline
              />

              <View style={styles.actions}>
                <PrimaryButton
                  label="Confirm — yes, this job happened"
                  variant="blue"
                  loading={busyId === item.id}
                  disabled={busyId !== null}
                  onPress={() => void onConfirm(item.id)}
                />
                <SecondaryButton
                  label="Decline"
                  disabled={busyId !== null}
                  onPress={() => setDeclineTarget(item.id)}
                />
              </View>
            </GlassPanel>
          ))}
        </View>
      )}

      <ConfirmDialog
        visible={declineTarget !== null}
        title="Decline this verification?"
        message="Only confirm jobs you genuinely know happened. Declining tells the worker the job could not be verified."
        confirmLabel="Decline"
        cancelLabel="Never mind"
        loading={busyId === declineTarget}
        onConfirm={() => void onDeclineConfirmed()}
        onCancel={() => setDeclineTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, marginVertical: 6 },
  card: { padding: 14, gap: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  cardMeta: { color: Colors.textMuted, fontSize: FontSize.sm },
  cardAmount: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  error: { color: Colors.error, fontSize: FontSize.sm, marginBottom: 10 },
});