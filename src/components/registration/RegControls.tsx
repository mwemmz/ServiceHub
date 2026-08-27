import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  ActivityIndicator,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRegScroll } from '@/components/registration/RegScrollContext';
import { RegColors } from '@/constants/registrationTheme';

export function RegField({
  fieldKey,
  nextFieldKey,
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
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}: {
  fieldKey?: string;
  /** When set, keyboard Next focuses this field key (keeps keyboard open). */
  nextFieldKey?: string;
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
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  blurOnSubmit?: boolean;
}) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const { registerField, registerInput, focusField, scrollToField } = useRegScroll();

  useEffect(() => {
    if (!fieldKey) return;
    registerField(fieldKey, wrapRef.current);
    registerInput(fieldKey, inputRef.current);
    return () => {
      registerField(fieldKey, null);
      registerInput(fieldKey, null);
    };
  }, [fieldKey, registerField, registerInput]);

  function bindInput(node: TextInput | null) {
    inputRef.current = node;
    if (fieldKey) registerInput(fieldKey, node);
  }

  function bindWrap(node: View | null) {
    (wrapRef as MutableRefObject<View | null>).current = node;
    if (fieldKey) registerField(fieldKey, node);
  }
  const resolvedReturnKey: ReturnKeyTypeOptions =
    returnKeyType ?? (nextFieldKey ? 'next' : multiline ? 'default' : 'done');
  const resolvedBlurOnSubmit = blurOnSubmit ?? !nextFieldKey;

  function handleSubmitEditing() {
    if (nextFieldKey) {
      focusField(nextFieldKey);
      return;
    }
    onSubmitEditing?.({} as never);
  }

  return (
    <View
      ref={bindWrap}
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
          ref={bindInput}
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.42)"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry ? hidden : false}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          returnKeyType={resolvedReturnKey}
          blurOnSubmit={resolvedBlurOnSubmit}
          onSubmitEditing={handleSubmitEditing}
          enablesReturnKeyAutomatically={false}
          onFocus={() => {
            setFocused(true);
            if (fieldKey) scrollToField(fieldKey);
          }}
          onBlur={() => setFocused(false)}
          underlineColorAndroid="transparent"
          selectionColor="rgba(180,180,190,0.55)"
          autoFocus={false}
          showSoftInputOnFocus
          autoCorrect={false}
          importantForAutofill="yes"
          textContentType={secureTextEntry ? 'password' : 'none'}
          autoComplete={secureTextEntry ? 'password' : 'off'}
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
        styles.primaryOuter,
        blocked && styles.primaryDisabled,
        pressed && !blocked && { opacity: 0.9 },
      ]}>
      <LinearGradient
        colors={['#E8B07A', RegColors.gold, RegColors.goldDeep]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primary}>
        {loading ? (
          <>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.primaryLabel}>{loadingLabel}</Text>
          </>
        ) : (
          <Text style={styles.primaryLabel}>{label}</Text>
        )}
      </LinearGradient>
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
    borderColor: 'rgba(200,200,210,0.28)',
    backgroundColor: 'rgba(120,120,130,0.18)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /** Soft gray glow — not blue, not bright white */
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
  primaryOuter: {
    marginTop: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  primary: {
    minHeight: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  secondary: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryLabel: { color: RegColors.white, fontWeight: '700', fontSize: 14 },
});
