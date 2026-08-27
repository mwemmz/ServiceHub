import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/GlassPanel';
import { StatusBadge } from '@/components/StatusBadge';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { formatDateTime, formatKwacha } from '@/utils/format';
import type { Booking } from '@/types';

interface Props {
  booking: Booking;
  serviceName?: string;
  counterpartName?: string;
  onPress: () => void;
}

export function BookingCard({ booking, serviceName, counterpartName, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassPanel borderRadius={Radii.lg} intensity="medium" contentStyle={styles.card}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.service}>{serviceName ?? 'Service'}</Text>
            {counterpartName ? <Text style={styles.name}>{counterpartName}</Text> : null}
          </View>
          <StatusBadge status={booking.status} />
        </View>
        <Text style={styles.meta}>{formatDateTime(booking.scheduledAt)}</Text>
        <Text style={styles.price}>{formatKwacha(booking.price.total)}</Text>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  service: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  name: { color: Colors.textMuted, marginTop: 2, fontSize: FontSize.sm },
  meta: { color: Colors.textMuted, marginTop: 10, fontSize: FontSize.sm },
  price: { color: Colors.accent, fontWeight: '800', marginTop: 6, fontSize: FontSize.md },
});
