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
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCategories, getPopularServices, getService } from '@/services/catalogService';
import { getNearbyProviders } from '@/services/providerService';
import { getBookingsForUser } from '@/services/bookingService';
import { getUsers } from '@/services/localDb';
import { firstName, greetingForNow, isActiveBooking } from '@/utils/format';

const TAB_BAR_CLEARANCE = 96;

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

  const displayName = firstName(user?.fullName ?? '');

  return (
    <AppShell edges={['top']} contentStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}>
      {/* Header — single row, location gets remaining space */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn} accessibilityLabel="Menu">
          <Ionicons name="menu-outline" size={24} color={Colors.charcoal} />
        </Pressable>
        <LocationHeader location={location} onPress={() => router.push('/(customer)/location')} />
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/(customer)/(tabs)/notifications')}
            style={styles.iconBtn}
            accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={22} color={Colors.charcoal} />
          </Pressable>
          <Avatar name={user?.fullName ?? 'You'} uri={user?.avatarUri} size={38} />
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.hello} numberOfLines={2}>
        {greetingForNow()}, {displayName}!
      </Text>
      <Text style={styles.sub}>What would you like help with today?</Text>

      <View style={styles.searchWrap}>
        <SearchBar
          value=""
          onChangeText={() => undefined}
          editable={false}
          onPress={() => router.push('/(customer)/search')}
          placeholder="Search for services..."
        />
      </View>

      {/* Categories — full-width rows so text doesn't break */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose a category</Text>
        <Text style={styles.sectionSub}>Select a service category to get started.</Text>
      </View>
      <View style={styles.catList}>
        {data.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            layout="row"
            onPress={() => router.push(`/(customer)/request/services?categoryId=${category.id}`)}
          />
        ))}
      </View>

      <View style={styles.banner}>
        <Ionicons name="shield-checkmark" size={18} color={Colors.accent} />
        <Text style={styles.bannerText} numberOfLines={2}>
          Trusted professionals • Verified • Insured • On-time service
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular services</Text>
      </View>
      <View style={styles.chips}>
        {data.popular.map((service) => (
          <Pressable
            key={service.id}
            style={styles.chip}
            onPress={() =>
              router.push(
                `/(customer)/request/detail?serviceId=${service.id}&categoryId=${service.categoryId}`,
              )
            }>
            <Text style={styles.chipText} numberOfLines={1}>
              {service.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{location ? 'Nearby providers' : 'Popular providers'}</Text>
      </View>
      <View style={styles.stack}>
        {data.providers.map((item) => (
          <ProviderCard
            key={item.user.id}
            item={item}
            onPress={() => router.push(`/(customer)/provider/${item.user.id}`)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent bookings</Text>
      </View>
      <View style={styles.stack}>
        {data.recentWithNames.length === 0 ? (
          <Text style={styles.emptyNote}>You have no active bookings yet.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  menuBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: {
    color: Colors.charcoal,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    lineHeight: 34,
  },
  sub: {
    color: Colors.whiteSoft,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  searchWrap: { marginBottom: Spacing.lg },
  section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.whiteSoft,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  catList: { gap: 10 },
  banner: {
    backgroundColor: 'rgba(212,163,115,0.16)',
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
  },
  bannerText: {
    flex: 1,
    color: Colors.charcoal,
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '100%',
  },
  chipText: { color: Colors.charcoal, fontWeight: '700', fontSize: FontSize.sm },
  stack: { gap: 12 },
  emptyNote: {
    color: Colors.whiteSoft,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
