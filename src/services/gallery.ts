import * as MediaLibrary from 'expo-media-library';
import { ensureSavePermission } from './permissions';

/**
 * Saves a local file to the device's native camera roll or gallery.
 * This is the only place a captured photo is persisted. There is no network
 * call in this path.
 */
export async function saveToGallery(localUri: string): Promise<boolean> {
  const ok = await ensureSavePermission();
  if (!ok) return false;
  await MediaLibrary.Asset.create(localUri);
  return true;
}
