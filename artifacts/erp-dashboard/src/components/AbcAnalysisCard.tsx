/**
 * @module AbcAnalysisCard
 * @description React UI component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Award, AlertCircle, Brain, Heart, Shield, CheckSquare, Clock, Lightbulb, Gift } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface AbcAnalysis {
  grade: string;
  score: number;
  testPassRate?: number;
  courseCompletionRate?: number;
  performanceRate?: number;
  attendanceRate?: number;
  disciplineScore?: number;
  taskCompletionRate?: number;
  punctualityRate?: number;
  initiativeCount?: number;
  benefits?: unknown[];
  notes?: string;
  lastCalculated?: string;
}

interface AbcAnalysisCardProps {
  analysis: AbcAnalysis | null;
  onCalculate: () => void;
  onEdit: () => void;
  isCalculating?: boolean;
}

export function AbcAnalysisCard({ analysis, onCalculate, onEdit, isCalculating }: AbcAnalysisCardProps) {
  const { t } = useTranslation("common");
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500";
      case "B":
        return "bg-blue-500";
      case "C":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getGradeText = (grade: string) => {
    switch (grade) {
      case "A":
        return "A'lo";
      case "B":
        return "Yaxshi";
      case "C":
        return "Qoniqarli";
      default:
        return "Baholanmagan";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>{t("abcAnaliz")}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onCalculate}
              disabled={isCalculating}
              data-testid="button-calculate-abc"
            >
              {isCalculating ? (
                <>{t("hisoblanyapti")}</>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-1" />
                  {t("qaytaHisoblash")}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              data-testid="button-edit-abc"
            >
              {t("edit")}
            </Button>
          </div>
        </div>
        <CardDescription>
          {t("xodimningIshFaoliyatiVaShaxsiy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis ? (
          <>
            {/* Daraja va Ball */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-2">{t("daraja")}</div>
                <Badge className={`${getGradeColor(analysis.grade)} text-white text-xl px-6 py-2`}>
                  {analysis.grade} - {getGradeText(analysis.grade)}
                </Badge>
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-2">{t("ball")}</div>
                <div className="text-4xl font-bold">{analysis.score}/5</div>
              </div>
            </div>

            {/* Batafsil kategoriyalar */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t("baholashKategoriyalari")}
              </h4>

              {/* 1. Bilim darajasi */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-[var(--ep-blue)]" />
                    <h5 className="font-semibold">{t("k1BilimDarajasi")}</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("testlardanOtish")}</span>
                      <span className="font-semibold">{analysis.testPassRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.testPassRate ?? 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("kurslarniTugatish")}</span>
                      <span className="font-semibold">{analysis.courseCompletionRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.courseCompletionRate ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* 2. Sadoqat va fidokorlik */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-[var(--ep-red)]" />
                    <h5 className="font-semibold">{t("k2SadoqatVaFidokorlik")}</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("umumiySamaradorlik")}</span>
                      <span className="font-semibold">{analysis.performanceRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.performanceRate ?? 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("davomat")}</span>
                      <span className="font-semibold">{analysis.attendanceRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.attendanceRate ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* 3. Intizom (qoidalarga rioya qilish) */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-[var(--ep-green)]" />
                    <h5 className="font-semibold">3. Intizom (qoidalarga rioya qilish)</h5>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t("intizomBalli")}</span>
                    <Badge
                      variant={(analysis.disciplineScore ?? 0) >= 0 ? "default" : "destructive"}
                      className="text-lg px-4"
                    >
                      {(analysis.disciplineScore ?? 0) > 0 ? '+' : ''}{analysis.disciplineScore ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("qoidabuzarlikYoqBolsaBallBor")}
                  </p>
                </CardContent>
              </Card>

              {/* 4. Topshiriqlarni bajarish */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-5 w-5 text-[var(--ep-purple)]" />
                    <h5 className="font-semibold">{t("k4Topshiriqlarni100Bajarish")}</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("bajarilganTopshiriqlar")}</span>
                      <span className="font-semibold">{analysis.taskCompletionRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.taskCompletionRate ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* 5. Vaqtida kelish */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-[var(--ep-primary)]" />
                    <h5 className="font-semibold">5. Vaqtida kelish (kech qolmaslik)</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t("vaqtidaKelishKorsatkichi")}</span>
                      <span className="font-semibold">{analysis.punctualityRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.punctualityRate ?? 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* 6. Tashabbus va g'oyalar */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-5 w-5 text-[var(--ep-yellow)]" />
                    <h5 className="font-semibold">{t("k6TashabbusVaGoyalar")}</h5>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t("taqdimEtilganGoyalar")}</span>
                    <Badge variant="secondary" className="text-lg px-4">
                      {analysis.initiativeCount ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("kompaniyaRivojigaHissaQoshish")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Imtiyozlar darajaga ko'ra */}
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">{t("darajagaKoraImtiyozlar")}</h4>
                </div>

                {/* A daraja imtiyozlari */}
                <div className={`p-4 rounded-lg ${analysis.grade === 'A' ? 'bg-green-500/10 border-2 border-green-500' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[var(--ep-green)] text-white">A Daraja (5 ball)</Badge>
                    {analysis.grade === 'A' && <Badge variant="secondary">{t("joriyDaraja")}</Badge>}
                  </div>
                  <p className="text-sm mb-3 font-semibold">{t("aloXodimToliqImtiyozlar")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Badge variant="outline" className="justify-start">{t("kompaniyadanKredit")}</Badge>
                    <Badge variant="outline" className="justify-start">✈️ Safari/Sayohat</Badge>
                    <Badge variant="outline" className="justify-start">{t("oylikOshirish")}</Badge>
                    <Badge variant="outline" className="justify-start">{t("moliyaviyYordam")}</Badge>
                    <Badge variant="outline" className="justify-start">{t("bonusTolovlar")}</Badge>
                    <Badge variant="outline" className="justify-start">{t("oqitishlar")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("k100KorsatkichBilimliSadoqatliQoidabuzarlik")}
                  </p>
                </div>

                {/* B daraja imtiyozlari */}
                <div className={`p-4 rounded-lg ${analysis.grade === 'B' ? 'bg-blue-500/10 border-2 border-blue-500' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[var(--ep-blue)] text-white">B Daraja (4 ball)</Badge>
                    {analysis.grade === 'B' && <Badge variant="secondary">{t("joriyDaraja")}</Badge>}
                  </div>
                  <p className="text-sm mb-3">{t("yaxshiXodimCheklanganImtiyozlar")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Badge variant="outline" className="justify-start">{t("bonusTolovlar1")}</Badge>
                    <Badge variant="outline" className="justify-start">{t("oqitishlar")}</Badge>
                  </div>
                </div>

                {/* C daraja */}
                <div className={`p-4 rounded-lg ${analysis.grade === 'C' ? 'bg-orange-500/10 border-2 border-orange-500' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[var(--ep-primary)] text-white">C Daraja (3 ball)</Badge>
                    {analysis.grade === 'C' && <Badge variant="secondary">{t("joriyDaraja")}</Badge>}
                  </div>
                  <p className="text-sm mb-2">{t("qoniqarliXodimImtiyozlarYoq")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("korsatkichlarniYaxshilashKerak")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Izohlar */}
            {analysis.notes && (
              <div>
                <h4 className="font-semibold mb-2">{t("notes")}</h4>
                <p className="text-sm text-muted-foreground">{analysis.notes}</p>
              </div>
            )}

            {/* Oxirgi yangilanish */}
            {analysis.lastCalculated && (
              <div className="text-xs text-muted-foreground">
                Oxirgi hisoblangan: {new Date(analysis.lastCalculated).toLocaleString('uz-UZ')}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              ABC analiz hali amalga oshirilmagan
            </p>
            <Button onClick={onCalculate} disabled={isCalculating} data-testid="button-first-calculate">
              {isCalculating ? "Hisoblanyapti..." : "Analiz qilish"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
