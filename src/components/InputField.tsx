import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
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

/** Glass input — same language as Create Account RegField. */
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
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error && styles.fieldError,
          !editable && styles.disabled,
        ]}>
        {icon ? <Ionicons name={icon} size={20} color={Colors.accent} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          underlineColorAndroid="transparent"
          selectionColor="rgba(255,255,255,0.35)"
          style={[styles.input, multiline && styles.multiline]}
          {...(Platform.OS === 'web'
            ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
            : {})}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((v) => !v)} accessibilityLabel="Toggle password visibility">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.accent} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: Colors.whiteSoft, fontSize: FontSize.sm, fontWeight: '600' },
  field: {
    minHeight: 50,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldFocused: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.75)',
  },
  fieldError: { borderColor: 'rgba(255,138,122,0.9)' },
  input: {
    flex: 1,
    color: Colors.charcoal,
    fontSize: FontSize.md,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: Colors.error, fontSize: FontSize.sm },
  disabled: { opacity: 0.55 },
});
