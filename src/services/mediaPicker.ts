import { Alert, Linking, Platform } from 'react-native';
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
      asked.canAskAgain
        ? [{ text: 'OK' }]
        : [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
    );
    return false;
  }
  return true;
}

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;

  const asked = await ImagePicker.requestCameraPermissionsAsync();
  if (!asked.granted) {
    Alert.alert(
      'Camera access needed',
      'Allow camera access to take a photo, or choose one from your gallery instead.',
      asked.canAskAgain
        ? [{ text: 'OK' }]
        : [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
    );
    return false;
  }
  return true;
}

/** Live camera capture — used on web where file inputs often open the gallery instead. */
async function captureWebcamPhoto(): Promise<PickedMedia | null> {
  if (typeof document === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.setAttribute('data-testid', 'webcam-overlay');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      background: 'rgba(0,0,0,0.92)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '24px',
    });

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    Object.assign(video.style, {
      width: 'min(320px, 90vw)',
      height: 'min(320px, 90vw)',
      borderRadius: '999px',
      objectFit: 'cover',
      background: '#111',
      transform: 'scaleX(-1)',
    });

    const hint = document.createElement('p');
    hint.textContent = 'Position your face in the circle';
    Object.assign(hint.style, {
      color: 'rgba(255,255,255,0.85)',
      fontSize: '14px',
      margin: '0',
      textAlign: 'center',
    });

    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    });

    const captureBtn = document.createElement('button');
    captureBtn.type = 'button';
    captureBtn.textContent = 'Capture photo';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';

    for (const btn of [captureBtn, cancelBtn]) {
      Object.assign(btn.style, {
        border: 'none',
        borderRadius: '999px',
        padding: '12px 20px',
        fontSize: '15px',
        fontWeight: '700',
        cursor: 'pointer',
      });
    }
    Object.assign(captureBtn.style, { background: '#D4A373', color: '#fff' });
    Object.assign(cancelBtn.style, { background: 'rgba(255,255,255,0.14)', color: '#fff' });

    let stream: MediaStream | null = null;

    function cleanup() {
      stream?.getTracks().forEach((track) => track.stop());
      overlay.remove();
    }

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    captureBtn.onclick = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        cleanup();
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      const uri = canvas.toDataURL('image/jpeg', 0.85);
      cleanup();
      resolve({ uri });
    };

    row.append(captureBtn, cancelBtn);
    overlay.append(hint, video, row);
    document.body.appendChild(overlay);

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      .then((mediaStream) => {
        stream = mediaStream;
        video.srcObject = mediaStream;
        void video.play().catch(() => undefined);
      })
      .catch(() => {
        cleanup();
        resolve(null);
      });
  });
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

/**
 * Opens the device camera.
 * - Web: live camera preview via getUserMedia (not a file picker).
 * - iOS/Android: native camera app via expo-image-picker.
 */
export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<PickedMedia | null> {
  if (Platform.OS === 'web') {
    const webcam = await captureWebcamPhoto();
    if (webcam) return webcam;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        return { uri: result.assets[0].uri };
      }
    } catch {
      // fall through to alert below
    }

    Alert.alert(
      'Camera unavailable',
      'Could not access your camera in the browser. Allow camera permission for this site, or choose a photo from your gallery.',
    );
    return null;
  }

  const ok = await ensureCameraPermission();
  if (!ok) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
      // Cropping in the native editor can prevent the camera from opening on some Android devices.
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.allowsEditing ? (options?.aspect ?? [1, 1]) : undefined,
    });

    if (result.canceled || !result.assets[0]?.uri) return null;
    return { uri: result.assets[0].uri };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not open the camera on this device.';
    Alert.alert('Camera unavailable', `${message} Try choosing from gallery instead.`);
    return null;
  }
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
