import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { InputField } from '@/components/InputField';
import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createCrew, deleteCrew, getMyCrews } from '@/services/crewService';
import type { Crew } from '@/types';
import { formatDate } from '@/utils/format';

export default function CrewsScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Crew | null>(null);
  const { data, loading, error, reload } = useAsyncData(() => getMyCrews());

  async function create() {
    if (!name.trim() || creating) return;
    setCreating(true);
    setFormError('');
    try {
      const crew = await createCrew(name.trim());
      setName('');
      router.push(`/(provider)/crews/${crew.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create crew.');
      reload();
    } finally {
      setCreating(false);
    }
  }

  function confirmDelete(crew: Crew) {
    setPendingDelete(crew);
  }

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  return (
    <Screen>
      <ScreenHeader title="My crews" subtitle="Booking a crew lets a whole team take on bigger jobs." />
      {data && data.length > 0 ? (
        <View style={styles.list}>
          {data.map((crew) => (
            <GlassPanel key={crew.id} borderRadius={18} contentStyle={styles.card}>
              <Pressable style={styles.cardMain} onPress={() => router.push(`/(provider)/crews/${crew.id}`)}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{crew.name}</Text>
                  <Text style={styles.cardMeta}>
                    {crew.members.length} member{crew.members.length === 1 ? '' : 's'} · created{' '}
                    {formatDate(crew.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
              </Pressable>
              <View style={styles.cardFooter}>
                <Pressable onPress={() => router.push(`/(provider)/crews/${crew.id}`)} hitSlop={8}>
                  <Text style={styles.link}>Manage</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(crew)} hitSlop={8}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </View>
            </GlassPanel>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="people-outline"
          title="No crews yet"
          message="Create a crew of trusted providers so customers can book your whole team at once."
        />
      )}
      <GlassPanel borderRadius={22} contentStyle={styles.form}>
        <Text style={styles.formTitle}>Create a crew</Text>
        <InputField
          label="Crew name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bwafwano Handy Team"
          icon="people-outline"
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <PrimaryButton label="Create crew" onPress={create} loading={creating} disabled={!name.trim()} />
      </GlassPanel>
      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete crew?"
        message={pendingDelete ? `"${pendingDelete.name}" and its memberships will be removed.` : ''}
        confirmLabel="Delete"
        cancelLabel="Keep"
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteCrew(pendingDelete.id);
            reload();
          } catch {
            // leave list as-is
          } finally {
            setPendingDelete(null);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginVertical: 14 },
  card: { padding: 14, gap: 8 },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  cardMeta: { color: Colors.textMuted, fontSize: FontSize.sm },
  cardFooter: { flexDirection: 'row', gap: 18 },
  link: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },
  delete: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '700' },
  form: { padding: 18, gap: 12, marginTop: 8 },
  formTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  error: { color: Colors.error, fontSize: FontSize.sm },
});