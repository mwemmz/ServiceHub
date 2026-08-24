import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { bookingStatusLabel } from '@/utils/format';
import type { BookingStatus } from '@/types';

const TONES: Record<BookingStatus, { bg: string; fg: string }> = {
  request_sent: { bg: Colors.accentSoft, fg: Colors.accentDark },
  waiting_for_provider: { bg: Colors.accentSoft, fg: Colors.accentDark },
  accepted: { bg: '#E4F3EA', fg: Colors.success },
  on_the_way: { bg: Colors.beauty.background, fg: Colors.beauty.icon },
  arrived: { bg: Colors.repair.background, fg: Colors.repair.icon },
  in_progress: { bg: Colors.repair.background, fg: Colors.repair.icon },
  completed: { bg: '#E4F3EA', fg: Colors.success },
  cancelled: { bg: '#F8E4E0', fg: Colors.error },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const tone = TONES[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{bookingStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  text: { fontSize: FontSize.xs, fontWeight: '700' },
});
