import { StyleSheet, Text, View } from 'react-native';
import { PasswordStrength } from '@/components/registration/PasswordStrength';
import { RegField } from '@/components/registration/RegControls';
import { RegColors } from '@/constants/registrationTheme';

interface Props {
  password: string;
  confirm: string;
  errors: Record<string, string>;
  onChangePassword: (password: string) => void;
  onChangeConfirm: (confirm: string) => void;
}

export function BusinessPasswordStep({
  password,
  confirm,
  errors,
  onChangePassword,
  onChangeConfirm,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Create Password</Text>
      <RegField
        fieldKey="password"
        nextFieldKey="confirm"
        label="Password"
        value={password}
        onChangeText={onChangePassword}
        placeholder="Create a password"
        secureTextEntry
        error={errors.password}
        variant="glass"
      />
      <PasswordStrength password={password} />
      <RegField
        fieldKey="confirm"
        label="Confirm Password"
        value={confirm}
        onChangeText={onChangeConfirm}
        placeholder="Confirm your password"
        secureTextEntry
        error={errors.confirm}
        variant="glass"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  sectionTitle: {
    color: RegColors.white,
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 24,
  },
});
