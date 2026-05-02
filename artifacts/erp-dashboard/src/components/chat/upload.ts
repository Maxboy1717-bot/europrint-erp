import { getAuthHeaders } from '@/lib/queryClient';

export interface UploadResult {
  publicUrl:    string;
  fileKey:      string;
  thumbnailUrl: string | null;
}

export async function uploadFile(
  file: File,
  purpose: 'file' | 'image' | 'voice' | 'video' = 'file',
): Promise<UploadResult> {
  const res = await fetch('/api/chat/upload/request-url', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      fileName: file.name,
      fileMime: file.type || 'application/octet-stream',
      fileSize: file.size,
      purpose,
    }),
  });
  if (!res.ok) throw new Error(`Upload URL request failed: HTTP ${res.status}`);
  const data = (await res.json()) as { uploadUrl: string; publicUrl: string; fileKey: string; thumbnailUrl: string | null };

  const uploadRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: HTTP ${uploadRes.status}`);

  return {
    publicUrl:    data.publicUrl,
    fileKey:      data.fileKey,
    thumbnailUrl: data.thumbnailUrl,
  };
}

export function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

export function isVideo(mime: string): boolean {
  return mime.startsWith('video/');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
