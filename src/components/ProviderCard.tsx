import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radii, Shadows } from '@/constants/theme';
import { Avatar } from '@/components/Avatar';
import { RatingStars } from '@/components/RatingStars';
import { formatKwacha } from '@/utils/format';
import { formatDistance } from '@/utils/geo';
import type { ProviderListItem } from '@/services/providerService';

interface Props {
  item: ProviderListItem;
  serviceName?: string;
  onPress: () => void;
}

export function ProviderCard({ item, serviceName, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Avatar name={item.user.fullName} uri={item.user.avatarUri} size={56} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {item.user.fullName}
          </Text>
          {item.profile.isOnline ? <Text style={styles.online}>Available</Text> : <Text style={styles.offline}>Offline</Text>}
        </View>
        <Text style={styles.service} numberOfLines={1}>
          {serviceName ?? item.profile.serviceArea}
        </Text>
        <RatingStars rating={item.profile.rating} count={item.profile.reviewCount} />
        <View style={styles.metaRow}>
          {item.price != null ? <Text style={styles.price}>{formatKwacha(item.price)}</Text> : null}
          {item.distanceKm != null ? <Text style={styles.meta}>{formatDistance(item.distanceKm)}</Text> : null}
          {item.etaMinutes != null ? <Text style={styles.meta}>{item.etaMinutes} min</Text> : null}
          <Text style={styles.meta}>{item.profile.completedJobs} jobs</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    ...Shadows.card,
  },
  pressed: { opacity: 0.92 },
  body: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  service: { color: Colors.textMuted, marginTop: 2, marginBottom: 4, fontSize: FontSize.sm },
  online: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '700' },
  offline: { color: Colors.textLight, fontSize: FontSize.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  price: { color: Colors.accent, fontWeight: '800', fontSize: FontSize.sm },
  meta: { color: Colors.textMuted, fontSize: FontSize.sm },
});
