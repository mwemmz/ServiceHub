import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { CategoryCard } from '@/components/CategoryCard';
import { LocationHeader } from '@/components/LocationHeader';
import { SearchBar } from '@/components/SearchBar';
import { ProviderCard } from '@/components/ProviderCard';
import { BookingCard } from '@/components/BookingCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCategories, getPopularServices } from '@/services/catalogService';
import { getNearbyProviders } from '@/services/providerService';
import { getBookingsForUser } from '@/services/bookingService';
import { getService } from '@/services/catalogService';
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

  if (loading && !data) return <LoadingState message="Loading your home..." />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          {greetingForNow()}, {firstName(user?.fullName ?? '')}! 👋
        </Text>
        <Text style={styles.sub}>What would you like help with today?</Text>

        <SearchBar
          value=""
          onChangeText={() => undefined}
          editable={false}
          onPress={() => router.push('/(customer)/search')}
          placeholder="Search for services, e.g. plumbing, hairdressing..."
        />

        <Text style={styles.section}>Choose a category</Text>
        <Text style={styles.sectionSub}>Select a service category to get started.</Text>
        <View style={styles.cats}>
          {data.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => router.push(`/(customer)/category/${category.id}`)}
            />
          ))}
        </View>

        <View style={styles.banner}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
          <Text style={styles.bannerText}>Trusted professionals • Verified • Insured • On-time service</Text>
        </View>

        <Text style={styles.section}>Popular services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {data.popular.map((service) => (
            <Pressable
              key={service.id}
              style={styles.chip}
              onPress={() => router.push(`/(customer)/service/${service.id}`)}>
              <Text style={styles.chipText}>{service.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bell: { padding: 4 },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 8 },
  sub: { color: Colors.textMuted, marginBottom: 4 },
  section: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', marginTop: 10 },
  sectionSub: { color: Colors.textMuted, marginTop: -6 },
  cats: { flexDirection: 'row', gap: 10 },
  banner: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: { flex: 1, color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '600' },
  hList: { gap: 8 },
  chip: { backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { color: Colors.charcoal, fontWeight: '700' },
  stack: { gap: 12 },
});
