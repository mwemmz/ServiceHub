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
import { composeZambianPhone, nationalDigitsFromPhone } from '@/utils/registrationValidation';

export function RegField({
  fieldKey,
  nextFieldKey,
  label,
  value,
  onChangeText,
  placeholder: _placeholder,
  keyboardType,
  autoCapitalize = 'none',
  secureTextEntry,
  error,
  multiline,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  variant = 'default',
  countryCodePrefix,
  onFocus,
  onBlur,
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
  /** `glass` — premium translucent fields with soft grey/white glow (service details step). */
  variant?: 'default' | 'glass';
  /** Non-editable country code shown before the input (e.g. +260). */
  countryCodePrefix?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isGlass = variant === 'glass';
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
      style={[styles.wrap, isGlass && styles.glassWrap]}
      collapsable={false}
      nativeID={fieldKey ? `reg-field-${fieldKey}` : undefined}>
      <Text style={[styles.label, isGlass && styles.glassLabel]}>{label}</Text>
      <View
        {...(Platform.OS === 'web'
          ? ({
              onMouseEnter: () => setHovered(true),
              onMouseLeave: () => setHovered(false),
            } as object)
          : {})}
        style={[
          styles.field,
          isGlass && styles.glassField,
          isGlass && multiline && styles.glassFieldMultiline,
          isGlass && hovered && !focused && styles.glassFieldHover,
          focused && (isGlass ? styles.glassFieldFocused : styles.fieldFocused),
          error ? styles.fieldError : null,
          !editable && styles.disabled,
        ]}>
        {countryCodePrefix ? (
          <Text style={[styles.prefix, isGlass && styles.glassPrefix]}>{countryCodePrefix}</Text>
        ) : null}
        <TextInput
          ref={bindInput}
          style={[
            styles.input,
            multiline && styles.multiline,
            isGlass && styles.glassInput,
            isGlass && multiline && styles.glassMultilineInput,
          ]}
          value={countryCodePrefix ? nationalDigitsFromPhone(value) : value}
          onChangeText={(text) =>
            onChangeText(countryCodePrefix ? composeZambianPhone(text) : text)
          }
          placeholder={undefined}
          placeholderTextColor={isGlass ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.42)'}
          maxLength={countryCodePrefix ? 9 : undefined}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry ? !passwordVisible : false}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          returnKeyType={resolvedReturnKey}
          blurOnSubmit={resolvedBlurOnSubmit}
          onSubmitEditing={handleSubmitEditing}
          enablesReturnKeyAutomatically={false}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
            if (fieldKey) {
              scrollToField(fieldKey);
              if (Platform.OS === 'web') {
                setTimeout(() => scrollToField(fieldKey), 120);
                setTimeout(() => scrollToField(fieldKey), 320);
              }
            }
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
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
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}>
            <Ionicons
              name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
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
  style,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  style?: object;
  /** `reference` — warm tan pill from service-category mockup */
  variant?: 'default' | 'reference';
}) {
  const blocked = disabled || loading;
  const gradient =
    variant === 'reference'
      ? (['#DDB07A', '#C9A06C', '#C4894A'] as const)
      : (['#E8B07A', RegColors.gold, RegColors.goldDeep] as const);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryOuter,
        style,
        blocked && styles.primaryDisabled,
        pressed && !blocked && { opacity: 0.9 },
      ]}>
      <LinearGradient
        colors={[...gradient]}
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
  prefix: {
    color: RegColors.whiteSoft,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 2,
  },
  glassPrefix: {
    color: 'rgba(255,255,255,0.94)',
  },
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
  /** Provider form — comfortable readable sizes for glass fields */
  glassWrap: { gap: 8 },
  glassLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.94)',
    letterSpacing: 0.1,
  },
  glassField: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(210, 218, 228, 0.48)',
    backgroundColor: 'rgba(118, 108, 98, 0.16)',
    paddingHorizontal: 16,
    minHeight: 54,
    ...Platform.select({
      ios: {
        shadowColor: '#D8DCE4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: {
        backdropFilter: 'blur(8px) saturate(120%)',
        WebkitBackdropFilter: 'blur(8px) saturate(120%)',
        boxShadow:
          '0 0 0 1px rgba(200, 208, 220, 0.18), 0 0 10px rgba(180, 188, 200, 0.22)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
      } as object,
      default: {},
    }),
  },
  glassFieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 4,
    minHeight: 100,
  },
  glassFieldHover: Platform.select({
    web: {
      borderColor: 'rgba(228, 234, 244, 0.62)',
      boxShadow:
        '0 0 0 1px rgba(210, 218, 230, 0.28), 0 0 14px rgba(195, 203, 215, 0.32)',
    } as object,
    default: {},
  }),
  glassFieldFocused: {
    borderColor: 'rgba(242, 246, 252, 0.82)',
    backgroundColor: 'rgba(130, 120, 110, 0.22)',
    ...Platform.select({
      ios: {
        shadowColor: '#E8ECF4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        boxShadow:
          '0 0 0 1px rgba(230, 236, 246, 0.45), 0 0 18px rgba(210, 218, 230, 0.48)',
      } as object,
      default: {},
    }),
  },
  glassInput: {
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
  },
  glassMultilineInput: {
    minHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  error: { color: RegColors.error, fontSize: 13, flex: 1, lineHeight: 18 },
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
  primaryLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
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
  secondaryLabel: { color: RegColors.white, fontWeight: '700', fontSize: 15 },
});
