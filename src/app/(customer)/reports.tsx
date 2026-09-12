import { DisputeListView } from '@/components/DisputeListView';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function CustomerReportsScreen() {
  return (
    <Screen>
      <ScreenHeader title="My reports" subtitle="Track disputes and safety reports you have filed." />
      <DisputeListView />
    </Screen>
  );
}