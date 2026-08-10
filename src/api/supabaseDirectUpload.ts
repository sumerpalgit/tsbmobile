import ReactNativeBlobUtil from 'react-native-blob-util';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

/** RN port of web's `uploadFileDirectToSupabase` (`webSrc/src/lib/supabase-direct-upload.ts`) —
 * the ad-creative banner image bypasses the app's own backend entirely and goes straight to
 * Supabase Storage's REST API with the public anon key, same as web.
 *
 * Reads and uploads the picked file via `react-native-blob-util` rather than RN's own
 * `fetch(uri).blob()` — on this app's RN version, reading a local `file://` uri through `fetch`
 * throws a bare "Network request failed" with no HTTP response at all (confirmed on-device: the
 * request never leaves the phone). `react-native-blob-util` reads the file natively and streams
 * it as the request body directly, sidestepping RN's fetch-blob bridging entirely — the standard
 * fix for this exact class of RN networking issue. */
export async function uploadFileDirectToSupabase(
  fileUri: string,
  fileName: string,
  mimeType: string,
  folderPath: string,
  bucket = 'documents',
): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase upload is not configured.');
  }

  const normalizedProjectUrl = SUPABASE_URL.replace(/\/+$/, '');
  const normalizedFolderPath = folderPath.replace(/^\/+|\/+$/g, '');
  const safeName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueFileName = `${Date.now()}-${safeName}`;
  const objectPath = normalizedFolderPath ? `${normalizedFolderPath}/${uniqueFileName}` : uniqueFileName;

  const uploadUrl = `${normalizedProjectUrl}/storage/v1/object/${bucket}/${objectPath}`;
  const publicUrl = `${normalizedProjectUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  const localPath = fileUri.replace(/^file:\/\//, '');

  console.log('[uploadFileDirectToSupabase] POST', uploadUrl, JSON.stringify({ bucket, objectPath, mimeType, localPath }, null, 2));

  const res = await ReactNativeBlobUtil.fetch(
    'POST',
    uploadUrl,
    {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    ReactNativeBlobUtil.wrap(localPath),
  );

  const status = res.info().status;
  if (status < 200 || status >= 300) {
    const errorData = await res.json().catch(() => ({ message: 'Unknown upload error' }));
    throw new Error(errorData?.message || errorData?.error || 'Supabase upload failed.');
  }

  return publicUrl;
}
