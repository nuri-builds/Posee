import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Linking } from 'react-native';

/**
 * Runtime permission helpers.
 *
 * iOS: the NSCameraUsageDescription, NSPhotoLibraryAddUsageDescription and
 * NSPhotoLibraryUsageDescription strings are set by the config plugins in
 * app.json. Android: CAMERA and the scoped media permissions are added by the
 * same plugins, and RECORD_AUDIO plus location permissions are blocked.
 *
 * Every helper follows the same pattern:
 *  1. If already granted, return true.
 *  2. If the OS can still show its dialog, ask.
 *  3. If the user chose "Don't ask again", explain why and offer Settings.
 */

type PermissionLike = { granted: boolean; canAskAgain: boolean };

async function ensure(
  get: () => Promise<PermissionLike>,
  request: () => Promise<PermissionLike>,
  blockedTitle: string,
  blockedBody: string,
): Promise<boolean> {
  const current = await get();
  if (current.granted) return true;
  if (current.canAskAgain) {
    const next = await request();
    if (next.granted) return true;
    if (next.canAskAgain) return false; // User said "no" this time. Respect it and don't nag.
  }
  Alert.alert(blockedTitle, blockedBody, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
  return false;
}

export function ensureCameraPermission(): Promise<boolean> {
  return ensure(
    Camera.getCameraPermissionsAsync,
    Camera.requestCameraPermissionsAsync,
    'Camera access is off',
    'Posee needs the camera to show your live preview with the pose overlay. Nothing is recorded or uploaded. Turn on Camera access for Posee in Settings.',
  );
}

/**
 * Write-only ("add photos") access is all we need to save captures. We never
 * read the user's library through this permission. Picking a reference photo
 * uses the system photo picker, which needs no library permission on iOS 14+
 * or Android 13+.
 */
export function ensureSavePermission(): Promise<boolean> {
  return ensure(
    () => MediaLibrary.getPermissionsAsync(true, ['photo']),
    () => MediaLibrary.requestPermissionsAsync(true, ['photo']),
    'Saving to Photos is off',
    'Posee saves your shots straight to your Photos library on this device. Turn on Photos access for Posee in Settings.',
  );
}
