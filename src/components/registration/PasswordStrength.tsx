import { StyleSheet, Text, View } from 'react-native';
import { RegColors } from '@/constants/registrationTheme';
import {
  getPasswordChecks,
  passwordStrengthLabel,
  type PasswordChecks,
} from '@/utils/registrationValidation';

const LABELS: { key: keyof PasswordChecks; text: string }[] = [
  { key: 'minLength', text: 'At least 8 characters' },
  { key: 'uppercase', text: 'One uppercase letter' },
  { key: 'number', text: 'One number' },
  { key: 'special', text: 'One special character' },
];

export function PasswordStrength({ password }: { password: string }) {
  const checks = getPasswordChecks(password);
  const label = password ? passwordStrengthLabel(password) : '';
  const score = Object.values(checks).filter(Boolean).length;

  return (
    <View style={styles.wrap}>
      {password ? (
        <View style={styles.barRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.bar,
                i < score && {
                  backgroundColor:
                    score <= 1 ? RegColors.error : score === 2 ? RegColors.amber : RegColors.success,
                },
              ]}
            />
          ))}
          <Text style={styles.strengthLabel}>{label}</Text>
        </View>
      ) : null}
      {LABELS.map((item) => (
        <Text
          key={item.key}
          style={[styles.rule, checks[item.key] ? styles.ruleOk : styles.rulePending]}>
          {checks[item.key] ? '✓' : '○'} {item.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  strengthLabel: { color: RegColors.goldSoft, fontSize: 12, fontWeight: '700', minWidth: 48 },
  rule: { fontSize: 12 },
  ruleOk: { color: RegColors.success },
  rulePending: { color: RegColors.whiteMuted },
});
