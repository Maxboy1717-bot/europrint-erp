/**
 * @module AIInterviewPublicPageInterview
 * @description The active interview step panel for AIInterviewPublicPage.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, CheckCircle, ChevronRight, Wifi, WifiOff } from "lucide-react";
import type { TranscriptEntry, Question } from "./AIInterviewPublicPageTypes";

import { EPLoader } from "@/components/ep";
interface TFn {
  (key: string): string;
}

export interface InterviewingSectionProps {
  t: TFn;
  wsConnected: boolean;
  questions: Question[];
  currentQIndex: number;
  currentAnswer: string;
  aiThinking: boolean;
  isMicActive: boolean;
  isCamActive: boolean;
  transcript: TranscriptEntry[];
  transcriptEndRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPendingSubmit: boolean;
  onAnswerChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmitAnswer: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onFinalSubmit: () => void;
}

export function InterviewingSection({
  t, wsConnected, questions, currentQIndex, currentAnswer, aiThinking,
  isMicActive, isCamActive, transcript, transcriptEndRef, videoRef,
  isPendingSubmit, onAnswerChange, onKeyDown, onSubmitAnswer,
  onToggleMic, onToggleCamera, onFinalSubmit,
}: InterviewingSectionProps) {
  const currentQuestion = questions[currentQIndex];
  const isLast = currentQIndex >= questions.length - 1;
  const allDone = questions.length > 0 && currentQIndex >= questions.length;

  if (allDone) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="bg-[#161b22] border-[#30363d] max-w-lg w-full">
          <CardContent className="pt-8 space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-[var(--ep-green)] mx-auto" />
            <h3 className="text-white font-semibold text-lg">{t("barchaSavollarTugadi")}</h3>
            <p className="text-slate-400 text-sm">{t("javoblaringizniYuborishingizMumkin")}</p>
            <Button
              onClick={onFinalSubmit}
              disabled={isPendingSubmit}
              className="bg-primary hover:bg-primary/90 text-white w-full"
            >
              {isPendingSubmit
                ? <><EPLoader className="w-4 h-4 mr-2" />{t("submitBtnWait")}</>
                : `${t("submitBtn")} ✓`}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold text-sm">{t("europrint1")}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 text-sm">{t("aiIntervyu")}</span>
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
            <Badge className="bg-primary/10 text-primary border border-primary/30 text-xs">
              {currentQIndex + 1} / {questions.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {questions.length > 0 && (
        <div className="w-full h-1.5 bg-[#161b22] rounded-full overflow-hidden max-w-4xl mx-auto mb-4">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${(currentQIndex / questions.length) * 100}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4 max-w-4xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          {/* Left: video + question + answer */}
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
                  <div className="bg-[#0d1117] rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-primary text-xs font-semibold">{t("question")} {currentQIndex + 1}</span>
                      <span className="text-slate-600 text-xs">/ {questions.length}</span>
                    </div>
                    <p className="text-white text-base font-medium leading-relaxed">{currentQuestion.question}</p>
                  </div>
                ) : (
                  <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
                    <EPLoader className="w-5 h-5 mx-auto" />
                    <p className="text-slate-400 text-sm text-center mt-2">{t("savollarYuklanmoqda")}</p>
                  </div>
                )}
                {aiThinking && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <EPLoader className="w-3 h-3" />
                    <span>{t("aiTyping")}</span>
                  </div>
                )}
                <textarea
                  value={currentAnswer}
                  onChange={e => onAnswerChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`${t("typeAnswer")} (Ctrl+Enter)`}
                  className="flex-1 w-full min-h-[120px] bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary text-sm"
                  disabled={aiThinking}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline"
                      className={`border-[#30363d] gap-1.5 ${isMicActive ? "border-red-500 text-red-400 bg-red-950/30" : "text-slate-400"}`}
                      onClick={onToggleMic}
                    >
                      {isMicActive ? <><MicOff className="w-4 h-4" /> {t("micOff")}</> : <><Mic className="w-4 h-4" /> {t("micOn")}</>}
                    </Button>
                    <Button size="sm" variant="outline"
                      className={`border-[#30363d] gap-1.5 ${isCamActive ? "border-blue-500 text-blue-400 bg-blue-950/30" : "text-slate-400"}`}
                      onClick={onToggleCamera}
                    >
                      {isCamActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </Button>
                    <span className="text-slate-600 text-xs">{currentAnswer.length} {t("chars")}</span>
                  </div>
                  <Button
                    onClick={onSubmitAnswer}
                    disabled={currentAnswer.trim().length < 3 || aiThinking}
                    className="bg-primary hover:bg-primary/90 text-white disabled:opacity-40 gap-1"
                  >
                    {isLast ? t("finishBtn") : t("nextBtn")} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: chat + progress dots */}
          <div className="lg:w-72 shrink-0 flex flex-col gap-3">
            <Card className="bg-[#161b22] border-[#30363d] flex-1 flex flex-col">
              <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
                <span className="text-slate-400 text-xs font-medium">{t("chat")}</span>
                {isMicActive && (
                  <span className="inline-flex gap-1 items-end">
                    {[1, 2, 3].map(i => (
                      <span key={i} className="block w-1 rounded-full bg-red-400 animate-pulse"
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
                  <div key={i}
                    className={`text-xs rounded-lg p-2.5 ${entry.role === "ai" ? "bg-[#0d1117] text-slate-300 border-l-2 border-primary" : "bg-blue-950/40 text-blue-300 border-l-2 border-blue-500"}`}
                  >
                    <span className="text-[10px] opacity-60 block mb-0.5">
                      {entry.role === "ai" ? "🤖 AI" : "👤 Siz"}
                      {entry.score !== undefined && <span className="ml-2 text-primary">+{entry.score}/10</span>}
                    </span>
                    {entry.text}
                  </div>
                ))}
                {aiThinking && (
                  <div className="text-xs rounded-lg p-2.5 bg-[#0d1117] text-slate-500 border-l-2 border-primary animate-pulse">
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
                  <div key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < currentQIndex ? "bg-[var(--ep-green)] text-white" : i === currentQIndex ? "bg-primary text-white ring-2 ring-primary/40" : "bg-[#30363d] text-slate-500"}`}
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
