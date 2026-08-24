import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';
import { initials } from '@/utils/format';

interface Props {
  name: string;
  uri?: string;
  size?: number;
}

export function Avatar({ name, size = 48 }: Props) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: Colors.accentDark, fontWeight: '800' },
});
