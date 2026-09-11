import { StyleSheet, Text, View } from 'react-native';
import { RegField } from '@/components/registration/RegControls';
import { RegColors } from '@/constants/registrationTheme';

interface Props {
  nrcNumber: string;
  error?: string;
  onChange: (nrcNumber: string) => void;
}

export function BusinessOwnerNrcStep({ nrcNumber, error, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Business Owner / Representative Verification</Text>
      <Text style={styles.hint}>
        Enter the NRC number of the business owner or authorized representative.
      </Text>
      <RegField
        fieldKey="nrcNumber"
        label="Owner/Representative NRC Number"
        value={nrcNumber}
        onChangeText={onChange}
        error={error}
        variant="glass"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  sectionTitle: {
    color: RegColors.white,
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 24,
  },
  hint: {
    color: RegColors.whiteSoft,
    fontSize: 15,
    lineHeight: 22,
  },
});
