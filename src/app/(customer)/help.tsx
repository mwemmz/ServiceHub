import { StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, FontSize } from '@/constants/theme';

export default function HelpScreen() {
  return (
    <Screen scroll>
      <ScreenHeader title="Help" subtitle="ServiceHub support" fallbackHref="/(customer)/(tabs)/profile" />
      <Text style={styles.body}>
        ServiceHub is a local marketplace for Beauty, Cleaning and Repair services. Bookings in this version are stored
        on your device so you can try the full flow before a backend is connected.
      </Text>
      <Text style={styles.body}>Need help later? A support chat and phone line will be added with the live API.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: Colors.textMuted, lineHeight: 22, fontSize: FontSize.md, marginTop: 12 },
});
