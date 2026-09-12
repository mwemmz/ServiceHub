import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { InputField } from '@/components/InputField';
import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  addCertification,
  deleteCertification,
  getMyCertifications,
} from '@/services/certificationService';
import type { Certification } from '@/types';
import { formatDate } from '@/utils/format';

export default function CertificationsScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { data, loading, error, reload } = useAsyncData(
    () => getMyCertifications(user!.id),
    [user?.id],
  );

  async function submit() {
    if (!name.trim() || !issuingBody.trim() || submitting) return;
    setSubmitting(true);
    setFormError('');
    try {
      await addCertification({
        name: name.trim(),
        issuingBody: issuingBody.trim(),
        expiryDate: expiryDate.trim() ? expiryDate.trim() : undefined,
      });
      setName('');
      setIssuingBody('');
      setExpiryDate('');
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add certification.');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete(cert: Certification) {
    Alert.alert('Remove certification?', `"${cert.name}" will be removed from your skills passport.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCertification(cert.id);
            reload();
          } catch {
            // leave list as-is if the delete fails
          }
        },
      },
    ]);
  }

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <Screen>
      <ScreenHeader title="Skills passport" subtitle="Backed-up certifications build verified trust with customers." />
      {data && data.length > 0 ? (
        <View style={styles.list}>
          {data.map((cert) => (
            <GlassPanel key={cert.id} borderRadius={18} contentStyle={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{cert.name}</Text>
                  <Text style={styles.cardMeta}>{cert.issuingBody}</Text>
                  <Text style={styles.cardMeta}>
                    {cert.expiryDate ? `Expires ${formatDate(cert.expiryDate)}` : 'No expiry'}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  {cert.isVerified ? (
                    <View style={styles.verified}>
                      <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <Text style={styles.pendingText}>Pending</Text>
                  )}
                  <Pressable hitSlop={10} onPress={() => confirmDelete(cert)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            </GlassPanel>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="ribbon-outline"
          title="No certifications yet"
          message="Add qualifications from recognised training bodies to build your verified skills passport."
        />
      )}
      <GlassPanel borderRadius={22} contentStyle={styles.form}>
        <Text style={styles.formTitle}>Add certification</Text>
        <InputField
          label="Certification name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. NAPSA plumbing level 3"
          icon="ribbon-outline"
        />
        <InputField
          label="Issuing body"
          value={issuingBody}
          onChangeText={setIssuingBody}
          placeholder="e.g. TEVETA"
          icon="business-outline"
        />
        <InputField
          label="Expiry date (optional)"
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="YYYY-MM-DD"
          icon="calendar-outline"
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <PrimaryButton
          label="Add certification"
          onPress={submit}
          loading={submitting}
          disabled={!name.trim() || !issuingBody.trim()}
        />
      </GlassPanel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginVertical: 14 },
  card: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  cardMeta: { color: Colors.textMuted, fontSize: FontSize.sm },
  cardActions: { alignItems: 'flex-end', gap: 10 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '700' },
  pendingText: { color: Colors.warning, fontSize: FontSize.xs, fontWeight: '700' },
  form: { padding: 18, gap: 12, marginTop: 8 },
  formTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  error: { color: Colors.error, fontSize: FontSize.sm },
});