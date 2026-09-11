import { StyleSheet, View } from 'react-native';
import { RegField } from '@/components/registration/RegControls';

/** Password + Confirm Password on the same form. Each field has its own visibility toggle. */
export function PasswordPairFields({
  password,
  confirm,
  errors,
  onChangePassword,
  onChangeConfirm,
  variant = 'default',
  confirmNextFieldKey,
  onConfirmSubmit,
}: {
  password: string;
  confirm: string;
  errors: Record<string, string>;
  onChangePassword: (value: string) => void;
  onChangeConfirm: (value: string) => void;
  variant?: 'default' | 'glass';
  confirmNextFieldKey?: string;
  onConfirmSubmit?: () => void;
}) {
  return (
    <View style={styles.pair}>
      <RegField
        fieldKey="password"
        nextFieldKey="confirm"
        label="Password"
        value={password}
        onChangeText={onChangePassword}
        secureTextEntry
        error={errors.password}
        variant={variant}
      />
      <RegField
        fieldKey="confirm"
        nextFieldKey={confirmNextFieldKey}
        label="Confirm Password"
        value={confirm}
        onChangeText={onChangeConfirm}
        secureTextEntry
        error={errors.confirm}
        variant={variant}
        returnKeyType={confirmNextFieldKey ? 'next' : 'done'}
        onSubmitEditing={onConfirmSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { gap: 10 },
});
