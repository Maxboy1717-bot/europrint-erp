/**
 * @module upload
 * @description React UI component.
 */

import { apiRequest } from '@/lib/queryClient';

export interface UploadResult {
  publicUrl:    string;
  fileKey:      string;
  thumbnailUrl: string | null;
}

export async function uploadFile(
  file: File,
  purpose: 'file' | 'image' | 'voice' | 'video' = 'file',
): Promise<UploadResult> {
  // Step 1 — ask our backend for an S3 presigned upload URL.
  // Goes through apiRequest so auth + Result-envelope unwrapping happen
  // exactly like every other ERP call.
  const data = await apiRequest<{
    uploadUrl:    string;
    publicUrl:    string;
    fileKey:      string;
    thumbnailUrl: string | null;
  }>('POST', '/api/chat/upload/request-url', {
    fileName: file.name,
    fileMime: file.type || 'application/octet-stream',
    fileSize: file.size,
    purpose,
  });

  // Step 2 — PUT the file directly to S3 using the presigned URL. This MUST
  // be a raw fetch — apiRequest would attach our JWT, which invalidates the
  // S3 signature and trips a 403. Send as multipart/form-data; the browser
  // sets the Content-Type header (with boundary) automatically when we omit
  // it. @fastify/multipart handles this natively on the receiving end.
  const formData = new FormData();
  formData.append('file', file, file.name);
  const uploadRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    body: formData,
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
