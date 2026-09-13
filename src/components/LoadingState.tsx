import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <ActivityIndicator color={Colors.accent} size="small" />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  ring: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: Colors.textMuted, fontSize: FontSize.md },
});
