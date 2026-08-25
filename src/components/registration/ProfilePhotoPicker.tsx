import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RegColors } from '@/constants/registrationTheme';
import { pickFromGallery, takePhoto } from '@/services/mediaPicker';
import { RegSecondaryButton } from '@/components/registration/RegControls';

export function ProfilePhotoPicker({
  uri,
  onChange,
  size = 128,
  hint,
}: {
  uri: string;
  onChange: (next: string) => void;
  size?: number;
  hint?: string;
}) {
  const [busy, setBusy] = useState<'camera' | 'gallery' | null>(null);

  async function onCamera() {
    setBusy('camera');
    try {
      const picked = await takePhoto({ allowsEditing: true, aspect: [1, 1] });
      if (picked) onChange(picked.uri);
    } finally {
      setBusy(null);
    }
  }

  async function onGallery() {
    setBusy('gallery');
    try {
      const picked = await pickFromGallery({ allowsEditing: true, aspect: [1, 1] });
      if (picked) onChange(picked.uri);
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
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.actions}>
        <RegSecondaryButton
          label={uri ? 'Retake Photo' : 'Take Photo'}
          icon="camera-outline"
          loading={busy === 'camera'}
          loadingLabel="Opening camera…"
          onPress={onCamera}
        />
        <RegSecondaryButton
          label={uri ? 'Change Photo' : 'Choose from Gallery'}
          icon="images-outline"
          loading={busy === 'gallery'}
          loadingLabel="Opening gallery…"
          onPress={onGallery}
        />
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
  hint: { color: RegColors.whiteMuted, fontSize: 13, textAlign: 'center' },
  actions: { width: '100%', gap: 10 },
});
