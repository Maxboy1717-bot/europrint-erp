/**
 * @module useChatVideoCall
 * @description Manages video call state and the handleVideoCall callback.
 * Split from ChatLayout.tsx (Rule 16).
 */

import { useCallback, useState } from "react";
import type { ChatRoom } from "@/store/chatStore";
import { getChatApiBase } from "@/lib/apiBase";
import { apiRequest } from "@/lib/queryClient";
import { VIDEO_HEIGHT_DEFAULT, VIDEO_HEIGHT_EXPANDED } from "./ChatLayoutTypes";

export function useChatVideoCall(
  activeRoomId: string | null,
  activeRoom: ChatRoom | null,
  sendMessage: (roomId: string, content: string) => void,
) {
  const [videoCallUrl, setVideoCallUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoHeight, setVideoHeight] = useState(VIDEO_HEIGHT_DEFAULT);
  const [videoMinimized, setVideoMinimized] = useState(false);

  const handleVideoCall = useCallback(async () => {
    if (!activeRoomId || !activeRoom) return;
    if (videoCallUrl) { setVideoCallUrl(null); return; }
    setVideoLoading(true);
    try {
      const data = await apiRequest<{
        token: string | null; jitsiUrl: string; roomName: string; embedUrl: string;
      }>('POST', `${getChatApiBase()}/video/token`, { roomId: activeRoomId });
      const separator = data.embedUrl.includes("#") ? "&" : "#";
      const configFlags = [
        "config.prejoinPageEnabled=false",
        "config.startWithAudioMuted=false",
        "config.startWithVideoMuted=false",
        "config.disableDeepLinking=true",
        "config.hideConferenceSubject=false",
        "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
        'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","tileview","fullscreen"]',
      ].join("&");
      const callUrl = data.embedUrl.includes("config.prejoinPageEnabled")
        ? data.embedUrl
        : `${data.embedUrl}${separator}${configFlags}`;
      sendMessage(
        activeRoomId,
        `🎥 Video qo'ng'iroq boshlandi. Qo'shilish: ${data.embedUrl.split("#")[0].split("?jwt=")[0]}`
      );
      setVideoCallUrl(callUrl);
      setVideoMinimized(false);
    } catch {
      const roomSlug = `europrint-room-${activeRoomId}`;
      const callUrl = `https://meet.jit.si/${roomSlug}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true`;
      sendMessage(activeRoomId, `🎥 Video qo'ng'iroq: https://meet.jit.si/${roomSlug}`);
      setVideoCallUrl(callUrl);
      setVideoMinimized(false);
    } finally {
      setVideoLoading(false);
    }
  }, [activeRoomId, activeRoom, sendMessage, videoCallUrl]);

  const handleVideoToggleHeight = useCallback(() => {
    setVideoHeight((h) => (h >= VIDEO_HEIGHT_EXPANDED ? VIDEO_HEIGHT_DEFAULT : VIDEO_HEIGHT_EXPANDED));
  }, []);

  return {
    videoCallUrl, setVideoCallUrl, videoLoading,
    videoHeight, videoMinimized, setVideoMinimized,
    handleVideoCall, handleVideoToggleHeight,
  };
}
