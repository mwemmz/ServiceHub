import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii } from '@/constants/theme';
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
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={Colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <SecondaryButton label={actionLabel} onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 28, gap: 8 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center', letterSpacing: -0.2 },
  message: { color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
