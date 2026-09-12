import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { GlassPanel } from '@/components/GlassPanel';
import { InputField } from '@/components/InputField';
import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getNationalIdStatus, submitNationalId } from '@/services/nationalIdService';

/** Feature 5 — National Digital ID: submit an NRC number and track verification. */
export function NationalIdView() {
  const [number, setNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { data, loading, reload } = useAsyncData(() => getNationalIdStatus());

  async function submit() {
    if (!number.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await submitNationalId(number.trim());
      setNumber('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit National ID.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !data) return <LoadingState />;

  if (data?.verified) {
    const masked = data.nationalIdNumber
      ? `${data.nationalIdNumber.slice(0, 3)}****`
      : '';
    return (
      <GlassPanel borderRadius={22} contentStyle={styles.panel}>
        <EmptyState
          icon="checkmark-circle-outline"
          title="National ID verified"
          message={`Your Digital ID is verified${masked ? ` (NRC ${masked})` : ''}. It powers your verified profile and eligibility for financial services.`}
        />
      </GlassPanel>
    );
  }

  const hasSubmitted = Boolean(data?.nationalIdNumber);

  return (
    <>
      {hasSubmitted ? (
        <GlassPanel borderRadius={22} contentStyle={styles.panel}>
          <Text style={styles.statusTitle}>Under verification</Text>
          <Text style={styles.statusBody}>
            Your National ID was submitted and is being verified. This usually takes a short
            while — come back to check the status.
          </Text>
        </GlassPanel>
      ) : (
        <Text style={styles.intro}>
          Link your National Registration Card (NRC) to build a verified digital identity on
          ServiceHub.
        </Text>
      )}
      <GlassPanel borderRadius={22} contentStyle={styles.panel}>
        <InputField
          label="NRC number"
          value={number}
          onChangeText={setNumber}
          placeholder="e.g. 12345670/11/1"
          icon="card-outline"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={hasSubmitted ? 'Update National ID' : 'Submit National ID'}
          onPress={submit}
          loading={submitting}
          disabled={!number.trim()}
        />
      </GlassPanel>
    </>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 18, gap: 12 },
  intro: { color: Colors.textMuted, fontSize: FontSize.md, lineHeight: 22, marginVertical: 6 },
  statusTitle: { color: Colors.warning, fontSize: FontSize.lg, fontWeight: '800' },
  statusBody: { color: Colors.textMuted, fontSize: FontSize.md, lineHeight: 22 },
  error: { color: Colors.error, fontSize: FontSize.sm },
});