import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { BookingCard } from '@/components/BookingCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingsForUser, isActiveStatus } from '@/services/bookingService';
import { setProviderOnline } from '@/services/providerService';
import { getService } from '@/services/catalogService';
import { getUsers } from '@/services/localDb';
import {
  getProviderApplicationForUser,
  type ProviderApplication,
} from '@/services/providerApplicationService';
import { firstName, formatKwacha, greetingForNow } from '@/utils/format';

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, providerProfile, refresh } = useAuth();
  const [application, setApplication] = useState<ProviderApplication | null>(null);

  useEffect(() => {
    if (!user) return;
    getProviderApplicationForUser(user.id).then(setApplication).catch(() => setApplication(null));
  }, [user?.id]);

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [bookings, users] = await Promise.all([
      getBookingsForUser(user!.id, 'provider'),
      getUsers(),
    ]);
    const decorated = await Promise.all(
      bookings.map(async (booking) => ({
        booking,
        serviceName: (await getService(booking.serviceId))?.name,
        counterpartName: users.find((item) => item.id === booking.customerId)?.fullName,
      })),
    );
    return decorated;
  }, [user?.id]);

  if (loading && !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <LoadingState />
      </AppShell>
    );
  }
  if (error || !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <ErrorState message={error ?? undefined} onRetry={reload} />
      </AppShell>
    );
  }

  const requests = data.filter((item) => item.booking.status === 'waiting_for_provider');
  const active = data.filter(
    (item) =>
      isActiveStatus(item.booking.status) && item.booking.status !== 'waiting_for_provider',
  );
  const today = new Date().toDateString();
  const todaysJobs = data.filter(
    (item) => new Date(item.booking.scheduledAt).toDateString() === today,
  );

  const registeredServices = application?.services ?? [];
  const pending = application?.status === 'pending';

  return (
    <AppShell edges={['top']}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>
            {greetingForNow()}, {firstName(user?.fullName ?? '')}
          </Text>
          <Text style={styles.sub}>
            {application?.location.text ||
              providerProfile?.serviceArea ||
              'Your provider dashboard'}
          </Text>
        </View>
        <Avatar
          name={user?.fullName ?? 'You'}
          uri={application?.identity.faceUri || user?.avatarUri}
          size={48}
        />
      </View>

      {pending ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingTitle}>Verification in progress</Text>
          <Text style={styles.pendingBody}>
            Your provider profile is being reviewed. You can explore the dashboard while you wait.
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.online, providerProfile?.isOnline && styles.onlineOn]}
        onPress={async () => {
          if (!user) return;
          await setProviderOnline(user.id, !providerProfile?.isOnline);
          await refresh();
        }}>
        <Text style={[styles.onlineText, providerProfile?.isOnline && styles.onlineTextOn]}>
          {providerProfile?.isOnline ? 'Online — receiving requests' : 'Go Online'}
        </Text>
      </Pressable>

      <View style={styles.stats}>
        <Stat
          label="Requests"
          value={String(requests.length)}
          onPress={() => router.push('/(provider)/(tabs)/requests')}
        />
        <Stat
          label="Active jobs"
          value={String(active.length)}
          onPress={() => router.push('/(provider)/(tabs)/jobs')}
        />
        <Stat label="This week" value={formatKwacha(providerProfile?.earningsThisWeek ?? 0)} />
      </View>

      <Text style={styles.section}>Your services</Text>
      {registeredServices.length === 0 ? (
        <Pressable style={styles.linkCard} onPress={() => router.push('/(provider)/services')}>
          <Text style={styles.linkTitle}>Add or manage services</Text>
        </Pressable>
      ) : (
        <View style={styles.serviceStack}>
          {registeredServices.map((svc) => (
            <View key={svc.serviceName} style={styles.serviceCard}>
              <Text style={styles.serviceName}>{svc.serviceName}</Text>
              <Text style={styles.serviceMeta}>
                K{svc.startingPrice}+ · {svc.yearsExperience} yrs · {svc.days.length} days/week
              </Text>
              {svc.description ? (
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {svc.description}
                </Text>
              ) : null}
            </View>
          ))}
          <Pressable style={styles.linkCard} onPress={() => router.push('/(provider)/services')}>
            <Text style={styles.linkTitle}>Manage services & prices</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.linkCard} onPress={() => router.push('/(provider)/availability')}>
        <Text style={styles.linkTitle}>Manage availability</Text>
      </Pressable>

      <Text style={styles.section}>Today&apos;s jobs</Text>
      {todaysJobs.length === 0 ? (
        <Text style={styles.sub}>No jobs scheduled for today.</Text>
      ) : (
        todaysJobs.map((item) => (
          <BookingCard
            key={item.booking.id}
            booking={item.booking}
            serviceName={item.serviceName}
            counterpartName={item.counterpartName}
            onPress={() => router.push(`/(provider)/job/${item.booking.id}`)}
          />
        ))
      )}
    </AppShell>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.whiteSoft },
  pendingBanner: {
    backgroundColor: 'rgba(232,197,106,0.22)',
    borderRadius: Radii.lg,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pendingTitle: { color: Colors.warning, fontWeight: '800' },
  pendingBody: { color: Colors.whiteSoft, lineHeight: 18, fontSize: FontSize.sm },
  online: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  onlineOn: { backgroundColor: 'rgba(125,219,176,0.22)' },
  onlineText: { color: Colors.charcoal, fontWeight: '800' },
  onlineTextOn: { color: Colors.success },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  statLabel: { color: Colors.whiteSoft, marginTop: 4, fontSize: FontSize.xs },
  section: {
    color: Colors.charcoal,
    fontWeight: '800',
    fontSize: FontSize.lg,
    marginTop: 8,
  },
  linkCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkTitle: { color: Colors.charcoal, fontWeight: '700' },
  serviceStack: { gap: 8 },
  serviceCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.lg,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceName: { color: Colors.charcoal, fontWeight: '800' },
  serviceMeta: { color: Colors.accent, fontWeight: '700', fontSize: FontSize.sm },
  serviceDesc: { color: Colors.whiteSoft, fontSize: FontSize.sm, lineHeight: 18 },
});
