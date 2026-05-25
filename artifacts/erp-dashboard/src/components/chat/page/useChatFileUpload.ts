/**
 * @module useChatFileUpload
 * @description Handles file upload and voice-message recording for ChatLayout.
 * Split from ChatLayout.tsx (Rule 16).
 */

import { useCallback, useState } from "react";
import { getChatApiBase } from "@/lib/apiBase";
import { apiRequest } from "@/lib/queryClient";

export function useChatFileUpload(
  activeRoomId: string | null,
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string) => string,
) {
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleUploadFile = useCallback(
    async (file: File) => {
      if (!activeRoomId) return;
      const isImage = file.type.startsWith("image/");
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t("fileSizeLimitMsg", { limit: isImage ? "10MB" : "50MB" }));
        return;
      }
      setUploadProgress(t("loading"));
      try {
        let uploadUrl: string;
        let publicUrl: string;
        try {
          const data = await apiRequest<{ uploadUrl: string; publicUrl: string }>(
            'POST',
            `${getChatApiBase()}/upload/request-url`,
            { name: file.name, size: file.size, contentType: file.type, roomId: activeRoomId },
          );
          uploadUrl = data.uploadUrl;
          publicUrl = data.publicUrl;
        } catch (e) {
          alert((e as Error).message || t("uploadUrlError"));
          return;
        }
        setUploadProgress(t("fileUploading"));
        const formData = new FormData();
        formData.append("file", file, file.name);
        // NOTE: Direct PUT to external S3 presigned URL — NOT our backend.
        // apiRequest intentionally NOT used (would inject JWT into S3 presigned request).
        const uploadRes = await fetch(uploadUrl, { method: "PUT", body: formData });
        if (!uploadRes.ok) { alert(t("fileUploadError")); return; }
        setUploadProgress(t("messageSending"));
        try {
          await apiRequest('POST', `${getChatApiBase()}/upload/complete`, {
            roomId: activeRoomId, fileUrl: publicUrl,
            fileName: file.name, fileType: file.type, fileSize: file.size,
          });
        } catch {
          alert(t("messageSendError"));
        }
      } catch {
        alert(t("uploadError"));
      } finally {
        setUploadProgress(null);
      }
    },
    [activeRoomId, t],
  );

  const handleVoiceMessage = useCallback(
    async (blob: Blob, durationSec: number) => {
      const ext = blob.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([blob], `voice-${Date.now()}.${ext}`, {
        type: blob.type || "audio/webm",
      });
      void durationSec;
      await handleUploadFile(file);
    },
    [handleUploadFile],
  );

  return { uploadProgress, handleUploadFile, handleVoiceMessage };
}
