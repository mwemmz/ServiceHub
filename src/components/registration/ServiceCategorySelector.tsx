import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ServiceCategoryCard } from '@/components/registration/ServiceCategoryCard';
import { CATEGORY_REF, scaled } from '@/constants/serviceCategoryStep';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants/serviceCategories';
import { RegColors } from '@/constants/registrationTheme';
import type { CategoryId } from '@/types';

interface Props {
  /** Empty array = nothing selected on first load. */
  selectedCategoryIds: CategoryId[];
  error?: string;
  onToggle: (categoryId: CategoryId) => void;
}

function contentWidth(screenWidth: number) {
  return screenWidth - 14 * 2 - 20 * 2;
}

/**
 * Service-category picker — all three options use the same card component.
 * Supports multi-select with tap-to-toggle.
 */
export function ServiceCategorySelector({ selectedCategoryIds, error, onToggle }: Props) {
  const { width } = useWindowDimensions();
  const gap = scaled(CATEGORY_REF.cardGap, contentWidth(width));

  return (
    <View style={[styles.wrap, { gap }]}>
      {SERVICE_CATEGORY_OPTIONS.map((category) => (
        <ServiceCategoryCard
          key={category.id}
          category={category}
          selected={selectedCategoryIds.includes(category.id)}
          selectionMode="checkbox"
          onPress={() => onToggle(category.id)}
        />
      ))}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  err: {
    color: RegColors.error,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 2,
  },
});
