import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';

export function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
}

export function formatDateTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export interface PillOption {
  key: string;
  label: string;
  value: string | undefined;
}

export function Pills({
  options,
  value,
  onChange,
}: {
  options: PillOption[];
  value?: string;
  onChange: (v?: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.pills}>
      {options.map((o) => {
        const active = (o.value ?? '') === (value ?? '');
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(active ? undefined : o.value)}
            style={[styles.pill, active && styles.pillOn]}
            accessibilityRole="button">
            <Text style={[styles.pillText, active && styles.pillTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function RolePill({ role }: { role: string }) {
  const tone =
    role === 'admin'
      ? { bg: Colors.accentSoft, fg: Colors.accentDark }
      : role === 'provider'
        ? { bg: Colors.providerBlue, fg: Colors.text }
        : { bg: 'rgba(125,219,176,0.22)', fg: Colors.success };
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: `${tone.fg}44` }]}>
      <Text style={[styles.pillText, { color: tone.fg, textTransform: 'capitalize' }]}>{role}</Text>
    </View>
  );
}

export function VerifiedPill({ verified }: { verified: boolean }) {
  const bg = verified ? 'rgba(125,219,176,0.22)' : 'rgba(255,138,122,0.22)';
  const fg = verified ? Colors.success : Colors.error;
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: `${fg}44` }]}>
      <Text style={[styles.pillText, { color: fg }]}>{verified ? 'Verified' : 'Unverified'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { gap: 8, paddingVertical: 4 },
  pill: {
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  pillOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  pillTextOn: { color: '#FFFFFF' },
});