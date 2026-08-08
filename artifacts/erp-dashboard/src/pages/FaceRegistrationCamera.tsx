/** @module FaceRegistrationCamera @description CameraCaptureCard component — the centre column of the FaceRegistration page. Renders the video viewport, liveness-challenge overlay, confidence bar, camera control buttons, and the register button. Fully controlled: all state and handlers are passed as props from the parent page. */

import type { RefObject } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, UserPlus, CheckCircle, XCircle, Video, VideoOff, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Employee, LivenessStatus } from './FaceRegistrationTypes';
import { EPStatusPill, EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import type { UseTranslationReturn } from '@/lib/i18n';

type TFunc = UseTranslationReturn['t'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CameraCaptureCardProps {
  t: TFunc;
  selectedEmployee: Employee | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  isLoading: boolean;
  modelsLoaded: boolean;
  capturedFace: number[] | null;
  capturedImageUrl: string | null;
  capturedFrames: string[];
  detectionConfidence: number;
  livenessStatus: LivenessStatus;
  blinkCount: number;
  timeRemaining: number;
  isDetecting: boolean;
  canCaptureFace: boolean;
  showLivenessUI: boolean;
  isRegisterPending: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureFace: () => void;
  onRegisterFace: () => void;
  onStartLiveness: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CameraCaptureCard({
  t, selectedEmployee, videoRef, canvasRef, isStreaming, isLoading,
  modelsLoaded, capturedFace, capturedImageUrl, capturedFrames,
  detectionConfidence, livenessStatus, blinkCount, timeRemaining, isDetecting,
  canCaptureFace, showLivenessUI, isRegisterPending,
  onStartCamera, onStopCamera, onCaptureFace, onRegisterFace, onStartLiveness,
}: CameraCaptureCardProps) {
  const { t: tCommon } = useTranslation("common");
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {selectedEmployee ? selectedEmployee.fullName : t('FaceReg.noEmployeeSelected')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Video viewport */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 border-4 border-primary">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            data-testid="video-camera"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedEmployee ? t('FaceReg.startCamera') : t('FaceReg.noEmployeeSelected')}
                </p>
              </div>
            </div>
          )}

          {livenessStatus === 'challenging' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
              <div className="bg-background/90 rounded-lg p-4 text-center min-w-[200px]">
                <Eye className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                <p className="font-medium text-lg mb-2">{t('FaceReg.blinkChallenge')}</p>
                <div className="flex items-center justify-center gap-4 text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {t('FaceReg.blinkCount')}: <strong>{blinkCount}/2</strong>
                  </span>
                  <span>{t('FaceReg.timeLeft')}: <strong>{timeRemaining}s</strong></span>
                </div>
                <Progress value={(blinkCount / 2) * 100} className="h-2" />
              </div>
            </div>
          )}

          {showLivenessUI && livenessStatus !== 'idle' && livenessStatus !== 'challenging' && (
            <div className="absolute top-2 right-2">
              {livenessStatus === 'passed' ? (
                <Badge className="bg-[var(--ep-green)] text-white gap-1">
                  <CheckCircle className="h-3 w-3" /> {t('FaceReg.livenessPassed')}
                </Badge>
              ) : livenessStatus === 'failed' ? (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> {t('FaceReg.livenessFailed')}
                </Badge>
              ) : null}
            </div>
          )}

          <div className="absolute inset-0 border-4 border-primary rounded-full pointer-events-none opacity-20" />

          {capturedImageUrl && (
            <div className="absolute bottom-2 right-2 w-20 h-20 rounded-lg overflow-hidden border-2 border-green-500">
              <img src={capturedImageUrl} alt={tCommon("captured")} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Liveness status panel (not yet passed) */}
        {showLivenessUI && livenessStatus !== 'passed' && (
          <div className={`mb-4 p-3 rounded-lg ${
            livenessStatus === 'failed'
              ? 'bg-destructive/10'
              : livenessStatus === 'challenging'
                ? 'bg-primary/10'
                : 'bg-muted'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1">
                <Eye className="h-4 w-4" /> {t('FaceReg.livenessCheck')}
              </span>
              {livenessStatus === 'failed' && (
                <EPStatusPill tone="danger" className="text-xs">{t('FaceReg.livenessFailed')}</EPStatusPill>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {livenessStatus === 'idle' && t('FaceReg.livenessRequired')}
              {livenessStatus === 'challenging' && `${t('FaceReg.blinkChallenge')}...`}
              {livenessStatus === 'failed' && t('FaceReg.tryAgain')}
            </p>
            {(livenessStatus === 'idle' || livenessStatus === 'failed') && (
              <Button
                size="sm"
                onClick={onStartLiveness}
                disabled={!modelsLoaded || isDetecting}
                className="w-full"
                data-testid="button-start-liveness"
              >
                {livenessStatus === 'failed' ? (
                  <><RefreshCw className="mr-2 h-4 w-4" /> {t('FaceReg.tryAgain')}</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" /> {t('FaceReg.startLiveness')}</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Liveness passed — prompt user to capture */}
        {showLivenessUI && livenessStatus === 'passed' && !capturedFace && (
          <div className="mb-4 p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-green)]" />
              <span className="text-sm font-medium text-[var(--ep-green)]">{t('FaceReg.livenessPassed')}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('FaceReg.nowCapture')}</p>
          </div>
        )}

        {/* Face captured — confidence bar */}
        {capturedFace && (
          <div className="mb-4 p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--ep-green)]">{t('FaceReg.faceDetected')}</span>
              <Badge variant="outline" className="text-[var(--ep-green)] border-green-600">
                {detectionConfidence}%
              </Badge>
            </div>
            <Progress value={detectionConfidence} className="h-2" />
          </div>
        )}

        {/* Camera control buttons */}
        <div className="flex gap-2">
          {isStreaming ? (
            <>
              <Button
                variant="outline"
                onClick={onStopCamera}
                className="flex-1 gap-2"
                data-testid="button-stop-camera"
              >
                <VideoOff className="h-4 w-4" /> {t('FaceReg.stopCamera')}
              </Button>
              <Button
                onClick={onCaptureFace}
                disabled={isLoading || !canCaptureFace || isDetecting || capturedFrames.length >= 3}
                className="flex-1"
                data-testid="button-capture-face"
              >
                {isLoading
                  ? <EPLoader className="mr-2" />
                  : <Camera className="mr-2 h-4 w-4" />}
                {capturedFrames.length > 0
                  ? `${t('FaceReg.captureFace')} (${capturedFrames.length}/3)`
                  : t('FaceReg.captureFace')}
              </Button>
            </>
          ) : (
            <Button
              onClick={onStartCamera}
              disabled={!modelsLoaded || !selectedEmployee}
              className="w-full gap-2"
              data-testid="button-start-camera"
            >
              <Video className="h-4 w-4" /> {t('FaceReg.startCamera')}
            </Button>
          )}
        </div>

        {/* Liveness warning */}
        {isStreaming && selectedEmployee && livenessStatus !== 'passed' && !isDetecting && (
          <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg flex items-center gap-2 text-xs text-[var(--ep-yellow)] dark:text-yellow-500">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{t('FaceReg.livenessRequired')}</span>
          </div>
        )}

        {/* Frame progress bar + register button */}
        {capturedFrames.length > 0 && selectedEmployee && (
          <>
            <div className="mt-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    i < capturedFrames.length ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={onRegisterFace}
              disabled={isRegisterPending || capturedFrames.length < 3}
              className="w-full mt-3"
              data-testid="button-register-face"
            >
              {isRegisterPending
                ? <EPLoader className="mr-2" />
                : <UserPlus className="mr-2 h-4 w-4" />}
              {capturedFrames.length >= 3
                ? `${t('FaceReg.registerFace')} (3 rasm)`
                : t('FaceReg.registerFace')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
