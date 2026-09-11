import { useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RegColors } from '@/constants/registrationTheme';
import { pickFromGallery, takePhoto } from '@/services/mediaPicker';
import { RegSecondaryButton } from '@/components/registration/RegControls';

/**
 * Profile / verification photo picker.
 * - `cameraRequired`: individual providers — opens device camera; gallery hidden.
 * - default: camera + gallery (e.g. optional business assets — prefer not to use for individuals).
 */
export function ProfilePhotoPicker({
  uri,
  onChange,
  size = 128,
  hint,
  cameraRequired = false,
}: {
  uri: string;
  onChange: (next: string) => void;
  size?: number;
  hint?: string;
  /** When true, only camera capture is offered (Individual Service Providers). */
  cameraRequired?: boolean;
}) {
  const [busy, setBusy] = useState<'camera' | 'gallery' | null>(null);

  async function onCamera() {
    if (busy) return;
    setBusy('camera');
    try {
      const picked = await takePhoto({
        allowsEditing: false,
        permissionDeniedMessage:
          'Camera access is required to take your profile photo. Please allow camera permission and try again.',
      });
      if (picked) onChange(picked.uri);
    } catch {
      Alert.alert(
        'Camera unavailable',
        cameraRequired
          ? 'Camera access is required to take your profile photo. Please allow camera permission and try again.'
          : 'Could not open the camera. Try choosing a photo from your gallery instead.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function onGallery() {
    if (busy || cameraRequired) return;
    setBusy('gallery');
    try {
      const picked = await pickFromGallery({ allowsEditing: true, aspect: [1, 1] });
      if (picked) onChange(picked.uri);
    } catch {
      Alert.alert('Could not open gallery', 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Ionicons name="person" size={size * 0.38} color={RegColors.goldSoft} />
        )}
      </View>
      {uri ? <Text style={styles.captured}>Photo added</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.actions}>
        <RegSecondaryButton
          label={uri ? 'Retake Photo' : 'Take Photo'}
          icon="camera-outline"
          loading={busy === 'camera'}
          loadingLabel="Opening camera…"
          onPress={onCamera}
        />
        {!cameraRequired ? (
          <RegSecondaryButton
            label={uri ? 'Change Photo' : 'Choose from Gallery'}
            icon="images-outline"
            loading={busy === 'gallery'}
            loadingLabel="Opening gallery…"
            onPress={onGallery}
          />
        ) : Platform.OS !== 'web' ? (
          <Text style={styles.permissionHint}>
            If the camera does not open, enable camera access in{' '}
            <Text style={styles.permissionLink} onPress={() => Linking.openSettings()}>
              Settings
            </Text>
            .
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  circle: {
    borderWidth: 2,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  captured: {
    color: RegColors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: { color: RegColors.whiteMuted, fontSize: 13, textAlign: 'center' },
  actions: { width: '100%', gap: 10 },
  permissionHint: {
    color: RegColors.whiteMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionLink: { color: RegColors.gold, fontWeight: '700' },
});
