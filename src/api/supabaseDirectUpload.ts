import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

/** RN port of web's `uploadFileDirectToSupabase` (`webSrc/src/lib/supabase-direct-upload.ts`) —
 * the ad-creative banner image bypasses the app's own backend entirely and goes straight to
 * Supabase Storage's REST API with the public anon key, same as web. The only real difference:
 * RN has no `File` object, so the picked file's local `uri` is read into a `Blob` via `fetch`
 * first (a standard, well-supported RN technique for local-file uploads) before POSTing it. */
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
  const filePath = normalizedFolderPath ? `${normalizedFolderPath}/${uniqueFileName}` : uniqueFileName;

  const uploadUrl = `${normalizedProjectUrl}/storage/v1/object/${bucket}/${filePath}`;
  const publicUrl = `${normalizedProjectUrl}/storage/v1/object/public/${bucket}/${filePath}`;

  const blob = await (await fetch(fileUri)).blob();

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: blob,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Unknown upload error' }));
    throw new Error(errorData?.message || errorData?.error || 'Supabase upload failed.');
  }

  return publicUrl;
}
