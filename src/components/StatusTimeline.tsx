import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import type { BookingStatus } from '@/types';

const STEPS: { status: BookingStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'request_sent', label: 'Request sent', icon: 'paper-plane-outline' },
  { status: 'waiting_for_provider', label: 'Waiting', icon: 'time-outline' },
  { status: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { status: 'on_the_way', label: 'On the way', icon: 'car-outline' },
  { status: 'arrived', label: 'Arrived', icon: 'location-outline' },
  { status: 'in_progress', label: 'In progress', icon: 'construct-outline' },
  { status: 'completed', label: 'Completed', icon: 'flag-outline' },
];

const ORDER: BookingStatus[] = STEPS.map((step) => step.status);

export function StatusTimeline({ status }: { status: BookingStatus }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelled}>
        <Ionicons name="close-circle" size={20} color={Colors.error} />
        <Text style={styles.cancelledText}>This booking was cancelled.</Text>
      </View>
    );
  }

  const currentIndex = Math.max(0, ORDER.indexOf(status));

  return (
    <View style={styles.row}>
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        return (
          <View key={step.status} style={styles.step}>
            <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
              <Ionicons name={step.icon} size={14} color={done ? '#FFFFFF' : Colors.textLight} />
            </View>
            <Text style={[styles.label, done && styles.labelDone]} numberOfLines={2}>
              {step.label}
            </Text>
            {index < STEPS.length - 1 ? <View style={[styles.line, done && index < currentIndex && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', position: 'relative' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotDone: { backgroundColor: Colors.accent },
  dotActive: { backgroundColor: Colors.accentDark },
  label: { marginTop: 6, fontSize: 9, color: Colors.textLight, textAlign: 'center' },
  labelDone: { color: Colors.charcoal, fontWeight: '700' },
  line: {
    position: 'absolute',
    top: 13,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
  },
  lineDone: { backgroundColor: Colors.accent },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8E4E0',
    padding: 12,
    borderRadius: 12,
  },
  cancelledText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '700' },
});
