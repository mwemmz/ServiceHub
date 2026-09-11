import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LocationPinMap } from '@/components/LocationPinMap';
import { PasswordPairFields } from '@/components/registration/PasswordPairFields';
import { RegField, RegSecondaryButton } from '@/components/registration/RegControls';
import { RegColors } from '@/constants/registrationTheme';
import type { GeoLocation } from '@/types';

interface Props {
  businessName: string;
  contactPhone: string;
  contactEmail: string;
  locationText: string;
  geo: GeoLocation | null;
  locating: boolean;
  errors: Record<string, string>;
  locationMessage?: string;
  password: string;
  confirm: string;
  onChange: (patch: {
    businessName?: string;
    contactPhone?: string;
    contactEmail?: string;
    locationText?: string;
  }) => void;
  onChangePassword: (password: string) => void;
  onChangeConfirm: (confirm: string) => void;
  onUseLocation: () => void;
}

export function BusinessInformationStep({
  businessName,
  contactPhone,
  contactEmail,
  locationText,
  geo,
  locating,
  errors,
  locationMessage,
  password,
  confirm,
  onChange,
  onChangePassword,
  onChangeConfirm,
  onUseLocation,
}: Props) {
  const autoGpsStarted = useRef(false);
  const { height: screenHeight } = useWindowDimensions();
  const mapHeight = screenHeight < 720 ? 140 : 180;

  useEffect(() => {
    if (autoGpsStarted.current || geo || locationText.trim()) return;
    autoGpsStarted.current = true;
    onUseLocation();
  }, [geo, locationText, onUseLocation]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Business Information</Text>
      <RegField
        fieldKey="businessName"
        nextFieldKey="contactPhone"
        label="Business Name"
        value={businessName}
        onChangeText={(businessName) => onChange({ businessName })}
        autoCapitalize="words"
        error={errors.businessName}
        variant="glass"
      />
      <RegField
        fieldKey="contactPhone"
        nextFieldKey="contactEmail"
        label="Business Phone Number"
        value={contactPhone}
        onChangeText={(contactPhone) => onChange({ contactPhone })}
        keyboardType="phone-pad"
        countryCodePrefix="+260"
        error={errors.contactPhone}
        variant="glass"
      />
      <RegField
        fieldKey="contactEmail"
        nextFieldKey="password"
        label="Business Email"
        value={contactEmail}
        onChangeText={(contactEmail) => onChange({ contactEmail })}
        keyboardType="email-address"
        error={errors.contactEmail}
        variant="glass"
      />

      <PasswordPairFields
        password={password}
        confirm={confirm}
        errors={errors}
        onChangePassword={onChangePassword}
        onChangeConfirm={onChangeConfirm}
        variant="glass"
        confirmNextFieldKey="location"
      />

      <Text style={styles.sectionTitle}>Business Location</Text>
      <Text style={styles.locationHint}>
        We use your GPS location to help customers find your business nearby.
      </Text>

      {locating ? (
        <View style={styles.locatingRow}>
          <ActivityIndicator color={RegColors.gold} />
          <Text style={styles.locatingText}>Detecting your GPS location…</Text>
        </View>
      ) : null}

      {geo ? (
        <View style={styles.mapWrap}>
          <LocationPinMap location={geo} height={mapHeight} />
        </View>
      ) : null}

      <RegSecondaryButton
        label={geo ? 'Refresh GPS Location' : 'Use My Current Location'}
        icon="locate-outline"
        loading={locating}
        loadingLabel="Getting GPS…"
        onPress={onUseLocation}
      />

      {locationMessage ? <Text style={styles.locationMsg}>{locationMessage}</Text> : null}

      <RegField
        fieldKey="location"
        label={geo ? 'Detected address' : 'Or enter address manually'}
        value={locationText}
        onChangeText={(locationText) => onChange({ locationText })}
        autoCapitalize="words"
        error={errors.location}
        variant="glass"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, width: '100%', maxWidth: '100%' },
  sectionTitle: {
    color: RegColors.white,
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 24,
    marginTop: 4,
  },
  locationHint: {
    color: RegColors.whiteSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  locatingText: {
    color: RegColors.goldSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  mapWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
  },
  locationMsg: {
    color: RegColors.error,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
