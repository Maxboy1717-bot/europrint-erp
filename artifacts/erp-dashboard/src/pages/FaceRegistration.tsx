import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLivenessDetection } from '@/hooks/useLivenessDetection';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Camera, User, UserPlus, Trash2, CheckCircle, XCircle, 
  Loader2, Search, Video, VideoOff, Eye, AlertTriangle, RefreshCw
} from 'lucide-react';
import { loadFaceApi } from '@/lib/faceApiLoader';
import { ErrorState } from "@/components/ui/error-state";

interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  profileImageUrl: string | null;
}

interface FaceEmbedding {
  id: string;
  employeeId: string;
  employeeName: string;
  imageUrl: string | null;
  isActive: boolean;
  confidence: number;
  createdAt: string;
}

export default function FaceRegistration() {
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
    status: livenessStatus,
    blinkCount,
    timeRemaining,
    isDetecting,
    startChallenge,
    stopChallenge,
    resetLiveness,
  } = useLivenessDetection(videoRef);

  const t = {
    uz: {
      title: "Yuz Ro'yxatdan O'tkazish",
      subtitle: "Xodimlar yuzini AI bazasiga qo'shish",
      selectEmployee: "Xodimni Tanlang",
      searchPlaceholder: "Ism yoki ID bo'yicha qidirish...",
      registeredFaces: "Ro'yxatdan O'tgan Yuzlar",
      startCamera: "Kamerani Yoqish",
      stopCamera: "Kamerani O'chirish",
      captureFace: "Yuzni Olish",
      registerFace: "Yuzni Ro'yxatdan O'tkazish",
      noEmployeeSelected: "Avval xodimni tanlang",
      faceDetected: "Yuz aniqlandi",
      noFaceDetected: "Yuz topilmadi",
      confidence: "Ishonchlilik",
      loading: "Yuklanmoqda...",
      delete: "O'chirish",
      success: "Muvaffaqiyatli",
      error: "Xatolik",
      faceRegistered: "Yuz muvaffaqiyatli ro'yxatdan o'tkazildi",
      faceDeleted: "Yuz o'chirildi",
      modelsLoading: "AI modellar yuklanmoqda...",
      modelsReady: "AI tayyor",
      noFaces: "Hali yuz ro'yxatdan o'tmagan",
      livenessCheck: "Jonli tekshiruv",
      blinkChallenge: "Ko'zingizni yuming",
      livenessRequired: "Avval jonli tekshiruvdan o'ting",
      livenessPassed: "Jonli tekshiruv muvaffaqiyatli",
      livenessFailed: "Jonli tekshiruv muvaffaqiyatsiz",
      tryAgain: "Qaytadan urinib ko'ring",
      blinkDetected: "Ko'z yumish aniqlandi",
      blinkCount: "Ko'z yumish",
      timeLeft: "Vaqt qoldi",
      startLiveness: "Tekshiruvni boshlash",
      nowCapture: "Endi yuzni olishingiz mumkin",
    },
    ru: {
      title: "Регистрация Лица",
      subtitle: "Добавление лиц сотрудников в базу AI",
      selectEmployee: "Выберите Сотрудника",
      searchPlaceholder: "Поиск по имени или ID...",
      registeredFaces: "Зарегистрированные Лица",
      startCamera: "Включить Камеру",
      stopCamera: "Выключить Камеру",
      captureFace: "Захватить Лицо",
      registerFace: "Зарегистрировать Лицо",
      noEmployeeSelected: "Сначала выберите сотрудника",
      faceDetected: "Лицо обнаружено",
      noFaceDetected: "Лицо не найдено",
      confidence: "Уверенность",
      loading: "Загрузка...",
      delete: "Удалить",
      success: "Успешно",
      error: "Ошибка",
      faceRegistered: "Лицо успешно зарегистрировано",
      faceDeleted: "Лицо удалено",
      modelsLoading: "Загрузка AI моделей...",
      modelsReady: "AI готов",
      noFaces: "Пока нет зарегистрированных лиц",
      livenessCheck: "Проверка живости",
      blinkChallenge: "Моргните глазами",
      livenessRequired: "Сначала пройдите проверку живости",
      livenessPassed: "Проверка живости пройдена",
      livenessFailed: "Проверка живости не пройдена",
      tryAgain: "Попробуйте снова",
      blinkDetected: "Моргание обнаружено",
      blinkCount: "Морганий",
      timeLeft: "Осталось",
      startLiveness: "Начать проверку",
      nowCapture: "Теперь вы можете захватить лицо",
    }
  };

  const text = t[lang];

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const faceapi = await loadFaceApi();
        faceApiRef.current = faceapi;
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        
        await Promise.all([ // try/catch blok ichida boshqariladi
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    
    loadModels();
  }, []);

  const { data: employees = [], isLoading: employeesLoading, isError, refetch} = useQuery<Employee[]>({
    queryKey: ['/api/employees-for-face'],
  });

  const { data: registeredFaces = [], isLoading: facesLoading } = useQuery<FaceEmbedding[]>({
    queryKey: ['/api/face-embeddings'],
  });

  const registerFaceMutation = useMutation({
    mutationFn: async (data: { employeeId: string; embedding: number[]; imageUrl: string; confidence: number; images?: string[] }) => {
      const payload: Record<string, unknown> = {
        employee_id: data.employeeId,
        confidence:  data.confidence / 100,
      };
      if ((data.images ?? []).length > 0) {
        payload['images'] = data.images;
      } else {
        payload['embedding']  = data.embedding;
        payload['image_url']  = data.imageUrl || undefined;
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
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/face-embeddings/${id}`);
    },
    onSuccess: () => {
      toast({ title: text.success, description: text.faceDeleted });
      queryClient.invalidateQueries({ queryKey: ['/api/face-embeddings'] });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      toast({ title: text.error, description: 'Camera access denied', variant: 'destructive' });
    }
  };

  const stopCamera = () => {
    stopChallenge();
    resetLiveness();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setCapturedFace(null);
    setCapturedImageUrl(null);
    setCapturedFrames([]);
  };

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    
    setIsLoading(true);
    
    try {
      const faceapi = faceApiRef.current || await loadFaceApi();
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detection) {
        const embedding  = Array.from(detection.descriptor);
        const confidence = Math.round(detection.detection.score * 100);

        const canvas    = document.createElement('canvas');
        canvas.width    = videoRef.current.videoWidth;
        canvas.height   = videoRef.current.videoHeight;
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
    } catch (error) {
      toast({ title: text.error, variant: 'destructive' });
    }
    
    setIsLoading(false);
  };

  const handleRegisterFace = () => {
    if (!selectedEmployee || capturedFrames.length < 3) return;

    registerFaceMutation.mutate({
      employeeId: selectedEmployee.id,
      embedding:  [],
      imageUrl:   capturedImageUrl || '',
      confidence: detectionConfidence,
      images:     capturedFrames,
    });
  };

  const handleStartLiveness = () => {
    if (!isStreaming || !modelsLoaded) return;
    startChallenge();
  };

  const filteredEmployees = (Array.isArray(employees) ? employees : []).filter(emp =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEmployeeFaceCount = (employeeId: string) => {
    return (Array.isArray(registeredFaces) ? registeredFaces : []).filter(f => f.employeeId === employeeId).length;
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (livenessStatus === 'passed') {
      toast({ 
        title: text.livenessPassed, 
        description: text.blinkDetected
      });
    } else if (livenessStatus === 'failed') {
      toast({ 
        title: text.livenessFailed, 
        description: text.tryAgain,
        variant: 'destructive' 
      });
    }
  }, [livenessStatus, text.livenessPassed, text.livenessFailed, text.blinkDetected, text.tryAgain, toast]);

  const canCaptureFace = livenessStatus === 'passed' && isStreaming && selectedEmployee;
  const showLivenessUI = isStreaming && selectedEmployee;

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Yuz <span className="font-bold text-primary">Ro'yxatdan O'tkazish</span>
          </h1>
          <p className="text-on-surface-variant">{text.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={modelsLoaded ? "default" : "secondary"} className="gap-1">
            {modelsLoaded ? (
              <><CheckCircle className="h-3 w-3" /> {text.modelsReady}</>
            ) : (
              <><Loader2 className="h-3 w-3 animate-spin" /> {text.modelsLoading}</>
            )}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
            data-testid="button-lang-toggle"
          >
            {lang === 'uz' ? 'RU' : 'UZ'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Employee Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {text.selectEmployee}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={text.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-employee"
              />
            </div>
            
            <ScrollArea className="h-[400px]">
              {employeesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(Array.isArray(filteredEmployees) ? filteredEmployees : []).map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        resetLiveness();
                        setCapturedFace(null);
                        setCapturedImageUrl(null);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                        selectedEmployee?.id === emp.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-muted border border-transparent'
                      }`}
                      data-testid={`employee-card-${emp.id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {emp.profileImageUrl ? (
                          <img src={emp.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">ID: {emp.employeeId}</p>
                      </div>
                      {getEmployeeFaceCount(emp.id) > 0 && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          {getEmployeeFaceCount(emp.id)} yuz
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Camera & Face Capture */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {selectedEmployee ? selectedEmployee.fullName : text.noEmployeeSelected}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      {selectedEmployee ? text.startCamera : text.noEmployeeSelected}
                    </p>
                  </div>
                </div>
              )}

              {/* Liveness Challenge Overlay */}
              {livenessStatus === 'challenging' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                  <div className="bg-background/90 rounded-lg p-4 text-center min-w-[200px]">
                    <Eye className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                    <p className="font-medium text-lg mb-2">{text.blinkChallenge}</p>
                    <div className="flex items-center justify-center gap-4 text-sm mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {text.blinkCount}: <strong>{blinkCount}/2</strong>
                      </span>
                      <span>{text.timeLeft}: <strong>{timeRemaining}s</strong></span>
                    </div>
                    <Progress value={(blinkCount / 2) * 100} className="h-2" />
                  </div>
                </div>
              )}

              {/* Liveness Status Badge */}
              {showLivenessUI && livenessStatus !== 'idle' && livenessStatus !== 'challenging' && (
                <div className="absolute top-2 right-2">
                  {livenessStatus === 'passed' ? (
                    <Badge className="bg-green-500 text-white gap-1">
                      <CheckCircle className="h-3 w-3" /> {text.livenessPassed}
                    </Badge>
                  ) : livenessStatus === 'failed' ? (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" /> {text.livenessFailed}
                    </Badge>
                  ) : null}
                </div>
              )}
              
              <div className="absolute inset-0 border-4 border-primary rounded-full pointer-events-none opacity-20" />

              {capturedImageUrl && (
                <div className="absolute bottom-2 right-2 w-20 h-20 rounded-lg overflow-hidden border-2 border-green-500">
                  <img src={capturedImageUrl} alt="Captured" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Liveness Status Section */}
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
                    <Eye className="h-4 w-4" />
                    {text.livenessCheck}
                  </span>
                  {livenessStatus === 'failed' && (
                    <Badge variant="destructive" className="text-xs">
                      {text.livenessFailed}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {livenessStatus === 'idle' && text.livenessRequired}
                  {livenessStatus === 'challenging' && `${text.blinkChallenge}...`}
                  {livenessStatus === 'failed' && text.tryAgain}
                </p>
                {(livenessStatus === 'idle' || livenessStatus === 'failed') && (
                  <Button
                    size="sm"
                    onClick={handleStartLiveness}
                    disabled={!modelsLoaded || isDetecting}
                    className="w-full"
                    data-testid="button-start-liveness"
                  >
                    {livenessStatus === 'failed' ? (
                      <><RefreshCw className="mr-2 h-4 w-4" /> {text.tryAgain}</>
                    ) : (
                      <><Eye className="mr-2 h-4 w-4" /> {text.startLiveness}</>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Liveness Passed Indicator */}
            {showLivenessUI && livenessStatus === 'passed' && !capturedFace && (
              <div className="mb-4 p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">{text.livenessPassed}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {text.nowCapture}
                </p>
              </div>
            )}

            {capturedFace && (
              <div className="mb-4 p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600">{text.faceDetected}</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {detectionConfidence}%
                  </Badge>
                </div>
                <Progress value={detectionConfidence} className="h-2" />
              </div>
            )}

            <div className="flex gap-2">
              {isStreaming ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={stopCamera}
                    className="flex-1"
                    data-testid="button-stop-camera"
                  >
                    <VideoOff className="mr-2 h-4 w-4" />
                    {text.stopCamera}
                  </Button>
                  <Button 
                    onClick={captureFace}
                    disabled={isLoading || !canCaptureFace || isDetecting || capturedFrames.length >= 3}
                    className="flex-1"
                    data-testid="button-capture-face"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    {capturedFrames.length > 0
                      ? `${text.captureFace} (${capturedFrames.length}/3)`
                      : text.captureFace}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={startCamera}
                  disabled={!modelsLoaded || !selectedEmployee}
                  className="w-full"
                  data-testid="button-start-camera"
                >
                  <Video className="mr-2 h-4 w-4" />
                  {text.startCamera}
                </Button>
              )}
            </div>

            {/* Warning if trying to capture without liveness */}
            {isStreaming && selectedEmployee && livenessStatus !== 'passed' && !isDetecting && (
              <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{text.livenessRequired}</span>
              </div>
            )}

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
                  onClick={handleRegisterFace}
                  disabled={registerFaceMutation.isPending || capturedFrames.length < 3}
                  className="w-full mt-3"
                  data-testid="button-register-face"
                >
                  {registerFaceMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {capturedFrames.length >= 3
                    ? `${text.registerFace} (3 rasm)`
                    : text.registerFace}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Registered Faces List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {text.registeredFaces}
              </span>
              <Badge>{registeredFaces.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {facesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : registeredFaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{text.noFaces}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(Array.isArray(registeredFaces) ? registeredFaces : []).map((face) => (
                    <div
                      key={face.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      data-testid={`face-card-${face.id}`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {face.imageUrl ? (
                          <img src={face.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{face.employeeName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(face.confidence)}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(face.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFaceMutation.mutate(face.id)}
                        disabled={deleteFaceMutation.isPending}
                        data-testid={`button-delete-face-${face.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
