import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { BookingCard } from '@/components/BookingCard';
import { GlassPanel } from '@/components/GlassPanel';
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
  serviceDisplayPrice,
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
        <GlassPanel borderRadius={Radii.lg} contentStyle={styles.pendingBanner}>
          <Text style={styles.pendingTitle}>Verification in progress</Text>
          <Text style={styles.pendingBody}>
            Your provider profile is being reviewed. You can explore the dashboard while you wait.
          </Text>
        </GlassPanel>
      ) : null}

      <Pressable
        onPress={async () => {
          if (!user) return;
          await setProviderOnline(user.id, !providerProfile?.isOnline);
          await refresh();
        }}>
        <GlassPanel
          borderRadius={Radii.lg}
          style={providerProfile?.isOnline ? styles.onlineOn : undefined}
          contentStyle={styles.online}>
          <Text style={[styles.onlineText, providerProfile?.isOnline && styles.onlineTextOn]}>
            {providerProfile?.isOnline ? 'Online — receiving requests' : 'Go Online'}
          </Text>
        </GlassPanel>
      </Pressable>

      <GlassPanel borderRadius={Radii.lg} contentStyle={styles.stats}>
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
      </GlassPanel>

      <Text style={styles.section}>Your services</Text>
      {registeredServices.length === 0 ? (
        <Pressable onPress={() => router.push('/(provider)/services')}>
          <GlassPanel borderRadius={Radii.lg} contentStyle={styles.linkCard}>
            <Text style={styles.linkTitle}>Add or manage services</Text>
          </GlassPanel>
        </Pressable>
      ) : (
        <View style={styles.serviceStack}>
          {registeredServices.map((svc) => (
            <GlassPanel
              key={svc.serviceId || svc.serviceName}
              borderRadius={Radii.lg}
              contentStyle={styles.serviceCard}>
              <Text style={styles.serviceGroup}>{svc.groupTitle}</Text>
              <Text style={styles.serviceName}>{svc.serviceName}</Text>
              <Text style={styles.serviceMeta}>
                {serviceDisplayPrice(svc)} · {svc.yearsExperience} yrs · {svc.days.length} days/week
              </Text>
              {svc.portfolioItems?.length ? (
                <View style={styles.portfolioPreview}>
                  {svc.portfolioItems.slice(0, 3).map((work) => (
                    <Text key={work.id} style={styles.serviceDesc} numberOfLines={1}>
                      {work.caption.trim() || 'Work sample'}
                      {work.price.trim() ? ` · K${work.price.trim()}` : ''}
                    </Text>
                  ))}
                  {svc.portfolioItems.length > 3 ? (
                    <Text style={styles.serviceDesc}>
                      +{svc.portfolioItems.length - 3} more work sample(s)
                    </Text>
                  ) : null}
                </View>
              ) : svc.photos?.length ? (
                <Text style={styles.serviceDesc}>{svc.photos.length} portfolio photo(s)</Text>
              ) : null}
              {!svc.portfolioItems?.length && svc.description ? (
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {svc.description}
                </Text>
              ) : null}
            </GlassPanel>
          ))}
          <Pressable onPress={() => router.push('/(provider)/services')}>
            <GlassPanel borderRadius={Radii.lg} contentStyle={styles.linkCard}>
              <Text style={styles.linkTitle}>Manage services & prices</Text>
            </GlassPanel>
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => router.push('/(provider)/availability')}>
        <GlassPanel borderRadius={Radii.lg} contentStyle={styles.linkCard}>
          <Text style={styles.linkTitle}>Manage availability</Text>
        </GlassPanel>
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
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.whiteSoft },
  pendingBanner: { padding: 14, gap: 4, marginBottom: 12 },
  pendingTitle: { color: Colors.warning, fontWeight: '800' },
  pendingBody: { color: Colors.whiteSoft, lineHeight: 18, fontSize: FontSize.sm },
  online: { padding: 16, alignItems: 'center', marginBottom: 12 },
  onlineOn: { borderColor: Colors.success },
  onlineText: { color: Colors.charcoal, fontWeight: '800' },
  onlineTextOn: { color: Colors.success },
  stats: { flexDirection: 'row', gap: 8, padding: 8, marginBottom: 12 },
  stat: { flex: 1, padding: 8, alignItems: 'center' },
  statValue: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  statLabel: { color: Colors.whiteSoft, marginTop: 4, fontSize: FontSize.xs },
  section: {
    color: Colors.charcoal,
    fontWeight: '800',
    fontSize: FontSize.lg,
    marginTop: 8,
    marginBottom: 8,
  },
  linkCard: { padding: 16, marginBottom: 8 },
  linkTitle: { color: Colors.charcoal, fontWeight: '700' },
  serviceStack: { gap: 8, marginBottom: 8 },
  serviceCard: { padding: 14, gap: 4 },
  serviceGroup: {
    color: Colors.textLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  serviceName: { color: Colors.charcoal, fontWeight: '800' },
  serviceMeta: { color: Colors.accent, fontWeight: '700', fontSize: FontSize.sm },
  serviceDesc: { color: Colors.whiteSoft, fontSize: FontSize.sm, lineHeight: 18 },
  portfolioPreview: { gap: 2, marginTop: 4 },
});
