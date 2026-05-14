/**
 * @module AIInterviewPublicPage
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";

import {
  type InterviewStage,
  type Language,
  type SessionInfo,
  type TranscriptEntry,
  type Question,
  LABELS,
} from "./AIInterviewPublicPageTypes";
import {
  ValidatingScreen,
  ExpiredScreen,
  InvalidScreen,
  CancelledScreen,
  CompletedScreen,
  CameraCheckSection,
  ReadySection,
} from "./AIInterviewPublicPageSections";
import { InterviewingSection } from "./AIInterviewPublicPageInterview";
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

export default function AIInterviewPublicPage() {
  const { t } = useTranslation("common");
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const speechRecogRef = useRef<{ stop: () => void } | null>(null);

  const t = (key: string) => LABELS[lang][key] || key;

  const { data: session, isLoading, error } = useQuery<SessionInfo>({
    queryKey: ["/api/hr/ai-interview/session", token, "validate"],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/hr-v2/ai-interview/session/${token}/validate`);
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
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const startCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
      setMicReady(true);
      setIsCamActive(true);
    } catch {
      setCameraReady(false);
      setMicReady(false);
      if (!token) return;
      try {
        const res = await apiRequest('POST', `/api/hr-v2/ai-interview/session/${token}/camera-rejected`);
        const data = await res.json();
        const newCount = data.rejections ?? cameraRejections + 1;
        setCameraRejections(newCount);
        if (data.cancelled) {
          setCancelledReason(t("cancelledDesc"));
          setStage("CANCELLED");
          if (socketRef.current?.connected) socketRef.current.emit("camera.rejected");
        }
      } catch {
        const newCount = cameraRejections + 1;
        setCameraRejections(newCount);
        if (newCount >= 3) { setCancelledReason(t("cancelledDesc")); setStage("CANCELLED"); }
      }
    }
  }, [cameraRejections, lang, token]);

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

    const setQs = (data: { questions?: Question[] }) => { if (data.questions?.length) setQuestions(data.questions); };
    sock.on("connected", setQs);
    sock.on("session.joined", setQs);
    sock.on("interview.started", (d: { greeting?: string }) => {
      if (d.greeting) setTranscript(p => [...p, { role: "ai", text: d.greeting ?? "", ts: Date.now() }]);
    });
    sock.on("ai.question", (d: { question: string; index: number }) => {
      setAiThinking(false);
      setTranscript(p => [...p, { role: "ai", text: `❓ ${d.question}`, ts: Date.now() }]);
      setCurrentQIndex(d.index);
    });
    sock.on("ai.text", (d: { feedback?: string; analysis?: { score: number; feedback: string }; nextIndex?: number; isLast?: boolean }) => {
      setAiThinking(false);
      const fb = d.feedback || d.analysis?.feedback;
      if (fb) setTranscript(p => [...p, { role: "ai", text: fb, ts: Date.now(), score: d.analysis?.score, feedback: fb }]);
      if (d.nextIndex !== undefined && !d.isLast) setCurrentQIndex(d.nextIndex);
    });
    sock.on("ai.processing", () => setAiThinking(true));
    sock.on("interview.completed", (d: { message?: string }) => {
      if (d.message) setTranscript(p => [...p, { role: "ai", text: d.message ?? "", ts: Date.now() }]);
      setStage("COMPLETED");
    });
    sock.on("interview.cancelled", (d: { message?: string }) => { setCancelledReason(d.message || t("cancelledDesc")); setStage("CANCELLED"); });
    sock.on("camera.rejection.counted", (d: { count: number }) => setCameraRejections(d.count));

    socketRef.current = sock;
  }, [token, lang]);

  useEffect(() => {
    if (stage === "INTERVIEWING") connectSocket();
    return () => {
      if (stage !== "INTERVIEWING") { socketRef.current?.disconnect(); socketRef.current = null; }
    };
  }, [stage, connectSocket]);

  // Global cleanup on unmount
  useEffect(() => () => {
    socketRef.current?.disconnect();
    speechRecogRef.current?.stop();
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (data: { answers: string[] }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("complete.interview");
        return { success: true };
      }
      const res = await apiRequest('POST', `/api/hr-v2/ai-interview/session/${token}/submit`, data);
      return res.json();
    },
    onSuccess: () => setStage("COMPLETED"),
  });

  const getUserAnswers = () =>
    (Array.isArray(transcript) ? transcript : []).filter(e => e.role === "user").map(e => e.text);

  const toggleMic = useCallback(() => {
    if (isMicActive) {
      speechRecogRef.current?.stop();
      speechRecogRef.current = null;
      setIsMicActive(false);
      return;
    }
    type SpeechRecognitionEvent = Event & { results: SpeechRecognitionResultList; resultIndex: number };
    type SpeechRecognitionCtor = new () => {
      continuous: boolean; interimResults: boolean; lang: string;
      onresult: ((e: SpeechRecognitionEvent) => void) | null;
      onerror: (() => void) | null; onend: (() => void) | null;
      start: () => void; stop: () => void;
    };
    const win = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) { setIsMicActive(false); return; }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let combined = "";
      for (let i = e.resultIndex; i < e.results.length; i++) combined += e.results[i][0].transcript;
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
        submitMutation.mutate({ answers: getUserAnswers() });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitTextAnswer();
  };

  const handleStartInterview = () => {
    setStage("INTERVIEWING");
    setTimeout(() => {
      if (socketRef.current?.connected) { socketRef.current.emit("start.interview"); return; }
      const onConnect = () => { socketRef.current?.emit("start.interview"); socketRef.current?.off("connect", onConnect); };
      socketRef.current?.on("connect", onConnect);
    }, 500);
  };

  if (isLoading || stage === "VALIDATING") return <ValidatingScreen />;
  if (stage === "EXPIRED") return <ExpiredScreen t={t} />;
  if (stage === "INVALID") return <InvalidScreen t={t} />;
  if (stage === "CANCELLED") return <CancelledScreen t={t} cancelledReason={cancelledReason} />;
  if (stage === "COMPLETED") return <CompletedScreen t={t} />;

  if (stage === "CAMERA_CHECK") {
    return (
      <CameraCheckSection
        t={t}
        session={session}
        cameraReady={cameraReady}
        micReady={micReady}
        cameraRejections={cameraRejections}
        videoRef={videoRef}
        onCheckDevices={startCameraPreview}
        onProceed={() => setStage("READY")}
      />
    );
  }

  if (stage === "READY") {
    return (
      <ReadySection
        t={t}
        lang={lang}
        onSetLang={setLang}
        onStart={handleStartInterview}
      />
    );
  }

  if (stage === "INTERVIEWING") {
    return (
      <InterviewingSection
        t={t}
        wsConnected={wsConnected}
        questions={questions}
        currentQIndex={currentQIndex}
        currentAnswer={currentAnswer}
        aiThinking={aiThinking}
        isMicActive={isMicActive}
        isCamActive={isCamActive}
        transcript={transcript}
        transcriptEndRef={transcriptEndRef}
        videoRef={videoRef}
        isPendingSubmit={submitMutation.isPending}
        onAnswerChange={setCurrentAnswer}
        onKeyDown={handleKeyDown}
        onSubmitAnswer={submitTextAnswer}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onFinalSubmit={() => submitMutation.mutate({ answers: getUserAnswers() })}
      />
    );
  }

  return null;
}
