/**
 * @module AIInterviewPublicPageSections
 * @description Status screens, camera-check, and ready-step panels for AIInterviewPublicPage.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Video, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Globe } from "lucide-react";
import type { SessionInfo, Language } from "./AIInterviewPublicPageTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface TFn {
  (key: string): string;
}

// ---------------------------------------------------------------------------
// Terminal-state screens
// ---------------------------------------------------------------------------

export function ValidatingScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center space-y-4">
        <EPLoader className="w-12 h-12 mx-auto" />
        <p className="text-white text-lg">{t("intervyuSessiyasiTekshirilmoqda")}</p>
      </div>
    </div>
  );
}

export function ExpiredScreen({ t }: { t: TFn }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <Card className="bg-[#161b22] border-red-700 max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-4">
          <Clock className="w-16 h-16 text-[var(--ep-red)] mx-auto" />
          <h2 className="text-xl font-bold text-white">{t("expired")}</h2>
          <p className="text-slate-400">{t("expiredDesc")}</p>
          <p className="text-slate-500 text-sm">{t("hrEmail")}</p>
          <Badge className="bg-red-900/50 text-red-300 border-red-700">{t("muddatiTugagan")}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function InvalidScreen({ t }: { t: TFn }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <Card className="bg-[#161b22] border-red-700 max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-[var(--ep-yellow)] mx-auto" />
          <h2 className="text-xl font-bold text-white">{t("invalid")}</h2>
          <p className="text-slate-400">{t("invalidDesc")}</p>
          <p className="text-slate-500 text-sm">{t("newHrLink")}</p>
          <Badge className="bg-amber-900/50 text-amber-300 border-amber-700">{t("notogriHavola")}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function CancelledScreen({ t, cancelledReason }: { t: TFn; cancelledReason: string }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <Card className="bg-[#161b22] border-red-700 max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-4">
          <XCircle className="w-16 h-16 text-[var(--ep-red)] mx-auto" />
          <h2 className="text-xl font-bold text-white">{t("cancelled")}</h2>
          <p className="text-slate-400">{cancelledReason || t("cancelledDesc")}</p>
          <p className="text-slate-500 text-sm">{t("hrEmail")}</p>
          <Badge className="bg-red-900/50 text-red-300 border-red-700">{t("bekorQilindi")}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export function CompletedScreen({ t }: { t: TFn }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <Card className="bg-[#161b22] border-green-700 max-w-md w-full">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-[var(--ep-green)]" />
          </div>
          <h2 className="text-xl font-bold text-white">{t("completed")}</h2>
          <p className="text-slate-400">{t("completedDesc")}</p>
          <p className="text-slate-500 text-sm">{t("hrContact")}</p>
          <Badge className="bg-green-900/50 text-green-300 border-green-700 text-sm px-3 py-1">
            {t("muvaffaqiyatli")}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Camera-check step
// ---------------------------------------------------------------------------

interface CameraCheckSectionProps {
  t: TFn;
  session: SessionInfo | undefined;
  cameraReady: boolean;
  micReady: boolean;
  cameraRejections: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCheckDevices: () => void;
  onProceed: () => void;
}

export function CameraCheckSection({
  t, session, cameraReady, micReady, cameraRejections, videoRef, onCheckDevices, onProceed,
}: CameraCheckSectionProps) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <Card className="bg-[#161b22] border-[#30363d] max-w-md w-full">
        <CardHeader>
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <CardTitle className="text-white">{t("title")}</CardTitle>
            <p className="text-slate-400 text-sm mt-1">{t("checkDevices")}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {session?.candidate_name && (
            <div className="text-center py-2 px-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-slate-400 text-xs">{t("xushKelibsiz")}</p>
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
              {cameraReady && <CheckCircle className="w-4 h-4 text-[var(--ep-green)] ml-auto" />}
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${micReady ? "border-green-700 bg-green-950/30" : "border-[#30363d] bg-[#0d1117]"}`}>
              <Mic className={`w-5 h-5 ${micReady ? "text-green-400" : "text-slate-500"}`} />
              <span className={micReady ? "text-green-400" : "text-slate-400"}>{t("mic")}</span>
              {micReady && <CheckCircle className="w-4 h-4 text-[var(--ep-green)] ml-auto" />}
            </div>
          </div>
          {cameraRejections > 0 && cameraRejections < 3 && (
            <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-950/30 border border-amber-800 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Kamera ruxsati rad etildi ({cameraRejections}/3). Yana {3 - cameraRejections} marta ruxsat bermangiz — intervyu bekor bo'ladi.</span>
            </div>
          )}
          {!cameraReady && (
            <Button onClick={onCheckDevices} className="w-full bg-primary hover:bg-primary/90 text-white">
              {t("checkDevices")}
            </Button>
          )}
          {cameraReady && micReady && (
            <Button onClick={onProceed} className="w-full bg-primary hover:bg-primary/90 text-white">
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

// ---------------------------------------------------------------------------
// Ready step
// ---------------------------------------------------------------------------

interface ReadySectionProps {
  t: TFn;
  lang: Language;
  onSetLang: (l: Language) => void;
  onStart: () => void;
}

export function ReadySection({ t, lang, onSetLang, onStart }: ReadySectionProps) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <Card className="bg-[#161b22] border-[#30363d] max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-white text-center">{t("ready")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 space-y-1 text-sm text-slate-300">
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
                  onClick={() => onSetLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${lang === l ? "bg-primary text-white border-primary" : "text-slate-400 border-[#30363d] hover:border-slate-500"}`}
                >
                  {l === "uz" ? "O'zbek" : l === "ru" ? "Русский" : "English"}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={onStart}
            className="w-full bg-primary hover:bg-primary/90 text-white py-5 text-base font-semibold"
          >
            {t("startInterview")} <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
