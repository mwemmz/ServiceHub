import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';

export function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={14} color={Colors.star} />
      <Text style={styles.num}>{Number(value ?? 0).toFixed(1)}</Text>
      {typeof count === 'number' ? (
        <Text style={styles.count}>({count} reviews)</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  num: { color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '700' },
  count: { color: Colors.textMuted, fontSize: FontSize.xs },
});