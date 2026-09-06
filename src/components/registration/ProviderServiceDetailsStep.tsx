import { StyleSheet, Text, View } from 'react-native';
import { RegField } from '@/components/registration/RegControls';
import { RegColors } from '@/constants/registrationTheme';
import { WEEK_DAYS } from '@/constants/providerServices';
import type { ProviderRegistrationService } from '@/types/providerRegistration';
import { Pressable } from 'react-native';

interface Props {
  groups: {
    title: string;
    items: { id: string; label: string }[];
  }[];
  serviceDetails: Record<string, ProviderRegistrationService>;
  errors: Record<string, string>;
  onUpdate: (serviceId: string, patch: Partial<ProviderRegistrationService>) => void;
}

export function ProviderServiceDetailsStep({
  groups,
  serviceDetails,
  errors,
  onUpdate,
}: Props) {
  let serviceNumber = 0;

  return (
    <View style={styles.wrap}>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.items.map((item) => {
            serviceNumber += 1;
            const detail = serviceDetails[item.id];
            if (!detail) return null;
            const yearsKey = `years:${item.id}`;
            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.serviceHeading}>
                  {serviceNumber}. {detail.serviceName}
                </Text>
                <RegField
                  fieldKey={yearsKey}
                  label="Years of Experience"
                  value={detail.yearsExperience}
                  onChangeText={(yearsExperience) => onUpdate(item.id, { yearsExperience })}
                  keyboardType="number-pad"
                  error={errors[yearsKey]}
                  returnKeyType="done"
                  variant="glass"
                />
                <Text style={styles.subLabel}>Availability — days</Text>
                <View style={styles.chipRow}>
                  {WEEK_DAYS.map((day) => {
                    const selected = detail.days.includes(day);
                    return (
                      <Chip
                        key={day}
                        label={day.slice(0, 3)}
                        selected={selected}
                        onPress={() => {
                          const days = selected
                            ? detail.days.filter((d) => d !== day)
                            : [...detail.days, day];
                          onUpdate(item.id, { days });
                        }}
                      />
                    );
                  })}
                </View>
                {errors[`days:${item.id}`] ? (
                  <Text style={styles.err}>{errors[`days:${item.id}`]}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  group: { gap: 14 },
  groupTitle: {
    color: RegColors.goldSoft,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    gap: 14,
  },
  serviceHeading: { color: RegColors.white, fontWeight: '800', fontSize: 18, lineHeight: 24 },
  subLabel: {
    color: RegColors.whiteSoft,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: { backgroundColor: RegColors.gold, borderColor: RegColors.gold },
  chipText: { color: RegColors.white, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: '#2C2420' },
  err: { color: RegColors.error, fontSize: 14, lineHeight: 20 },
});
