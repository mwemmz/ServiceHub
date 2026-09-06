import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { RegColors } from '@/constants/registrationTheme';

/** Footer link on registration screens — jump straight to Sign In. */
export function AuthSignInLink() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.replace('/(auth)/login' as Href)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
      accessibilityRole="button"
      accessibilityLabel="Sign In">
      <Text style={styles.muted}>Already have an account? </Text>
      <Text style={styles.link}>Sign In →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  muted: { color: RegColors.whiteMuted, fontSize: 14 },
  link: { color: RegColors.gold, fontWeight: '800', fontSize: 14 },
});
