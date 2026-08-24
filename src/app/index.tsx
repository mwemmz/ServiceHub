import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Logo } from '@/components/Logo';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function SplashGate() {
  const { isReady, user, hasOnboarded } = useAuth();
  const [minTimeDone, setMinTimeDone] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => setMinTimeDone(true), 1600);
    return () => clearTimeout(timeout);
  }, [opacity, scale]);

  if (isReady && minTimeDone) {
    if (!hasOnboarded) return <Redirect href="/onboarding" />;
    if (!user) return <Redirect href="/(auth)/welcome" />;
    if (user.role === 'provider') return <Redirect href="/(provider)/(tabs)" />;
    return <Redirect href="/(customer)/(tabs)" />;
  }

  return (
    <View style={styles.screen}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Logo size="lg" />
      </Animated.View>
      <Text style={styles.caption}>Trusted services, just a tap away.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  caption: {
    marginTop: 28,
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});
