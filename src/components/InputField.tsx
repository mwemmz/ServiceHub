import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii } from '@/constants/theme';

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  editable?: boolean;
  multiline?: boolean;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  editable = true,
  multiline,
}: Props) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error && styles.fieldError, !editable && styles.disabled]}>
        {icon ? <Ionicons name={icon} size={20} color={Colors.textMuted} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          style={[styles.input, multiline && styles.multiline]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((value) => !value)} accessibilityLabel="Toggle password visibility">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '600' },
  field: {
    minHeight: 54,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldError: { borderColor: Colors.error },
  input: { flex: 1, color: Colors.charcoal, fontSize: FontSize.md, paddingVertical: 12 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: Colors.error, fontSize: FontSize.sm },
  disabled: { backgroundColor: Colors.cream },
});
