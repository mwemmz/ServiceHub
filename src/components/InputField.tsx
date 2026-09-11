import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { composeZambianPhone, nationalDigitsFromPhone } from '@/utils/registrationValidation';

export type InputFieldHandle = {
  focus: () => void;
  blur: () => void;
};

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Non-editable country code shown before the input (e.g. +260). */
  countryCodePrefix?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  editable?: boolean;
  multiline?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  blurOnSubmit?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Glass input with Next/Done support and soft gray focus glow. */
export const InputField = forwardRef<InputFieldHandle, Props>(function InputField(
  {
    label,
    value,
    onChangeText,
    placeholder: _placeholder,
    icon,
    countryCodePrefix,
    secureTextEntry,
    keyboardType,
    autoCapitalize = 'none',
    error,
    editable = true,
    multiline,
    returnKeyType,
    onSubmitEditing,
    blurOnSubmit,
    onFocus,
    onBlur,
  },
  ref,
) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  const resolvedReturnKey: ReturnKeyTypeOptions =
    returnKeyType ?? (multiline ? 'default' : 'done');
  const resolvedBlurOnSubmit = blurOnSubmit ?? resolvedReturnKey !== 'next';

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
        {countryCodePrefix ? <Text style={styles.prefix}>{countryCodePrefix}</Text> : null}
        <TextInput
          ref={inputRef}
          value={countryCodePrefix ? nationalDigitsFromPhone(value) : value}
          onChangeText={(text) =>
            onChangeText(countryCodePrefix ? composeZambianPhone(text) : text)
          }
          placeholder={undefined}
          placeholderTextColor="rgba(255,255,255,0.42)"
          maxLength={countryCodePrefix ? 9 : undefined}
          secureTextEntry={secureTextEntry ? !passwordVisible : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          returnKeyType={resolvedReturnKey}
          blurOnSubmit={resolvedBlurOnSubmit}
          onSubmitEditing={onSubmitEditing}
          enablesReturnKeyAutomatically={false}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          underlineColorAndroid="transparent"
          selectionColor="rgba(180,180,190,0.55)"
          style={[styles.input, multiline && styles.multiline]}
          {...(Platform.OS === 'web'
            ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
            : {})}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}>
            <Ionicons
              name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.accent}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: Colors.whiteSoft, fontSize: FontSize.sm, fontWeight: '600' },
  prefix: {
    color: Colors.whiteSoft,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginRight: 2,
  },
  field: {
    minHeight: 50,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(200,200,210,0.28)',
    backgroundColor: 'rgba(120,120,130,0.18)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldFocused: {
    backgroundColor: 'rgba(140,140,150,0.28)',
    borderColor: 'rgba(190,190,200,0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#A8A8B0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
      web: {
        boxShadow: '0 0 0 1px rgba(170,170,180,0.55), 0 0 14px rgba(150,150,160,0.45)',
      } as object,
      default: {},
    }),
  },
  fieldError: {
    borderColor: 'rgba(255,138,122,0.9)',
    backgroundColor: 'rgba(255,138,122,0.1)',
  },
  input: {
    flex: 1,
    color: Colors.charcoal,
    fontSize: FontSize.md,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          WebkitTextFillColor: '#FFFFFF',
        } as object)
      : {}),
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: Colors.error, fontSize: FontSize.sm },
  disabled: { opacity: 0.55 },
});
