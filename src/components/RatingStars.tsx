import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';

interface Props {
  rating: number;
  count?: number;
  size?: number;
}

export function RatingStars({ rating, count, size = 14 }: Props) {
  const rounded = Math.round(rating);
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < rounded ? 'star' : 'star-outline'}
          size={size}
          color={Colors.star}
        />
      ))}
      <Text style={styles.text}>{rating.toFixed(1)}</Text>
      {count != null ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  text: { marginLeft: 6, color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '700' },
  count: { color: Colors.textMuted, fontSize: FontSize.sm },
});
