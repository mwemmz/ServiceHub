import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import { SecondaryButton } from '@/components/SecondaryButton';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={36} color={Colors.textLight} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <SecondaryButton label={actionLabel} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 28, gap: 8 },
  title: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' },
  message: { color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
