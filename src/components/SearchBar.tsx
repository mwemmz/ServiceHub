import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onFilterPress?: () => void;
  editable?: boolean;
  onPress?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search for a service...',
  onSubmit,
  onFilterPress,
  editable = true,
  onPress,
}: Props) {
  const content = (
    <>
      <Ionicons name="search" size={18} color={Colors.textMuted} />
      {onPress ? (
        <Text style={[styles.input, !value && { color: Colors.textLight }]}>{value || placeholder}</Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          style={styles.input}
          editable={editable}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
      )}
      {onFilterPress ? (
        <Pressable onPress={onFilterPress} accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={18} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.wrap} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return <View style={styles.wrap}>{content}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, color: Colors.charcoal, fontSize: FontSize.md, paddingVertical: 12 },
});
