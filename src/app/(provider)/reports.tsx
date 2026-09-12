import { DisputeListView } from '@/components/DisputeListView';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function ProviderReportsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Reports & disputes" subtitle="Track disputes and safety reports you have filed." />
      <DisputeListView />
    </Screen>
  );
}