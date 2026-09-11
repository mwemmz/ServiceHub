import { StyleSheet, Text, View } from 'react-native';
import { ProfilePhotoPicker } from '@/components/registration/ProfilePhotoPicker';
import { ProviderPortfolioStep } from '@/components/registration/ProviderPortfolioStep';
import { RegField } from '@/components/registration/RegControls';
import { RegColors } from '@/constants/registrationTheme';
import type { ProviderPortfolioItem, ProviderRegistrationService } from '@/types/providerRegistration';

interface Props {
  description: string;
  faceUri: string;
  categoryLabel: string;
  serviceDetails: Record<string, ProviderRegistrationService>;
  errors: Record<string, string>;
  /** Photo verification before portfolio upload. */
  mode?: 'photo' | 'portfolio' | 'all';
  onChangeDescription: (description: string) => void;
  onChangePhoto: (uri: string) => void;
  onAddPortfolioItem: (serviceId: string, uri: string) => void;
  onRemovePortfolioItem: (serviceId: string, itemId: string) => void;
  onUpdatePortfolioItem: (
    serviceId: string,
    itemId: string,
    patch: Partial<ProviderPortfolioItem>,
  ) => void;
  onReplacePortfolioPhoto: (serviceId: string, itemId: string, uri: string) => void;
}

export function BusinessProfileSetupStep({
  description,
  faceUri,
  categoryLabel,
  serviceDetails,
  errors,
  mode = 'all',
  onChangeDescription,
  onChangePhoto,
  onAddPortfolioItem,
  onRemovePortfolioItem,
  onUpdatePortfolioItem,
  onReplacePortfolioPhoto,
}: Props) {
  const groups = [
    {
      title: categoryLabel,
      items: Object.values(serviceDetails).map((detail) => ({
        id: detail.serviceId,
        label: detail.serviceName,
      })),
    },
  ];

  const showPhoto = mode === 'photo' || mode === 'all';
  const showPortfolio = mode === 'portfolio' || mode === 'all';

  return (
    <View style={styles.wrap}>
      {showPhoto ? (
        <>
          <Text style={styles.sectionTitle}>Business Description</Text>
          <RegField
            fieldKey="businessDescription"
            label="About your business"
            value={description}
            onChangeText={onChangeDescription}
            multiline
            autoCapitalize="sentences"
            variant="glass"
          />

          <Text style={styles.sectionTitle}>Verification Photo</Text>
          <ProfilePhotoPicker
            uri={faceUri}
            size={120}
            onChange={onChangePhoto}
            hint="Take a clear verification photo with the camera, or choose a logo from your gallery."
          />
          {errors.face ? <Text style={styles.err}>{errors.face}</Text> : null}
        </>
      ) : null}

      {showPortfolio ? (
        <ProviderPortfolioStep
          groups={groups}
          serviceDetails={serviceDetails}
          errors={errors}
          onAddPortfolioItem={onAddPortfolioItem}
          onRemovePortfolioItem={onRemovePortfolioItem}
          onUpdatePortfolioItem={onUpdatePortfolioItem}
          onReplacePortfolioPhoto={onReplacePortfolioPhoto}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  sectionTitle: {
    color: RegColors.white,
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 24,
  },
  err: { color: RegColors.error, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
