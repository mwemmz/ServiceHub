import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import { PrimaryButton } from '@/components/PrimaryButton';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
      <Text style={styles.title}>Unable to load</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <PrimaryButton label="Try again" onPress={onRetry} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  title: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  message: { color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
});
