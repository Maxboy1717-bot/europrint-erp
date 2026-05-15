/** @module FaceRegistration @description Route-level page component. Owns all state, queries, mutations, and camera logic. Delegates panel rendering to FaceRegistrationSections, camera card to FaceRegistrationCamera, and delete dialogs to FaceRegistrationDialogs. */

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLivenessDetection } from '@/hooks/useLivenessDetection';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { loadFaceApi } from '@/lib/faceApiLoader';
import { TRANSLATIONS } from './FaceRegistrationTypes';
import type { Employee, FaceEmbedding, RegisterFacePayload } from './FaceRegistrationTypes';
import { PageHeader, EmployeeSelectionPanel, RegisteredFacesList } from './FaceRegistrationSections';
import { CameraCaptureCard } from './FaceRegistrationCamera';
import { EPPageHeader, EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function FaceRegistration() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [lang, setLang] = useState<'uz' | 'ru'>('uz');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedFace, setCapturedFace] = useState<number[] | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<import('@/lib/faceApiLoader').FaceApiModule | null>(null);

  const {
    status: livenessStatus, blinkCount, timeRemaining, isDetecting,
    startChallenge, stopChallenge, resetLiveness,
  } = useLivenessDetection(videoRef);

  const text = TRANSLATIONS[lang];

  // Load face-api models once on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const faceapi = await loadFaceApi();
        faceApiRef.current = faceapi;
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch {
        // intentional: models may fail silently (CDN issues), badge reflects state
      } finally {
        setIsLoading(false);
      }
    };
    loadModels();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Toast on liveness state change
  useEffect(() => {
    if (livenessStatus === 'passed') {
      toast({ title: text.livenessPassed, description: text.blinkDetected });
    } else if (livenessStatus === 'failed') {
      toast({ title: text.livenessFailed, description: text.tryAgain, variant: 'destructive' });
    }
  }, [livenessStatus, text.livenessPassed, text.livenessFailed, text.blinkDetected, text.tryAgain, toast]);

  // Queries

  const {
    data: employees = [], isLoading: employeesLoading, isError, error, refetch,
  } = useQuery<Employee[]>({ queryKey: ['/api/employees-for-face'] });

  const { data: registeredFaces = [], isLoading: facesLoading } =
    useQuery<FaceEmbedding[]>({ queryKey: ['/api/face-embeddings'] });

  // Mutations

  const registerFaceMutation = useMutation({
    mutationFn: async (data: RegisterFacePayload) => {
      const payload: Record<string, unknown> = {
        employee_id: data.employeeId,
        confidence: data.confidence / 100,
      };
      if ((data.images ?? []).length > 0) {
        payload['images'] = data.images;
      } else {
        payload['embedding'] = data.embedding;
        payload['image_url'] = data.imageUrl || undefined;
      }
      return apiRequest('POST', '/api/hr/attendance/face/register', payload);
    },
    onSuccess: () => {
      toast({ title: text.success, description: text.faceRegistered });
      queryClient.invalidateQueries({ queryKey: ['/api/face-embeddings'] });
      setCapturedFace(null);
      setCapturedImageUrl(null);
      setDetectionConfidence(0);
      setCapturedFrames([]);
      resetLiveness();
    },
    onError: () => {
      toast({ title: text.error, description: 'Registration failed', variant: 'destructive' });
    },
  });

  const deleteFaceMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/face-embeddings/${id}`),
    onSuccess: () => {
      toast({ title: text.success, description: text.faceDeleted });
      queryClient.invalidateQueries({ queryKey: ['/api/face-embeddings'] });
    },
    onError: () => {
      toast({ title: text.error, description: 'Delete failed', variant: 'destructive' });
    },
  });

  // Camera handlers

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch {
      toast({ title: text.error, description: 'Camera access denied', variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    stopChallenge();
    resetLiveness();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
    setCapturedFace(null);
    setCapturedImageUrl(null);
    setCapturedFrames([]);
  };

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setIsLoading(true);
    try {
      const faceapi = faceApiRef.current ?? (await loadFaceApi());
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const embedding = Array.from(detection.descriptor);
        const confidence = Math.round(detection.detection.score * 100);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        let imageBase64 = '';
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedImageUrl(imageBase64);
        }
        setCapturedFace(embedding as number[]);
        setDetectionConfidence(confidence);
        if (imageBase64) {
          setCapturedFrames((prev) => {
            const next = [...prev, imageBase64].slice(-3);
            toast({
              title: text.faceDetected,
              description: `${text.confidence}: ${confidence}% · Rasm ${next.length}/3`,
            });
            return next;
          });
        } else {
          toast({ title: text.faceDetected, description: `${text.confidence}: ${confidence}%` });
        }
      } else {
        toast({ title: text.noFaceDetected, variant: 'destructive' });
      }
    } catch {
      toast({ title: text.error, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleRegisterFace = () => {
    if (!selectedEmployee || capturedFrames.length < 3) return;
    registerFaceMutation.mutate({
      employeeId: selectedEmployee.id,
      embedding: [],
      imageUrl: capturedImageUrl ?? '',
      confidence: detectionConfidence,
      images: capturedFrames,
    });
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    resetLiveness();
    setCapturedFace(null);
    setCapturedImageUrl(null);
  };

  // Derived flags

  const canCaptureFace = livenessStatus === 'passed' && isStreaming && Boolean(selectedEmployee);
  const showLivenessUI = isStreaming && Boolean(selectedEmployee);

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  // Render

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        breadcrumb={<>{t("dashboard9")}<b className="text-foreground">{t("page")}</b></>}
        title={t("page")}
        text={text}
        modelsLoaded={modelsLoaded}
        lang={lang}
        onToggleLang={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: employee selection */}
        <EmployeeSelectionPanel
          text={text}
          employees={Array.isArray(employees) ? employees : []}
          registeredFaces={Array.isArray(registeredFaces) ? registeredFaces : []}
          isLoading={employeesLoading}
          searchQuery={searchQuery}
          selectedEmployee={selectedEmployee}
          onSearchChange={setSearchQuery}
          onSelectEmployee={handleSelectEmployee}
        />

        {/* Centre: camera & face capture */}
        <CameraCaptureCard
          text={text}
          selectedEmployee={selectedEmployee}
          videoRef={videoRef}
          canvasRef={canvasRef}
          isStreaming={isStreaming}
          isLoading={isLoading}
          modelsLoaded={modelsLoaded}
          capturedFace={capturedFace}
          capturedImageUrl={capturedImageUrl}
          capturedFrames={capturedFrames}
          detectionConfidence={detectionConfidence}
          livenessStatus={livenessStatus}
          blinkCount={blinkCount}
          timeRemaining={timeRemaining}
          isDetecting={isDetecting}
          canCaptureFace={canCaptureFace}
          showLivenessUI={showLivenessUI}
          isRegisterPending={registerFaceMutation.isPending}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          onCaptureFace={captureFace}
          onRegisterFace={handleRegisterFace}
          onStartLiveness={() => { if (isStreaming && modelsLoaded) startChallenge(); }}
        />

        {/* Right: registered faces list */}
        <RegisteredFacesList
          text={text}
          faces={Array.isArray(registeredFaces) ? registeredFaces : []}
          isLoading={facesLoading}
          isDeletePending={deleteFaceMutation.isPending}
          onDeleteFace={(id) => deleteFaceMutation.mutate(id)}
        />
      </div>
    </div>
  );
}
