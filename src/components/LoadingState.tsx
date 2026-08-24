import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={Colors.accent} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  text: { color: Colors.textMuted, fontSize: FontSize.md },
});
