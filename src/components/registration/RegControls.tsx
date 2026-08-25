import { useEffect, useRef, useState } from 'react';
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
import { useRegScroll } from '@/components/registration/RegScrollContext';
import { RegColors } from '@/constants/registrationTheme';

export function RegField({
  fieldKey,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  secureTextEntry,
  error,
  multiline,
  editable = true,
}: {
  fieldKey?: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  editable?: boolean;
}) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const { registerField } = useRegScroll();

  useEffect(() => {
    if (!fieldKey) return;
    registerField(fieldKey, wrapRef.current);
    return () => registerField(fieldKey, null);
  }, [fieldKey, registerField, error]);

  return (
    <View
      ref={wrapRef}
      style={styles.wrap}
      collapsable={false}
      nativeID={fieldKey ? `reg-field-${fieldKey}` : undefined}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
          !editable && styles.disabled,
        ]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry ? hidden : false}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          underlineColorAndroid="transparent"
          selectionColor="rgba(255,255,255,0.35)"
          autoFocus={false}
          showSoftInputOnFocus
          autoCorrect={false}
          importantForAutofill="no"
          textContentType={secureTextEntry ? 'oneTimeCode' : 'none'}
          autoComplete="off"
          {...(Platform.OS === 'web'
            ? ({ outlineStyle: 'none', outlineWidth: 0 } as object)
            : {})}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={RegColors.goldSoft}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={RegColors.error} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function RegPrimaryButton({
  label,
  onPress,
  loading,
  loadingLabel = 'Please wait…',
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
}) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        blocked && styles.primaryDisabled,
        pressed && !blocked && { opacity: 0.9 },
      ]}>
      <Text style={styles.primaryLabel}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

export function RegSecondaryButton({
  label,
  onPress,
  loading,
  loadingLabel = 'Please wait…',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const blocked = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondary,
        blocked && { opacity: 0.5 },
        pressed && !blocked && { opacity: 0.88 },
      ]}>
      {icon && !loading ? <Ionicons name={icon} size={18} color={RegColors.white} /> : null}
      <Text style={styles.secondaryLabel}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

export function RegError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.errorBanner}>{message}</Text>;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: RegColors.whiteSoft, fontSize: 13, fontWeight: '600' },
  field: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldFocused: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.75)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: {
        boxShadow: '0 0 0 1px rgba(255,255,255,0.35), 0 0 12px rgba(255,255,255,0.22)',
      } as object,
      default: {},
    }),
  },
  fieldError: {
    borderColor: 'rgba(255,138,122,0.9)',
    backgroundColor: 'rgba(255,138,122,0.08)',
  },
  disabled: { opacity: 0.55 },
  input: {
    flex: 1,
    color: RegColors.white,
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
          outlineColor: 'transparent',
          boxShadow: 'none',
          WebkitBoxShadow: 'none',
          backgroundImage: 'none',
          WebkitAppearance: 'none',
          appearance: 'none',
          WebkitTextFillColor: '#FFFFFF',
        } as object)
      : {}),
  },
  multiline: { minHeight: 88 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  error: { color: RegColors.error, fontSize: 12, flex: 1 },
  errorBanner: {
    color: RegColors.error,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  primary: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: RegColors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryLabel: { color: '#2C2420', fontWeight: '800', fontSize: 15 },
  secondary: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryLabel: { color: RegColors.white, fontWeight: '700', fontSize: 14 },
});
