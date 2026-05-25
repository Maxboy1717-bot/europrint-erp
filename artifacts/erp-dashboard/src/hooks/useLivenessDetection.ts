/**
 * @module useLivenessDetection
 * @description React custom hook.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { loadFaceApi } from '@/lib/faceApiLoader';

export type LivenessStatus = 'idle' | 'challenging' | 'passed' | 'failed';

interface LivenessDetectionResult {
  status: LivenessStatus;
  blinkCount: number;
  timeRemaining: number;
  isDetecting: boolean;
  startChallenge: () => void;
  stopChallenge: () => void;
  resetLiveness: () => void;
}

const BLINK_THRESHOLD = 0.28;
const REQUIRED_BLINKS = 2;
const CHALLENGE_TIMEOUT = 15000;
const DETECTION_INTERVAL = 80;

interface FaceLandmarksWithEyes {
  getLeftEye: () => { x: number; y: number }[];
  getRightEye: () => { x: number; y: number }[];
}
function calculateEAR(landmarks: FaceLandmarksWithEyes): { leftEAR: number; rightEAR: number } {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();

  const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
    Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const leftEAR =
    (distance(leftEye[1], leftEye[5]) + distance(leftEye[2], leftEye[4])) /
    (2 * distance(leftEye[0], leftEye[3]));

  const rightEAR =
    (distance(rightEye[1], rightEye[5]) + distance(rightEye[2], rightEye[4])) /
    (2 * distance(rightEye[0], rightEye[3]));

  return { leftEAR, rightEAR };
}

export function useLivenessDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>
): LivenessDetectionResult {
  const [status, setStatus] = useState<LivenessStatus>('idle');
  const [blinkCount, setBlinkCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(CHALLENGE_TIMEOUT / 1000);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectionLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wasBlinkingRef = useRef(false);
  const blinkCountRef = useRef(0);

  const stopChallenge = useCallback(() => {
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  const startChallenge = useCallback(async () => {
    if (!videoRef.current) return;

    setStatus('challenging');
    setBlinkCount(0);
    blinkCountRef.current = 0;
    wasBlinkingRef.current = false;
    setTimeRemaining(CHALLENGE_TIMEOUT / 1000);
    setIsDetecting(true);

    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((CHALLENGE_TIMEOUT - elapsed) / 1000));
      setTimeRemaining(remaining);
    }, 100);

    timeoutRef.current = setTimeout(() => {
      stopChallenge();
      if (blinkCountRef.current >= REQUIRED_BLINKS) {
        setStatus('passed');
      } else {
        setStatus('failed');
      }
    }, CHALLENGE_TIMEOUT);

    detectionLoopRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const faceapi = await loadFaceApi();
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection) {
          const { leftEAR, rightEAR } = calculateEAR(detection.landmarks);
          const avgEAR = (leftEAR + rightEAR) / 2;
          const isBlinking = avgEAR < BLINK_THRESHOLD;

          if (wasBlinkingRef.current && !isBlinking) {
            blinkCountRef.current += 1;
            setBlinkCount(blinkCountRef.current);

            if (blinkCountRef.current >= REQUIRED_BLINKS) {
              stopChallenge();
              setStatus('passed');
            }
          }

          wasBlinkingRef.current = isBlinking;
        }
      } catch (error) {
        void import("@/lib/errorLogger").then(({ logClientError }) =>
          logClientError(error, "useLivenessDetection")
        );
      }
    }, DETECTION_INTERVAL);
  }, [videoRef, stopChallenge]);

  const resetLiveness = useCallback(() => {
    stopChallenge();
    setStatus('idle');
    setBlinkCount(0);
    setTimeRemaining(CHALLENGE_TIMEOUT / 1000);
    blinkCountRef.current = 0;
    wasBlinkingRef.current = false;
  }, [stopChallenge]);

  // Ensure intervals/timeouts are cleared when the component unmounts mid-challenge.
  useEffect(() => {
    return () => { stopChallenge(); };
  }, [stopChallenge]);

  return {
    status,
    blinkCount,
    timeRemaining,
    isDetecting,
    startChallenge,
    stopChallenge,
    resetLiveness,
  };
}
