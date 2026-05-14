/**
 * @module AbcAnalysisCard
 * @description React UI component.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Award, AlertCircle, Brain, Heart, Shield, CheckSquare, Clock, Lightbulb, Gift } from "lucide-react";

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
            <CardTitle>ABC Analiz</CardTitle>
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
                <>Hisoblanyapti...</>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-1" />
                  Qayta hisoblash
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              data-testid="button-edit-abc"
            >
              Tahrirlash
            </Button>
          </div>
        </div>
        <CardDescription>
          Xodimning ish faoliyati va shaxsiy ma'lumotlari asosida baholash
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis ? (
          <>
            {/* Daraja va Ball */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-2">Daraja</div>
                <Badge className={`${getGradeColor(analysis.grade)} text-white text-xl px-6 py-2`}>
                  {analysis.grade} - {getGradeText(analysis.grade)}
                </Badge>
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-2">Ball</div>
                <div className="text-4xl font-bold">{analysis.score}/5</div>
              </div>
            </div>

            {/* Batafsil kategoriyalar */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Baholash kategoriyalari
              </h4>

              {/* 1. Bilim darajasi */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-[var(--ep-blue)]" />
                    <h5 className="font-semibold">1. Bilim darajasi</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Testlardan o'tish</span>
                      <span className="font-semibold">{analysis.testPassRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.testPassRate ?? 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Kurslarni tugatish</span>
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
                    <h5 className="font-semibold">2. Sadoqat va fidokorlik</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Umumiy samaradorlik</span>
                      <span className="font-semibold">{analysis.performanceRate ?? 0}%</span>
                    </div>
                    <Progress value={analysis.performanceRate ?? 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Davomat</span>
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
                    <span className="text-sm">Intizom balli</span>
                    <Badge
                      variant={(analysis.disciplineScore ?? 0) >= 0 ? "default" : "destructive"}
                      className="text-lg px-4"
                    >
                      {(analysis.disciplineScore ?? 0) > 0 ? '+' : ''}{analysis.disciplineScore ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Qoidabuzarlik yo'q bo'lsa +ball, bor bo'lsa -ball
                  </p>
                </CardContent>
              </Card>

              {/* 4. Topshiriqlarni bajarish */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-5 w-5 text-[var(--ep-purple)]" />
                    <h5 className="font-semibold">4. Topshiriqlarni 100% bajarish</h5>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bajarilgan topshiriqlar</span>
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
                      <span>Vaqtida kelish ko'rsatkichi</span>
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
                    <h5 className="font-semibold">6. Tashabbus va g'oyalar</h5>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taqdim etilgan g'oyalar</span>
                    <Badge variant="secondary" className="text-lg px-4">
                      {analysis.initiativeCount ?? 0}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kompaniya rivojiga hissa qo'shish
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Imtiyozlar darajaga ko'ra */}
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Darajaga ko'ra imtiyozlar</h4>
                </div>

                {/* A daraja imtiyozlari */}
                <div className={`p-4 rounded-lg ${analysis.grade === 'A' ? 'bg-green-500/10 border-2 border-green-500' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[var(--ep-green)] text-white">A Daraja (5 ball)</Badge>
                    {analysis.grade === 'A' && <Badge variant="secondary">Joriy daraja ✓</Badge>}
                  </div>
                  <p className="text-sm mb-3 font-semibold">A'lo xodim - To'liq imtiyozlar:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Badge variant="outline" className="justify-start">💰 Kompaniyadan kredit</Badge>
                    <Badge variant="outline" className="justify-start">✈️ Safari/Sayohat</Badge>
                    <Badge variant="outline" className="justify-start">📈 Oylik oshirish</Badge>
                    <Badge variant="outline" className="justify-start">🎁 Moliyaviy yordam</Badge>
                    <Badge variant="outline" className="justify-start">🏆 Bonus to'lovlar</Badge>
                    <Badge variant="outline" className="justify-start">🎓 O'qitishlar</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    100%+ ko'rsatkich, bilimli, sadoqatli, qoidabuzarlik yo'q, vaqtida keladigan, tashabbus beradigan xodim
                  </p>
                </div>

                {/* B daraja imtiyozlari */}
                <div className={`p-4 rounded-lg ${analysis.grade === 'B' ? 'bg-blue-500/10 border-2 border-blue-500' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[var(--ep-blue)] text-white">B Daraja (4 ball)</Badge>
                    {analysis.grade === 'B' && <Badge variant="secondary">Joriy daraja ✓</Badge>}
                  </div>
                  <p className="text-sm mb-3">Yaxshi xodim - Cheklangan imtiyozlar:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Badge variant="outline" className="justify-start">🎁 Bonus to'lovlar</Badge>
                    <Badge variant="outline" className="justify-start">🎓 O'qitishlar</Badge>
                  </div>
                </div>

                {/* C daraja */}
                <div className={`p-4 rounded-lg ${analysis.grade === 'C' ? 'bg-orange-500/10 border-2 border-orange-500' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[var(--ep-primary)] text-white">C Daraja (3 ball)</Badge>
                    {analysis.grade === 'C' && <Badge variant="secondary">Joriy daraja ✓</Badge>}
                  </div>
                  <p className="text-sm mb-2">Qoniqarli xodim - Imtiyozlar yo'q</p>
                  <p className="text-xs text-muted-foreground">
                    Ko'rsatkichlarni yaxshilash kerak
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Izohlar */}
            {analysis.notes && (
              <div>
                <h4 className="font-semibold mb-2">Izohlar</h4>
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
