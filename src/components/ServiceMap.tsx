import { MapFallback } from '@/components/MapFallback';
import type { GeoLocation } from '@/types';

interface Props {
  customer?: GeoLocation | null;
  provider?: GeoLocation | null;
  height?: number;
}

/** Web: never import react-native-maps (native-only). */
export function ServiceMap(props: Props) {
  return <MapFallback {...props} />;
}

export default ServiceMap;
