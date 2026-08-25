import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { CategoryCard } from '@/components/CategoryCard';
import { LocationHeader } from '@/components/LocationHeader';
import { SearchBar } from '@/components/SearchBar';
import { ProviderCard } from '@/components/ProviderCard';
import { BookingCard } from '@/components/BookingCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCategories, getPopularServices, getService } from '@/services/catalogService';
import { getNearbyProviders } from '@/services/providerService';
import { getBookingsForUser } from '@/services/bookingService';
import { getUsers } from '@/services/localDb';
import { firstName, greetingForNow, isActiveBooking } from '@/utils/format';

export default function CustomerHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useAppLocation();

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [categories, popular, providers, bookings, users] = await Promise.all([
      getCategories(),
      Promise.resolve(getPopularServices()),
      getNearbyProviders(location),
      getBookingsForUser(user!.id, 'customer'),
      getUsers(),
    ]);
    const recent = bookings.filter((item) => isActiveBooking(item.status)).slice(0, 2);
    const recentWithNames = await Promise.all(
      recent.map(async (booking) => ({
        booking,
        serviceName: (await getService(booking.serviceId))?.name,
        counterpartName: users.find((item) => item.id === booking.providerId)?.fullName,
      })),
    );
    return { categories, popular, providers: providers.slice(0, 4), recentWithNames };
  }, [user?.id, location?.latitude, location?.longitude]);

  if (loading && !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <LoadingState message="Loading your home..." />
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

  return (
    <AppShell edges={['top']}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Menu">
          <Ionicons name="menu-outline" size={24} color={Colors.charcoal} />
        </Pressable>
        <LocationHeader location={location} onPress={() => router.push('/(customer)/location')} />
        <Pressable onPress={() => router.push('/(customer)/(tabs)/notifications')} style={styles.bell}>
          <Ionicons name="notifications-outline" size={22} color={Colors.charcoal} />
        </Pressable>
        <Avatar name={user?.fullName ?? 'You'} uri={user?.avatarUri} size={40} />
      </View>

      <Text style={styles.hello}>
        {greetingForNow()}, {firstName(user?.fullName ?? '')}!
      </Text>
      <Text style={styles.sub}>What would you like help with today?</Text>

      <SearchBar
        value=""
        onChangeText={() => undefined}
        editable={false}
        onPress={() => router.push('/(customer)/search')}
        placeholder="Search for services..."
      />

      <Text style={styles.section}>Choose a category</Text>
      <Text style={styles.sectionSub}>Select a service category to get started.</Text>
      <View style={styles.cats}>
        {data.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onPress={() => router.push(`/(customer)/request/services?categoryId=${category.id}`)}
          />
        ))}
      </View>

      <View style={styles.banner}>
        <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
        <Text style={styles.bannerText}>Trusted professionals • Verified • Insured • On-time service</Text>
      </View>

      <Text style={styles.section}>Popular services</Text>
      <View style={styles.hList}>
        {data.popular.map((service) => (
          <Pressable
            key={service.id}
            style={styles.chip}
            onPress={() =>
              router.push(
                `/(customer)/request/detail?serviceId=${service.id}&categoryId=${service.categoryId}`,
              )
            }>
            <Text style={styles.chipText}>{service.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>{location ? 'Nearby providers' : 'Popular providers'}</Text>
      <View style={styles.stack}>
        {data.providers.map((item) => (
          <ProviderCard
            key={item.user.id}
            item={item}
            onPress={() => router.push(`/(customer)/provider/${item.user.id}`)}
          />
        ))}
      </View>

      <Text style={styles.section}>Recent bookings</Text>
      <View style={styles.stack}>
        {data.recentWithNames.length === 0 ? (
          <Text style={styles.sectionSub}>You have no active bookings yet.</Text>
        ) : (
          data.recentWithNames.map((item) => (
            <BookingCard
              key={item.booking.id}
              booking={item.booking}
              serviceName={item.serviceName}
              counterpartName={item.counterpartName}
              onPress={() => router.push(`/(customer)/booking/${item.booking.id}`)}
            />
          ))
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bell: { padding: 4 },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 8 },
  sub: { color: Colors.whiteSoft, marginBottom: 4 },
  section: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', marginTop: 10 },
  sectionSub: { color: Colors.whiteSoft, marginTop: -6 },
  cats: { flexDirection: 'row', gap: 10 },
  banner: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerText: { flex: 1, color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '600' },
  hList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.charcoal, fontWeight: '700' },
  stack: { gap: 12 },
});
