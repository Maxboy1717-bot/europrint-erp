/**
 * @module HRCapitalPublicTestSections
 * @description Status/intro/replication screen components for HRCapitalPublicTest page.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, ClipboardList, ChevronRight } from "lucide-react";
import type { HrcSession, HrcQuestion, TestTypeConfig } from "./HRCapitalPublicTestTypes";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
export function LoadingScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <EPLoader className="w-10 h-10 mx-auto mb-3" />
        <p className="text-muted-foreground">{t("testYuklanmoqda")}</p>
      </div>
    </div>
  );
}

export function SubmittingScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <EPLoader className="w-10 h-10 mx-auto mb-3" />
        <p className="text-muted-foreground">{t("natijalarHisoblanmoqda")}</p>
      </div>
    </div>
  );
}

export function ExpiredScreen() {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8">
          <AlertCircle className="w-12 h-12 text-[var(--ep-red)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("testMuddatiOtgan")}</h2>
          <p className="text-muted-foreground">{t("ushbuTestLinki24Soatlik")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorScreen({ error }: { error: string }) {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8">
          <AlertCircle className="w-12 h-12 text-[var(--ep-red)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("Xatolik")}</h2>
          <p className="text-muted-foreground">{error || "Test topilmadi"}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function CompletedScreen({ session }: { session: HrcSession | null }) {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8">
          <CheckCircle2 className="w-12 h-12 text-[var(--ep-green)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t("testAllaqachonYakunlangan")}</h2>
          <p className="text-muted-foreground">{t("sizBuTestniAvvalTopshirdingiz")}</p>
          {session?.score != null && (
            <div className="mt-4 text-4xl font-bold text-primary">{session?.score}%</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface IntroScreenProps {
  session: HrcSession | null;
  questions: HrcQuestion[];
  testConfig: TestTypeConfig;
  onStart: () => void;
}

export function IntroScreen({ session, questions, testConfig, onStart }: IntroScreenProps) {
  const { t } = useTranslation("common");
  const Icon = testConfig.icon;
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className={`w-16 h-16 rounded-xl ${testConfig.color} flex items-center justify-center mx-auto`}>
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{testConfig.label}</h1>
            <p className="text-muted-foreground mt-1">{testConfig.desc}</p>
            {session?.vacancy_title && (
              <Badge className="mt-2 bg-primary/10 text-primary border-0">{session.vacancy_title}</Badge>
            )}
          </div>
          {session?.test_type === "tool_test" && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
              <p className="font-medium mb-2">{t("buTestHaqida")}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{questions.length} ta savol</li>
                <li>Har bir savolga 5 xil javob bor (1 dan 5 gacha)</li>
                <li>{t("halolJavobBeringTogriYoki")}</li>
                <li>{t("natijalarFaqatHrKoradi")}</li>
              </ul>
            </div>
          )}
          {session?.test_type === "iq" && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
              <p className="font-medium mb-2">{t("buTestHaqida")}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{questions.length} ta savol</li>
                <li>{t("harBirSavolgaBirTogri")}</li>
                <li>{t("vaqtCheklanmagan")}</li>
              </ul>
            </div>
          )}
          {session?.test_type === "leadership" && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
              <p className="font-medium mb-2">{t("buTestHaqida")}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{questions.length} ta vaziyat tahlili</li>
                <li>{t("muammoKelibChiqishManbainiToping")}</li>
              </ul>
            </div>
          )}
          {session?.test_type === "replication" && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-left">
              <p className="font-medium mb-2">{t("buTestHaqida")}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t("sizgaKorsatmaBeriladi")}</li>
                <li>{t("korsatmaniOzSozlaringizBilanQayta")}</li>
                <li>Aniqlik va to'liqlik o'lchanadi (maqsad: 90%+)</li>
              </ul>
            </div>
          )}
          <Button className="w-full" size="lg" onClick={onStart} data-testid="button-start-test">
            {t("testniBoshlash")}<ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ReplicationScreenProps {
  questions: HrcQuestion[];
  replicationText: string;
  setReplicationText: (v: string) => void;
  onSubmit: () => void;
}

export function ReplicationScreen({ questions, replicationText, setReplicationText, onSubmit }: ReplicationScreenProps) {
  const { t } = useTranslation("common");
  const instruction = questions[0];
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[var(--ep-green)]" /> {t("korsatmaniOqing")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 rounded-xl text-sm leading-relaxed font-medium">
              {instruction?.content_uz ?? "Ko'rsatma yuklanmoqda..."}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">{t("korsatmaniOzSozlaringizBilanYozing")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("diqqatliOqingSongQuyidaQayta")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t("korsatmaniBuYergaYozing")}
              value={replicationText}
              onChange={e => setReplicationText(e.target.value)}
              rows={6}
              className="resize-none"
              data-testid="textarea-replication"
            />
            <Button className="w-full" disabled={replicationText.trim().length < 10} onClick={onSubmit}>
              {t("testniYakunlash")}<ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
