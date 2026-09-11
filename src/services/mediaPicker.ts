import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type PickedMedia = { uri: string; fileName?: string };

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

async function ensureCameraPermission(deniedMessage?: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;

  const asked = await ImagePicker.requestCameraPermissionsAsync();
  if (!asked.granted) {
    Alert.alert(
      'Camera access needed',
      deniedMessage ??
        'Camera access is required to take your profile photo. Please allow camera permission and try again.',
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
  if (typeof document === 'undefined') return null;
  if (!window.isSecureContext) {
    Alert.alert(
      'Camera unavailable',
      'Browsers only allow the camera on secure sites (https) or localhost. Open the app on localhost, or use Choose from Gallery.',
    );
    return null;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    Alert.alert(
      'Camera unavailable',
      'This browser does not support camera access. Please choose a photo from your gallery instead.',
    );
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
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');
    Object.assign(video.style, {
      width: 'min(320px, 90vw)',
      height: 'min(320px, 90vw)',
      borderRadius: '999px',
      objectFit: 'cover',
      background: '#111',
      transform: 'scaleX(-1)',
    });

    const hint = document.createElement('p');
    hint.textContent = 'Starting camera…';
    Object.assign(hint.style, {
      color: 'rgba(255,255,255,0.85)',
      fontSize: '14px',
      margin: '0',
      maxWidth: '360px',
      textAlign: 'center',
      lineHeight: '1.4',
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
    captureBtn.disabled = true;
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
    Object.assign(captureBtn.style, {
      background: '#D4A373',
      color: '#fff',
      opacity: '0.5',
    });
    Object.assign(cancelBtn.style, { background: 'rgba(255,255,255,0.14)', color: '#fff' });

    let stream: MediaStream | null = null;
    let settled = false;

    function cleanup() {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      video.srcObject = null;
      overlay.remove();
    }

    function finish(result: PickedMedia | null) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    }

    function cameraErrorMessage(err: unknown): string {
      const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return 'Camera permission was blocked. Click the camera icon in the browser address bar, allow access, then try again — or choose a photo from your gallery.';
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return 'No camera was found on this device. Please choose a photo from your gallery instead.';
      }
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        return 'Your camera is busy or blocked by another app. Close other apps using the camera, then try again.';
      }
      if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
        return 'Could not start the camera with the requested settings. Please try again or choose from gallery.';
      }
      if (name === 'SecurityError') {
        return 'This browser blocked camera access for security reasons. Use https/localhost, or choose a photo from your gallery.';
      }
      const message = err instanceof Error ? err.message : '';
      return message
        ? `Could not start the camera: ${message}`
        : 'Could not start the camera. Please allow camera access or choose a photo from your gallery.';
    }

    function enableCapture() {
      captureBtn.disabled = false;
      captureBtn.style.opacity = '1';
      hint.textContent = 'Position your face in the circle';
    }

    cancelBtn.onclick = () => finish(null);

    captureBtn.onclick = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        hint.textContent = 'Camera is not ready yet. Wait for the preview, then try again.';
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        hint.textContent = 'Could not capture this frame. Please try again.';
        return;
      }
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      finish({ uri: canvas.toDataURL('image/jpeg', 0.85) });
    };

    row.append(captureBtn, cancelBtn);
    overlay.append(hint, video, row);
    document.body.appendChild(overlay);

    async function startCamera() {
      const attempts: MediaStreamConstraints[] = [
        { audio: false, video: { facingMode: 'user' } },
        { audio: false, video: { facingMode: { ideal: 'user' } } },
        { audio: false, video: true },
      ];

      let lastError: unknown;
      for (const constraints of attempts) {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          stream = mediaStream;
          video.srcObject = mediaStream;

          const markReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) enableCapture();
          };
          video.onloadedmetadata = () => {
            void video.play().then(markReady).catch(() => markReady());
          };
          video.onplaying = markReady;

          try {
            await video.play();
          } catch {
            // autoplay may still succeed via onloadedmetadata
          }

          // Some browsers report metadata slightly later.
          window.setTimeout(markReady, 400);
          window.setTimeout(() => {
            if (captureBtn.disabled) {
              hint.textContent =
                'Camera connected, but no preview yet. Check Windows privacy settings for camera access, then try again.';
            }
          }, 2500);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      hint.textContent = cameraErrorMessage(lastError);
      captureBtn.style.display = 'none';
      cancelBtn.textContent = 'Close';
    }

    void startCamera();
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
  return {
    uri: result.assets[0].uri,
    fileName: result.assets[0].fileName ?? undefined,
  };
}

/**
 * Opens the device camera.
 * - Web: live camera preview via getUserMedia (not a file picker).
 * - iOS/Android: native camera app via expo-image-picker.
 */
export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  permissionDeniedMessage?: string;
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
        return {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName ?? 'camera-photo.jpg',
        };
      }
    } catch {
      // fall through to alert below
    }

    Alert.alert(
      'Camera unavailable',
      options?.permissionDeniedMessage ??
        'Could not access your camera in the browser. Allow camera permission for this site, or choose a photo from your gallery.',
    );
    return null;
  }

  const ok = await ensureCameraPermission(options?.permissionDeniedMessage);
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
    return {
      uri: result.assets[0].uri,
      fileName: result.assets[0].fileName ?? 'camera-photo.jpg',
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Could not open the camera on this device.';
    Alert.alert(
      'Camera unavailable',
      options?.permissionDeniedMessage ??
        `${message} Please allow camera permission and try again.`,
    );
    return null;
  }
}

/** Document / ID upload — gallery preferred, no forced crop. */
export async function pickDocumentImage(): Promise<PickedMedia | null> {
  const ok = await ensureLibraryPermission();
  if (!ok) return null;
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      fileName: asset.fileName ?? fileNameFromUri(asset.uri),
    };
  } catch {
    Alert.alert('Upload failed', "We couldn't upload this document. Please try again.");
    return null;
  }
}

function fileNameFromUri(uri: string): string {
  const cleaned = uri.split('?')[0] ?? uri;
  const part = cleaned.split('/').pop() ?? 'document.jpg';
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}
