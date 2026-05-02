import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Loader2, Wifi, WifiOff, Globe } from "lucide-react";
import { io, Socket } from "socket.io-client";

type InterviewStage = "VALIDATING" | "EXPIRED" | "INVALID" | "CAMERA_CHECK" | "LANG_SELECT" | "READY" | "INTERVIEWING" | "COMPLETED" | "CANCELLED";
type Language = "uz" | "ru" | "en";

interface SessionInfo {
  id: number;
  token: string;
  candidate_name: string | null;
  candidate_language: string;
  status: string;
  expires_at: string;
  valid?: boolean;
  expired?: boolean;
  error?: string;
}

interface TranscriptEntry {
  role: "ai" | "user";
  text: string;
  ts: number;
  score?: number;
  feedback?: string;
}

interface Question {
  id: number;
  question: string;
  maxScore: number;
}

const LABELS: Record<Language, Record<string, string>> = {
  uz: {
    title: "EuroPrint AI Intervyu",
    checkDevices: "Qurilmalarni tekshirish",
    camera: "Kamera",
    mic: "Mikrofon",
    proceed: "Tayyor — Davom etish",
    startInterview: "Intervyuni Boshlash",
    ready: "AI Intervyu — Tayyormisiz?",
    question: "Savol",
    typeAnswer: "Javobingizni yozing...",
    nextBtn: "Keyingi",
    finishBtn: "Yakunlash",
    submitBtn: "Javoblarni Yuborish",
    submitBtnWait: "Yuborilmoqda...",
    micOn: "Ovozdan foydalanish",
    micOff: "Mikrofon o'chir",
    camOn: "Kamera yoqiq",
    camOff: "Kamera o'chiq",
    chat: "Suhbat",
    aiTyping: "AI yozmoqda...",
    offline: "Offline",
    connected: "Ulangan",
    completed: "Intervyu yakunlandi!",
    completedDesc: "Javoblaringiz muvaffaqiyatli qabul qilindi.",
    hrContact: "HR jamoasi siz bilan tez orada bog'lanadi.",
    expired: "Muddat o'tgan",
    expiredDesc: "Ushbu intervyu havolasining muddati tugagan.",
    invalid: "Havola topilmadi",
    invalidDesc: "Intervyu havolasi noto'g'ri yoki mavjud emas.",
    cancelled: "Intervyu bekor qilindi",
    cancelledDesc: "Kamera 3 marta rad etildi.",
    hrEmail: "HR bilan bog'laning: hr@europrint.uz",
    newHrLink: "Iltimos, HR'dan yangi havola so'rang.",
    chars: "belgi",
    questions: "ta savol",
    minutes: "15–20 daqiqa",
    voiceText: "Ovoz va matn",
    secure: "Xavfsiz ulanish",
    tip1: "Qulay joyda o'tiring",
    tip2: "Shovqin kamaytiring",
    tip3: "Har savolga to'liq javob bering",
    tip4: "Internevyu boshlangach to'xtamaslik kerak",
    selectLang: "Tilni tanlang",
  },
  ru: {
    title: "EuroPrint AI Интервью",
    checkDevices: "Проверить устройства",
    camera: "Камера",
    mic: "Микрофон",
    proceed: "Готов — Продолжить",
    startInterview: "Начать Интервью",
    ready: "AI Интервью — Готовы?",
    question: "Вопрос",
    typeAnswer: "Напишите ваш ответ...",
    nextBtn: "Далее",
    finishBtn: "Завершить",
    submitBtn: "Отправить ответы",
    submitBtnWait: "Отправляется...",
    micOn: "Использовать голос",
    micOff: "Выключить микрофон",
    camOn: "Камера включена",
    camOff: "Камера выключена",
    chat: "Беседа",
    aiTyping: "AI печатает...",
    offline: "Offline",
    connected: "Подключено",
    completed: "Интервью завершено!",
    completedDesc: "Ваши ответы успешно получены.",
    hrContact: "Команда HR свяжется с вами в ближайшее время.",
    expired: "Срок истёк",
    expiredDesc: "Срок действия ссылки на интервью истёк.",
    invalid: "Ссылка не найдена",
    invalidDesc: "Ссылка на интервью неверна или не существует.",
    cancelled: "Интервью отменено",
    cancelledDesc: "Камера была отклонена 3 раза.",
    hrEmail: "Свяжитесь с HR: hr@europrint.uz",
    newHrLink: "Пожалуйста, запросите новую ссылку у HR.",
    chars: "символов",
    questions: "вопросов",
    minutes: "15–20 минут",
    voiceText: "Голос и текст",
    secure: "Безопасное соединение",
    tip1: "Сядьте удобно",
    tip2: "Уменьшите шум",
    tip3: "Полностью отвечайте на каждый вопрос",
    tip4: "Не прерывайте интервью после начала",
    selectLang: "Выберите язык",
  },
  en: {
    title: "EuroPrint AI Interview",
    checkDevices: "Check Devices",
    camera: "Camera",
    mic: "Microphone",
    proceed: "Ready — Continue",
    startInterview: "Start Interview",
    ready: "AI Interview — Are you ready?",
    question: "Question",
    typeAnswer: "Write your answer...",
    nextBtn: "Next",
    finishBtn: "Finish",
    submitBtn: "Submit Answers",
    submitBtnWait: "Submitting...",
    micOn: "Use voice",
    micOff: "Mute microphone",
    camOn: "Camera on",
    camOff: "Camera off",
    chat: "Conversation",
    aiTyping: "AI is typing...",
    offline: "Offline",
    connected: "Connected",
    completed: "Interview Completed!",
    completedDesc: "Your answers have been successfully received.",
    hrContact: "The HR team will contact you soon.",
    expired: "Link Expired",
    expiredDesc: "This interview link has expired.",
    invalid: "Link Not Found",
    invalidDesc: "The interview link is invalid or does not exist.",
    cancelled: "Interview Cancelled",
    cancelledDesc: "Camera was rejected 3 times.",
    hrEmail: "Contact HR: hr@europrint.uz",
    newHrLink: "Please request a new link from HR.",
    chars: "chars",
    questions: "questions",
    minutes: "15–20 minutes",
    voiceText: "Voice and text",
    secure: "Secure connection",
    tip1: "Sit in a comfortable place",
    tip2: "Reduce background noise",
    tip3: "Give complete answers to each question",
    tip4: "Do not stop once the interview begins",
    selectLang: "Select language",
  },
};

