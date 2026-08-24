import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

export default function NotFound() {
  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <Text style={styles.title}>This screen does not exist.</Text>
      <Link href="/" style={styles.link}>
        Go home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: 12 },
  title: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  link: { color: Colors.accent, fontWeight: '700' },
});
