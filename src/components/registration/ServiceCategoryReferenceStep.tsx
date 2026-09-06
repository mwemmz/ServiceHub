import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ServiceCategoryCard } from '@/components/registration/ServiceCategoryCard';
import { RegPrimaryButton } from '@/components/registration/RegControls';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants/serviceCategories';
import { CATEGORY_REF, scaled } from '@/constants/serviceCategoryStep';
import { RegColors } from '@/constants/registrationTheme';
import type { CategoryId } from '@/types';

interface Props {
  selectedCategoryId: CategoryId | '';
  error?: string;
  onSelect: (categoryId: CategoryId) => void;
  onContinue: () => void;
  continueDisabled?: boolean;
}

/**
 * Service category picker — same glass card visuals as the reference design,
 * laid out as a normal vertical stack (no absolute full-screen image composite).
 */
export function ServiceCategoryReferenceStep({
  selectedCategoryId,
  error,
  onSelect,
  onContinue,
  continueDisabled,
}: Props) {
  const { width } = useWindowDimensions();
  const contentW = Math.max(280, width - 28 - 40);
  const gap = scaled(CATEGORY_REF.cardGap, contentW);
  const buttonMargin = scaled(CATEGORY_REF.buttonMarginTop, contentW);

  return (
    <View style={styles.wrap}>
      <View style={[styles.list, { gap }]}>
        {SERVICE_CATEGORY_OPTIONS.map((category) => (
          <ServiceCategoryCard
            key={category.id}
            category={category}
            selected={selectedCategoryId === category.id}
            selectionMode="radio"
            onPress={() => onSelect(category.id)}
          />
        ))}
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <RegPrimaryButton
        label="Continue"
        variant="reference"
        onPress={onContinue}
        disabled={continueDisabled}
        style={{ marginTop: buttonMargin, minHeight: scaled(CATEGORY_REF.buttonHeight, contentW) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 4,
  },
  list: {
    width: '100%',
    paddingVertical: 2,
  },
  err: {
    color: RegColors.error,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    ...Platform.select({ web: { userSelect: 'none' } as object, default: {} }),
  },
});
