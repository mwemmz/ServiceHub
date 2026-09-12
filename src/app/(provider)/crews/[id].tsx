import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBackendProviderDirectory, type BackendProviderEntry } from '@/services/backendProviders';
import { addCrewMember, getCrewById, removeCrewMember } from '@/services/crewService';

export default function CrewDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [crew, directory] = await Promise.all([getCrewById(id), getBackendProviderDirectory()]);
      return { crew, directory };
    },
    [id],
  );

  async function addMember(entry: BackendProviderEntry) {
    try {
      await addCrewMember(id, entry.providerId);
      reload();
    } catch {
      // leave list as-is
    }
  }

  async function removeMember(memberProviderId: string) {
    try {
      await removeCrewMember(id, memberProviderId);
      reload();
    } catch {
      // leave list as-is
    }
  }

  if (loading && !data) return <LoadingState />;
  if (error || !data?.crew) return <ErrorState message={error ?? 'Crew not found.'} onRetry={reload} />;

  const { crew, directory } = data;
  const memberIds = new Set(crew.members.map((member) => member.memberId));
  const available = directory.filter(
    (entry) => entry.providerId !== crew.leaderId && !memberIds.has(entry.providerId),
  );

  return (
    <Screen>
      <ScreenHeader title={crew.name} subtitle="Crew members" />
      <Text style={styles.meta}>
        {crew.members.length} member{crew.members.length === 1 ? '' : 's'}
      </Text>
      {crew.members.length === 0 ? (
        <Text style={styles.meta}>No members yet — add trusted providers below.</Text>
      ) : (
        <View style={styles.list}>
          {crew.members.map((member) => (
            <GlassPanel key={member.memberId} borderRadius={18} contentStyle={styles.memberCard}>
              <View style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={18} color={Colors.accent} />
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Pressable hitSlop={10} onPress={() => removeMember(member.memberId)}>
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </Pressable>
              </View>
            </GlassPanel>
          ))}
        </View>
      )}
      {available.length > 0 ? (
        <GlassPanel borderRadius={22} contentStyle={styles.addPanel}>
          <Text style={styles.sectionTitle}>Add a provider</Text>
          {available.map((entry) => (
            <View key={entry.providerId} style={styles.addRow}>
              <Text style={styles.candidateName} numberOfLines={1}>
                {entry.name}
              </Text>
              <SecondaryButton label="Add" onPress={() => void addMember(entry)} style={styles.addButton} />
            </View>
          ))}
        </GlassPanel>
      ) : null}
      <SecondaryButton
        label="Back to crews"
        onPress={() => router.back()}
        style={styles.back}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { color: Colors.textMuted, fontSize: FontSize.md, marginBottom: 10 },
  list: { gap: 10, marginVertical: 6 },
  memberCard: { padding: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { flex: 1, color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700' },
  addPanel: { padding: 18, gap: 12, marginTop: 16 },
  sectionTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  candidateName: { flex: 1, color: Colors.textMuted, fontSize: FontSize.md },
  addButton: { minHeight: 40, marginTop: 0 },
  back: { marginTop: 20 },
});