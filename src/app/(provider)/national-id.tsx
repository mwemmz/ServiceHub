import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { NationalIdView } from '@/components/NationalIdView';

export default function ProviderNationalIdScreen() {
  return (
    <Screen>
      <ScreenHeader title="National ID" subtitle="Link your NRC to claim a verified digital ID." />
      <NationalIdView />
    </Screen>
  );
}