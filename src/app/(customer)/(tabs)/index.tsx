import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { CategoryCard } from '@/components/CategoryCard';
import { LocationHeader } from '@/components/LocationHeader';
import { SearchBar } from '@/components/SearchBar';
import { BookingCard } from '@/components/BookingCard';
import { RatingStars } from '@/components/RatingStars';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii, Spacing, Tracking } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useResponsive } from '@/hooks/useResponsive';
import { getCategories, getPopularServices, getService } from '@/services/catalogService';
import { getNearbyProviders, type ProviderListItem } from '@/services/providerService';
import { getBookingsForUser } from '@/services/bookingService';
import { getUsers } from '@/services/localDb';
import { firstName, isActiveBooking } from '@/utils/format';

const TAB_BAR_CLEARANCE = 96;

export default function CustomerHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useAppLocation();
  const { isWide, colWidth } = useResponsive();
  const [previewProvider, setPreviewProvider] = useState<ProviderListItem | null>(null);

  const { data, loading, error, reload } = useAsyncData(async () => {
    const [categories, popular, providers, bookings, users] = await Promise.all([
      getCategories(),
      getPopularServices(),
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
      <BackButton fallbackHref={'/(customer)/categories' as Href} />
      {/* Header — Greeting Header: Avatar top-left + Hello [Name], Notification / Chat top-right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user?.fullName ?? 'You'} size={42} />
          <View>
            <Text style={styles.greetingTitle}>Hello, {displayName} 👋</Text>
            <LocationHeader location={location} onPress={() => router.push('/(customer)/location')} />
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/(customer)/(tabs)/notifications')}
            style={styles.iconBtn}
            accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={22} color={Colors.charcoal} />
          </Pressable>
          <Pressable
            onPress={() => {
              const first = data.recentWithNames[0];
              if (first) {
                router.push(`/(customer)/chat/${first.booking.id}` as Href);
              } else {
                router.push('/(customer)/(tabs)/bookings' as Href);
              }
            }}
            style={styles.iconBtn}
            accessibilityLabel="Chat">
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.charcoal} />
          </Pressable>
        </View>
      </View>

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

      {/* Categories — Service Categories with See All */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <Pressable onPress={() => router.push('/(customer)/categories' as Href)}>
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      </View>
      <View style={[styles.catList, isWide && styles.catGrid]}>
        {data.categories.map((category) => (
          <View key={category.id} style={isWide ? { width: colWidth(3), minWidth: 0 } : styles.catRowItem}>
            <CategoryCard
              category={category}
              layout={isWide ? 'tile' : 'row'}
              onPress={() => router.push(`/(customer)/request/services?categoryId=${category.id}`)}
            />
          </View>
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

      {/* Recommended Professionals with See All in 2-column grid */}
      <View style={styles.sectionHeaderRowWithMargin}>
        <Text style={styles.sectionTitle}>Recommended Professionals</Text>
        <Pressable onPress={() => router.push('/(customer)/providers' as Href)}>
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      </View>
      <View style={styles.grid2Col}>
        {data.providers.map((item) => (
          <View key={item.user.id} style={styles.gridCardWrapper}>
            <Pressable
              onPress={() => setPreviewProvider(item)}
              style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
              <View style={styles.proCard}>
                <Avatar name={item.user.fullName} size={64} />
                <Text style={styles.proName} numberOfLines={1}>{item.user.fullName}</Text>
                <Text style={styles.proService} numberOfLines={1}>{item.profile.serviceArea}</Text>
                <RatingStars rating={item.profile.rating} count={item.profile.reviewCount} />
              </View>
            </Pressable>
          </View>
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

      {/* Quick-Preview Floating Card Modal Overlay */}
      {previewProvider && (
        <View style={styles.previewOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setPreviewProvider(null)} />
          <View style={styles.previewCard}>
            <Avatar name={previewProvider.user.fullName} size={80} />
            <Text style={styles.previewTitle}>{previewProvider.user.fullName}</Text>
            <Text style={styles.previewSubtitle}>{previewProvider.profile.serviceArea}</Text>
            <RatingStars rating={previewProvider.profile.rating} count={previewProvider.profile.reviewCount} />
            <View style={styles.previewActions}>
              <PrimaryButton
                label="View Profile"
                onPress={() => {
                  const id = previewProvider.user.id;
                  setPreviewProvider(null);
                  router.push(`/(customer)/provider/${id}`);
                }}
              />
              <SecondaryButton label="Close" onPress={() => setPreviewProvider(null)} />
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sub: {
    color: Colors.whiteSoft,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  searchWrap: { marginBottom: Spacing.lg },
  section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeaderRowWithMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: Tracking.section,
  },
  seeAllText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sectionSub: {
    color: Colors.whiteSoft,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  catList: { gap: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  catRowItem: { width: '100%' },
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
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCardWrapper: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
  },
  proCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  proAvatar: {
    borderRadius: Radii.md,
  },
  proName: {
    color: Colors.charcoal,
    fontSize: FontSize.md,
    fontWeight: '800',
    textAlign: 'center',
  },
  proService: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: 2,
  },
  stack: { gap: 12 },
  wideGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  full: { width: '100%' },
  emptyNote: {
    color: Colors.whiteSoft,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  previewTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: -4,
  },
  previewActions: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
});
