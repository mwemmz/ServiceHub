import { Tabs, useRouter } from 'expo-router';
import { AppTabBar } from '@/components/AppTabBar';
import { useResponsive } from '@/hooks/useResponsive';

export default function CustomerTabs() {
  const router = useRouter();
  const { isWide } = useResponsive();

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: isWide ? 'top' : 'bottom' }}
      tabBar={({ state, navigation }) => (
        <AppTabBar
          items={[
            { key: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
            { key: 'bookings', label: 'Bookings', icon: 'calendar-outline', activeIcon: 'calendar' },
            { key: 'notifications', label: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
            { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
          ]}
          activeKey={state.routes[state.index]?.name ?? 'index'}
          onChange={(key) => navigation.navigate(key)}
          onCenterPress={() => router.push('/(customer)/search')}
        />
      )}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
