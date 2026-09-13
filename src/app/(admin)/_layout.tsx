import { Redirect, Tabs, useRouter } from 'expo-router';
import { AppTabBar } from '@/components/AppTabBar';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';

export default function AdminTabs() {
  const router = useRouter();
  const { user } = useAuth();
  const { isWide } = useResponsive();

  if (user?.role !== 'admin') {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: isWide ? 'top' : 'bottom' }}
      tabBar={({ state, navigation }) => (
        <AppTabBar
          items={[
            { key: 'dashboard', label: 'Dashboard', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
            { key: 'users', label: 'Users', icon: 'people-outline', activeIcon: 'people' },
            { key: 'providers', label: 'Providers', icon: 'shield-checkmark-outline', activeIcon: 'shield-checkmark' },
            { key: 'bookings', label: 'Bookings', icon: 'calendar-outline', activeIcon: 'calendar' },
          ]}
          activeKey={state.routes[state.index]?.name ?? 'dashboard'}
          onChange={(key) => navigation.navigate(key)}
          centerIcon="document-text"
          onCenterPress={() => router.push('/(admin)/reports')}
        />
      )}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="users" />
      <Tabs.Screen name="providers" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="reports" options={{ href: null }} />
    </Tabs>
  );
}