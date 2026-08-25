import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedMedia = { uri: string };

async function ensureLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!asked.granted) {
    Alert.alert(
      'Photo access needed',
      'Allow photo library access to choose an image, or continue without a photo.',
    );
    return false;
  }
  return true;
}

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Camera unavailable',
      'Camera capture is not available in the browser. Please choose a photo from your files instead.',
    );
    return false;
  }
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const asked = await ImagePicker.requestCameraPermissionsAsync();
  if (!asked.granted) {
    Alert.alert(
      'Camera access needed',
      'Allow camera access to take a photo, or choose one from your gallery instead.',
    );
    return false;
  }
  return true;
}

export async function pickFromGallery(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<PickedMedia | null> {
  const ok = await ensureLibraryPermission();
  if (!ok) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.75,
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return { uri: result.assets[0].uri };
}

export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<PickedMedia | null> {
  const ok = await ensureCameraPermission();
  if (!ok) return null;
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.75,
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return { uri: result.assets[0].uri };
}

/** Document / ID upload — gallery preferred, no forced crop. */
export async function pickDocumentImage(): Promise<PickedMedia | null> {
  const ok = await ensureLibraryPermission();
  if (!ok) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return { uri: result.assets[0].uri };
}
