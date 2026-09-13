import { Redirect, Tabs, useRouter, usePathname } from 'expo-router';
import { AppTabBar } from '@/components/AppTabBar';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';

export default function ProviderTabs() {
  const router = useRouter();
  const { providerProfile } = useAuth();
  const pathname = usePathname();
  const { isWide } = useResponsive();

  if (providerProfile && !providerProfile.isSetupComplete && !pathname.includes('setup')) {
    return <Redirect href="/(provider)/setup" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: isWide ? 'top' : 'bottom' }}
      tabBar={({ state, navigation }) => (
        <AppTabBar
          items={[
            { key: 'index', label: 'Home', icon: 'grid-outline', activeIcon: 'grid' },
            { key: 'requests', label: 'Requests', icon: 'file-tray-outline', activeIcon: 'file-tray' },
            { key: 'jobs', label: 'Jobs', icon: 'briefcase-outline', activeIcon: 'briefcase' },
            { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
          ]}
          activeKey={state.routes[state.index]?.name ?? 'index'}
          onChange={(key) => navigation.navigate(key)}
          onCenterPress={() => router.push('/(provider)/(tabs)/notifications')}
          centerIcon="notifications"
        />
      )}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