export default function AIInterviewPublicPage() {
  const [location] = useLocation();
  const token = location.split("/ai-interview/")[1]?.split("?")[0];
  const [stage, setStage] = useState<InterviewStage>("VALIDATING");
  const [lang, setLang] = useState<Language>("uz");
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [cameraRejections, setCameraRejections] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [cancelledReason, setCancelledReason] = useState("");
  const [aiThinking, setAiThinking] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const mediaRecorderRef = useRef<{ stop: () => void } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => LABELS[lang][key] || key;

  const { data: session, isLoading, error } = useQuery<SessionInfo>({
    queryKey: ["/api/hr/ai-interview/session", token, "validate"],
    queryFn: async () => {
      const res = await fetch(`/api/hr-v2/ai-interview/session/${token}/validate`);
      if (!res.ok) throw new Error("Invalid session");
      return res.json();
    },
    retry: false,
    enabled: !!token,
  });

  useEffect(() => {
    if (isLoading) return;
    if (error || !session) { setStage("INVALID"); return; }
    if (!session.valid) {
      const isExpired = session.expired === true ||
        (typeof session.error === "string" && session.error.toLowerCase().includes("expired"));
      if (isExpired) { setStage("EXPIRED"); return; }
      setStage("INVALID"); return;
    }
    if (session.status === "completed") { setStage("COMPLETED"); return; }
    if (session.status === "cancelled") { setStage("CANCELLED"); return; }

    const sessionLang = (session.candidate_language || "uz") as Language;
    setLang(sessionLang);
    setStage("CAMERA_CHECK");
  }, [session, isLoading, error]);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setMicReady(true);
      setIsCamActive(true);
    } catch {
      setCameraReady(false);
      setMicReady(false);
      if (!token) return;
      try {
        const res = await fetch(`/api/hr-v2/ai-interview/session/${token}/camera-rejected`, {
          method: "POST",
        });
        const data = await res.json();
        const newCount = data.rejections ?? cameraRejections + 1;
        setCameraRejections(newCount);
        if (data.cancelled) {
          setCancelledReason(t("cancelledDesc"));
          setStage("CANCELLED");
          if (socketRef.current?.connected) {
            socketRef.current.emit("camera.rejected");
          }
        }
      } catch {
        const newCount = cameraRejections + 1;
        setCameraRejections(newCount);
        if (newCount >= 3) {
          setCancelledReason(t("cancelledDesc"));
          setStage("CANCELLED");
        }
      }
    }
  }, [cameraRejections, lang, token]);

  const checkDevices = async () => {
    await startCameraPreview();
  };

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected || !token) return;

    const apiBase = window.location.origin;
    const basePath = (import.meta.env.BASE_URL ?? "/erp-dashboard/").replace(/\/$/, "");
    const sock = io(`${apiBase}/ai-interview`, {
      path: `${basePath}/api/socket.io`,
      query: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    sock.on("connect", () => {
      setWsConnected(true);
      sock.emit("session.join", { token, language: lang });
    });

    sock.on("disconnect", () => setWsConnected(false));
    sock.on("connect_error", () => setWsConnected(false));

    sock.on("connected", (data: { questions?: Question[] }) => {
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    });

    sock.on("session.joined", (data: { questions?: Question[] }) => {
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      }
    });

    sock.on("interview.started", (data: { greeting?: string; firstQuestion?: string }) => {
      if (data.greeting) {
        setTranscript(prev => [...prev, { role: "ai", text: data.greeting!, ts: Date.now() }]);
      }
    });

    sock.on("ai.question", (data: { question: string; index: number }) => {
      setAiThinking(false);
      setTranscript(prev => [...prev, { role: "ai", text: `❓ ${data.question}`, ts: Date.now() }]);
      setCurrentQIndex(data.index);
    });

    sock.on("ai.text", (data: { feedback?: string; analysis?: { score: number; feedback: string }; nextIndex?: number; isLast?: boolean }) => {
      setAiThinking(false);
      if (data.feedback || data.analysis?.feedback) {
        const fb = data.feedback || data.analysis?.feedback || "";
        setTranscript(prev => [...prev, {
          role: "ai",
          text: fb,
          ts: Date.now(),
          score: data.analysis?.score,
          feedback: fb,
        }]);
      }
      if (data.nextIndex !== undefined && !data.isLast) {
        setCurrentQIndex(data.nextIndex);
      }
    });

    sock.on("ai.processing", () => setAiThinking(true));

    sock.on("interview.completed", (data: { message?: string }) => {
      if (data.message) {
        setTranscript(prev => [...prev, { role: "ai", text: data.message!, ts: Date.now() }]);
      }
      setStage("COMPLETED");
    });

    sock.on("interview.cancelled", (data: { message?: string }) => {
      setCancelledReason(data.message || t("cancelledDesc"));
      setStage("CANCELLED");
    });

    sock.on("camera.rejection.counted", (data: { count: number }) => {
      setCameraRejections(data.count);
    });

    socketRef.current = sock;
  }, [token, lang]);

  useEffect(() => {
    if (stage === "INTERVIEWING") {
      connectSocket();
    }
    return () => {
      if (stage !== "INTERVIEWING") {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    };
  }, [stage, connectSocket]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      speechRecogRef.current?.stop();
      speechRecogRef.current = null;
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (data: { answers: string[] }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("complete.interview");
        return { success: true };
      }
      const res = await fetch(`/api/hr-v2/ai-interview/session/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      setStage("COMPLETED");
    },
  });

  const speechRecogRef = useRef<{ stop: () => void } | null>(null);

  const toggleMic = useCallback(() => {
    if (isMicActive) {
      speechRecogRef.current?.stop();
      speechRecogRef.current = null;
      setIsMicActive(false);
      return;
    }
    type SpeechRecognitionEvent = Event & {
      results: SpeechRecognitionResultList;
      resultIndex: number;
    };
    type SpeechRecognitionCtor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((e: SpeechRecognitionEvent) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    const win = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsMicActive(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let combined = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        combined += e.results[i][0].transcript;
      }
      const text = combined.trim();
      if (text && socketRef.current?.connected) {
        socketRef.current.emit("audio.chunk", { transcript: text, questionIndex: currentQIndex });
      }
    };
    recognition.onerror = () => setIsMicActive(false);
    recognition.onend = () => setIsMicActive(false);
    recognition.start();
    speechRecogRef.current = recognition;
    setIsMicActive(true);
  }, [isMicActive, lang, currentQIndex]);

  const toggleCamera = useCallback(async () => {
    if (isCamActive) {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCamActive(true);
      } catch {
        setIsCamActive(false);
      }
    }
  }, [isCamActive]);

  const submitTextAnswer = () => {
    if (currentAnswer.trim().length < 3) return;
    const userText = currentAnswer.trim();
    setCurrentAnswer("");
    setAiThinking(true);

    setTranscript(prev => [...prev, { role: "user", text: userText, ts: Date.now() }]);

    if (socketRef.current?.connected) {
      socketRef.current.emit("user.answer", { text: userText, token, questionIndex: currentQIndex });
    } else {
      const nextIdx = currentQIndex + 1;
      setAiThinking(false);
      if (nextIdx < questions.length) {
        setCurrentQIndex(nextIdx);
        setTranscript(prev => [...prev, { role: "ai", text: `❓ ${questions[nextIdx].question}`, ts: Date.now() }]);
      } else {
        submitMutation.mutate({ answers: (Array.isArray(transcript) ? transcript : []).filter(e => e.role === "user").map(e => e.text) });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      submitTextAnswer();
    }
  };

  if (isLoading || stage === "VALIDATING") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#ff5d2e] animate-spin mx-auto" />
          <p className="text-white text-lg">Intervyu sessiyasi tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  if (stage === "EXPIRED") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-red-700 max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <Clock className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t("expired")}</h2>
            <p className="text-slate-400">{t("expiredDesc")}</p>
            <p className="text-slate-500 text-sm">{t("hrEmail")}</p>
            <Badge className="bg-red-900/50 text-red-300 border-red-700">Muddati tugagan</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "INVALID") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-red-700 max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t("invalid")}</h2>
            <p className="text-slate-400">{t("invalidDesc")}</p>
            <p className="text-slate-500 text-sm">{t("newHrLink")}</p>
            <Badge className="bg-amber-900/50 text-amber-300 border-amber-700">Noto'g'ri havola</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "CANCELLED") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-red-700 max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t("cancelled")}</h2>
            <p className="text-slate-400">{cancelledReason || t("cancelledDesc")}</p>
            <p className="text-slate-500 text-sm">{t("hrEmail")}</p>
            <Badge className="bg-red-900/50 text-red-300 border-red-700">Bekor qilindi</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "COMPLETED") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-green-700 max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white">{t("completed")}</h2>
            <p className="text-slate-400">{t("completedDesc")}</p>
            <p className="text-slate-500 text-sm">{t("hrContact")}</p>
            <Badge className="bg-green-900/50 text-green-300 border-green-700 text-sm px-3 py-1">✓ Muvaffaqiyatli</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "CAMERA_CHECK") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-[#30363d] max-w-md w-full">
          <CardHeader>
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-full bg-[#ff5d2e]/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <CardTitle className="text-white">{t("title")}</CardTitle>
              <p className="text-slate-400 text-sm mt-1">Qurilmalarni tekshirish</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {session?.candidate_name && (
              <div className="text-center py-2 px-4 bg-[#ff5d2e]/10 rounded-lg border border-[#ff5d2e]/20">
                <p className="text-slate-400 text-xs">Xush kelibsiz,</p>
                <p className="text-white font-semibold text-lg">{session.candidate_name}</p>
              </div>
            )}

            {cameraReady && (
              <div className="relative rounded-lg overflow-hidden border border-green-700 bg-black aspect-video">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-green-900/80 text-green-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  LIVE
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${cameraReady ? "border-green-700 bg-green-950/30" : "border-[#30363d] bg-[#0d1117]"}`}>
                <Video className={`w-5 h-5 ${cameraReady ? "text-green-400" : "text-slate-500"}`} />
                <span className={cameraReady ? "text-green-400" : "text-slate-400"}>{t("camera")}</span>
                {cameraReady && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${micReady ? "border-green-700 bg-green-950/30" : "border-[#30363d] bg-[#0d1117]"}`}>
                <Mic className={`w-5 h-5 ${micReady ? "text-green-400" : "text-slate-500"}`} />
                <span className={micReady ? "text-green-400" : "text-slate-400"}>{t("mic")}</span>
                {micReady && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
              </div>
            </div>

            {cameraRejections > 0 && cameraRejections < 3 && (
              <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-950/30 border border-amber-800 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Kamera ruxsati rad etildi ({cameraRejections}/3). Yana {3 - cameraRejections} marta ruxsat bermangiz — intervyu bekor bo'ladi.</span>
              </div>
            )}

            {!cameraReady && (
              <Button onClick={checkDevices} className="w-full bg-[#ff5d2e] hover:bg-[#e54d20] text-white">
                {t("checkDevices")}
              </Button>
            )}
            {cameraReady && micReady && (
              <Button onClick={() => setStage("READY")} className="w-full bg-[#ff5d2e] hover:bg-[#e54d20] text-white">
                {t("proceed")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-xs border-t border-[#30363d] pt-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Muddati: {session?.expires_at ? new Date(session.expires_at).toLocaleString("uz") : "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "READY") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-[#30363d] max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">{t("ready")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {([
                { icon: "❓", label: `5–8 ${t("questions")}` },
                { icon: "⏱️", label: t("minutes") },
                { icon: "🎙️", label: t("voiceText") },
                { icon: "🔒", label: t("secure") },
              ]).map(it => (
                <div key={it.icon} className="bg-[#0d1117] rounded-lg p-3 flex items-center gap-2">
                  <span className="text-lg">{it.icon}</span>
                  <span className="text-slate-300 text-sm">{it.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#ff5d2e]/10 border border-[#ff5d2e]/20 rounded-lg p-3 space-y-1 text-sm text-slate-300">
              <p>✅ {t("tip1")}</p>
              <p>✅ {t("tip2")}</p>
              <p>✅ {t("tip3")}</p>
              <p>✅ {t("tip4")}</p>
            </div>

            <div className="flex gap-2 border-t border-[#30363d] pt-3">
              <Globe className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="flex gap-2">
                {(["uz", "ru", "en"] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${lang === l ? "bg-[#ff5d2e] text-white border-[#ff5d2e]" : "text-slate-400 border-[#30363d] hover:border-slate-500"}`}
                  >
                    {l === "uz" ? "O'zbek" : l === "ru" ? "Русский" : "English"}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => {
                setStage("INTERVIEWING");
                setTimeout(() => {
                  if (socketRef.current?.connected) {
                    socketRef.current.emit("start.interview");
                  } else {
                    const onConnect = () => {
                      socketRef.current?.emit("start.interview");
                      socketRef.current?.off("connect", onConnect);
                    };
                    socketRef.current?.on("connect", onConnect);
                  }
                }, 500);
              }}
              className="w-full bg-[#ff5d2e] hover:bg-[#e54d20] text-white py-5 text-base font-semibold"
            >
              {t("startInterview")} <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === "INTERVIEWING") {
    const currentQuestion = questions[currentQIndex];
    const isLast = currentQIndex >= questions.length - 1;
    const allDone = questions.length > 0 && currentQIndex >= questions.length;

    if (allDone || (questions.length > 0 && submitMutation.isSuccess)) {
      return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
          <Card className="bg-[#161b22] border-[#30363d] max-w-lg w-full">
            <CardContent className="pt-8 space-y-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-white font-semibold text-lg">Barcha savollar tugadi</h3>
              <p className="text-slate-400 text-sm">Javoblaringizni yuborishingiz mumkin.</p>
              <Button
                onClick={() => submitMutation.mutate({ answers: (Array.isArray(transcript) ? transcript : []).filter(e => e.role === "user").map(e => e.text) })}
                disabled={submitMutation.isPending}
                className="bg-[#ff5d2e] hover:bg-[#e54d20] text-white w-full"
              >
                {submitMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("submitBtnWait")}</>
                  : `${t("submitBtn")} ✓`}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0d1117] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-[#ff5d2e] font-bold text-sm">EuroPrint</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-sm">AI Intervyu</span>
          </div>
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <Badge className="bg-green-900/50 text-green-300 border-green-800 text-xs flex items-center gap-1">
                <Wifi className="w-3 h-3" /> {t("connected")}
              </Badge>
            ) : (
              <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-xs flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> {t("offline")}
              </Badge>
            )}
            {questions.length > 0 && (
              <Badge className="bg-[#ff5d2e]/20 text-[#ff5d2e] border border-[#ff5d2e]/30 text-xs">
                {currentQIndex + 1} / {questions.length}
              </Badge>
            )}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="w-full h-1.5 bg-[#161b22] rounded-full overflow-hidden max-w-4xl mx-auto mb-4">
            <div
              className="h-full bg-[#ff5d2e] rounded-full transition-all duration-700"
              style={{ width: `${(currentQIndex / questions.length) * 100}%` }}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="flex-1 flex flex-col gap-4">
              {isCamActive && (
                <div className="relative rounded-lg overflow-hidden border border-[#30363d] bg-black aspect-video lg:aspect-auto lg:h-40">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-red-900/80 text-red-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                    LIVE
                  </div>
                </div>
              )}

              <Card className="bg-[#161b22] border-[#30363d] flex-1">
                <CardContent className="pt-5 space-y-4 h-full flex flex-col">
                  {currentQuestion ? (
                    <div className="bg-[#0d1117] rounded-lg p-4 border border-[#ff5d2e]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#ff5d2e] text-xs font-semibold">{t("question")} {currentQIndex + 1}</span>
                        <span className="text-slate-600 text-xs">/ {questions.length}</span>
                      </div>
                      <p className="text-white text-base font-medium leading-relaxed">
                        {currentQuestion.question}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
                      <Loader2 className="w-5 h-5 text-[#ff5d2e] animate-spin mx-auto" />
                      <p className="text-slate-400 text-sm text-center mt-2">Savollar yuklanmoqda...</p>
                    </div>
                  )}

                  {aiThinking && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t("aiTyping")}</span>
                    </div>
                  )}

                  <textarea
                    value={currentAnswer}
                    onChange={e => setCurrentAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`${t("typeAnswer")} (Ctrl+Enter)`}
                    className="flex-1 w-full min-h-[120px] bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-[#ff5d2e] text-sm"
                    disabled={aiThinking}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-[#30363d] gap-1.5 ${isMicActive ? "border-red-500 text-red-400 bg-red-950/30" : "text-slate-400"}`}
                        onClick={toggleMic}
                      >
                        {isMicActive ? <><MicOff className="w-4 h-4" /> {t("micOff")}</> : <><Mic className="w-4 h-4" /> {t("micOn")}</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-[#30363d] gap-1.5 ${isCamActive ? "border-blue-500 text-blue-400 bg-blue-950/30" : "text-slate-400"}`}
                        onClick={toggleCamera}
                      >
                        {isCamActive ? <><VideoOff className="w-4 h-4" /></> : <><Video className="w-4 h-4" /></>}
                      </Button>
                      <span className="text-slate-600 text-xs">{currentAnswer.length} {t("chars")}</span>
                    </div>
                    <Button
                      onClick={submitTextAnswer}
                      disabled={currentAnswer.trim().length < 3 || aiThinking}
                      className="bg-[#ff5d2e] hover:bg-[#e54d20] text-white disabled:opacity-40 gap-1"
                    >
                      {isLast ? t("finishBtn") : t("nextBtn")} <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:w-72 shrink-0 flex flex-col gap-3">
              <Card className="bg-[#161b22] border-[#30363d] flex-1 flex flex-col">
                <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-medium">{t("chat")}</span>
                  {isMicActive && (
                    <span className="inline-flex gap-1 items-end">
                      {([1, 2, 3]).map(i => (
                        <span key={`k-${i}`} className="block w-1 rounded-full bg-red-400 animate-pulse"
                          style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72 lg:max-h-none">
                  {transcript.length === 0 && (
                    <p className="text-slate-600 text-xs text-center pt-4">
                      {wsConnected ? "AI tez orada gapiradi..." : "Matn suhbat bu yerda ko'rinadi"}
                    </p>
                  )}
                  {(Array.isArray(transcript) ? transcript : []).map((entry, i) => (
                    <div
                      key={`k-${i}`}
                      className={`text-xs rounded-lg p-2.5 ${
                        entry.role === "ai"
                          ? "bg-[#0d1117] text-slate-300 border-l-2 border-[#ff5d2e]"
                          : "bg-blue-950/40 text-blue-300 border-l-2 border-blue-500"
                      }`}
                    >
                      <span className="text-[10px] opacity-60 block mb-0.5">
                        {entry.role === "ai" ? "🤖 AI" : "👤 Siz"}
                        {entry.score !== undefined && (
                          <span className="ml-2 text-[#ff5d2e]">+{entry.score}/10</span>
                        )}
                      </span>
                      {entry.text}
                    </div>
                  ))}
                  {aiThinking && (
                    <div className="text-xs rounded-lg p-2.5 bg-[#0d1117] text-slate-500 border-l-2 border-[#ff5d2e] animate-pulse">
                      <span className="text-[10px] opacity-60 block mb-0.5">🤖 AI</span>
                      ···
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </Card>

              {questions.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {(Array.isArray(questions) ? questions : []).map((_, i) => (
                    <div
                      key={`k-${i}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < currentQIndex
                          ? "bg-green-600 text-white"
                          : i === currentQIndex
                          ? "bg-[#ff5d2e] text-white ring-2 ring-[#ff5d2e]/40"
                          : "bg-[#30363d] text-slate-500"
                      }`}
                    >
                      {i < currentQIndex ? "✓" : i + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
