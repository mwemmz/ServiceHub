import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const pin = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;
  const title = size === 'lg' ? FontSize.hero : size === 'sm' ? FontSize.xl : 26;
  return (
    <View style={styles.wrap}>
      <View style={[styles.pin, { width: pin + 12, height: pin + 12, borderRadius: (pin + 12) / 3 }]}>
        <Ionicons name="location" size={pin} color="#FFFFFF" />
      </View>
      <Text style={[styles.title, { fontSize: title }]}>
        Service<Text style={styles.hub}>Hub</Text>
      </Text>
      <Text style={styles.tag}>— Solutions, Near You —</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  pin: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { color: Colors.charcoal, fontWeight: '800' },
  hub: { color: Colors.accent },
  tag: { color: Colors.textMuted, marginTop: 4, letterSpacing: 1, fontSize: FontSize.sm },
});
