import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { BrandImages } from '@/constants/assets';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const SLIDES = [
  {
    image: BrandImages.welcome,
    title: 'Find trusted services nearby',
    body: 'Beauty, cleaning and repairs — book help around Lusaka in a few taps.',
  },
  {
    image: BrandImages.home,
    title: 'Book verified professionals',
    body: 'Compare ratings, prices and availability, then confirm a visit that fits your day.',
  },
  {
    image: BrandImages.tracking,
    title: 'Offer your skills and get booked',
    body: 'Service providers can advertise their work, receive requests and manage jobs in the same app.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  async function finish() {
    await completeOnboarding();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          <Text style={[styles.link, index === 0 && styles.hidden]}>Back</Text>
        </Pressable>
        <Pressable onPress={finish}>
          <Text style={styles.link}>Skip</Text>
        </Pressable>
      </View>

      <Image source={slide.image} style={styles.image} resizeMode="cover" />

      <View style={styles.copy}>
        <View style={styles.dots}>
          {SLIDES.map((_, dotIndex) => (
            <View key={dotIndex} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        {last ? (
          <PrimaryButton label="Get Started" onPress={finish} />
        ) : (
          <View style={styles.actions}>
            <SecondaryButton label="Back" onPress={() => setIndex((value) => value - 1)} style={{ flex: 1 }} />
            <PrimaryButton label="Next" onPress={() => setIndex((value) => value + 1)} style={{ flex: 1 }} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  link: { color: Colors.accent, fontWeight: '700', fontSize: FontSize.md },
  hidden: { opacity: 0 },
  image: { height: 320, marginHorizontal: 16, borderRadius: Radii.xl, width: '100%' as const, maxWidth: 400, alignSelf: 'center' },
  copy: { padding: 24, gap: 12, flex: 1, justifyContent: 'flex-end', paddingBottom: 28 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 22, backgroundColor: Colors.accent },
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  body: { color: Colors.textMuted, fontSize: FontSize.md, lineHeight: 22, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12 },
});
