import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';
import { formatKwacha } from '@/utils/format';
import type { PriceBreakdown } from '@/types';

export function PriceBreakdownView({ price }: { price: PriceBreakdown }) {
  return (
    <View style={styles.wrap}>
      <Row label="Base fare" value={formatKwacha(price.base)} />
      <Row label="Service fee" value={formatKwacha(price.serviceFee)} />
      <Row label="Platform fee" value={formatKwacha(price.platformFee)} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatKwacha(price.total)}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: Colors.textMuted, fontSize: FontSize.sm },
  value: { color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  totalValue: { color: Colors.accent, fontWeight: '800', fontSize: FontSize.md, fontVariant: ['tabular-nums'] },
});
