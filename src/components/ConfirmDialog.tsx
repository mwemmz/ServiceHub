import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Cross-platform confirm dialog (native Alert.alert is a no-op on react-native-web). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Keep',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onCancel}
        accessibilityRole="none">
        <Pressable
          style={styles.card}
          accessibilityRole="none"
          onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancel,
                loading && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirm,
                loading && styles.disabled,
                pressed && styles.pressed,
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 18,
    gap: 8,
  },
  title: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  message: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelLabel: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700' },
  confirm: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.pill,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmLabel: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9 },
});