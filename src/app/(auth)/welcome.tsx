import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Logo } from '@/components/Logo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { BrandImages } from '@/constants/assets';
import { Colors, FontSize, Radii } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Logo size="md" />
        <Text style={styles.headline}>Book trusted services, easily and quickly.</Text>
        <Text style={styles.sub}>
          From beauty to repairs and cleaning — help is just a tap away.
        </Text>
      </View>
      <Image source={BrandImages.welcome} style={styles.image} resizeMode="cover" />
      <View style={styles.actions}>
        <PrimaryButton label="Sign In" onPress={() => router.push('/(auth)/login')} />
        <SecondaryButton label="Create Account" onPress={() => router.push('/(auth)/register')} />
        <Text style={styles.fine}>Your data is safe and secure with us.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 12, gap: 10 },
  headline: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', textAlign: 'center' },
  sub: { color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  image: { height: 240, borderRadius: Radii.xl, marginVertical: 20, width: '100%' },
  actions: { gap: 12, paddingBottom: 24 },
  fine: { color: Colors.textMuted, textAlign: 'center', marginTop: 8, fontSize: FontSize.sm },
});
