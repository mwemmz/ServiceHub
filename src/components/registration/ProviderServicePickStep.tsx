import { StyleSheet, Text, View } from 'react-native';
import { ServiceSelectChip } from '@/components/registration/ServiceSelectChip';
import { RegColors } from '@/constants/registrationTheme';
import { PROVIDER_SERVICE_GROUPS } from '@/constants/providerServices';
import type { CategoryId } from '@/types';

interface Props {
  categoryId: CategoryId | '';
  selectedServiceIds: string[];
  error?: string;
  onToggle: (serviceId: string) => void;
}

/** Individual provider — pick specific services within the chosen category. */
export function ProviderServicePickStep({
  categoryId,
  selectedServiceIds,
  error,
  onToggle,
}: Props) {
  const groups = PROVIDER_SERVICE_GROUPS.filter((group) => group.categoryId === categoryId);

  return (
    <View style={styles.wrap}>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.chipRow}>
            {group.items.map((item) => (
              <ServiceSelectChip
                key={item.id}
                label={item.label}
                selected={selectedServiceIds.includes(item.id)}
                onPress={() => onToggle(item.id)}
              />
            ))}
          </View>
        </View>
      ))}

      {selectedServiceIds.length > 0 ? (
        <Text style={styles.note}>
          {selectedServiceIds.length} service{selectedServiceIds.length === 1 ? '' : 's'} selected
        </Text>
      ) : null}

      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  group: { gap: 10 },
  groupTitle: {
    color: RegColors.goldSoft,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  note: { color: RegColors.goldSoft, fontSize: 14, fontWeight: '600' },
  err: { color: RegColors.error, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
