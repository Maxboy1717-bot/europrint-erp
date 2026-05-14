/**
 * @module AssessmentTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Award, BookOpen, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type {
  DifficultyAnalysis, QuestionAnalysisItem, DiscriminationData, DiscriminationItem,
  ReliabilityData, ReliabilityTest, ItemAnalysisData, DifficultyDistributionItem
} from "./analytics-types";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface AssessmentTabProps {
  difficultyData: DifficultyAnalysis | undefined;
  difficultyLoading: boolean;
  discriminationData: DiscriminationData | undefined;
  discriminationLoading: boolean;
  reliabilityData: ReliabilityData | undefined;
  reliabilityLoading: boolean;
  itemAnalysis: ItemAnalysisData | undefined;
  itemAnalysisLoading: boolean;
  COLORS: string[];
}

export function AssessmentTab({
  difficultyData,
  discriminationData,
  reliabilityData,
  itemAnalysis,
  COLORS,
}: AssessmentTabProps) {
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha Qiyinlik</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{difficultyData?.averageDifficulty || 0}%</div>
            <p className="text-xs text-muted-foreground">To'g'ri javob berish foizi</p>
            <Progress value={difficultyData?.averageDifficulty || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discriminatsiya</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discriminationData?.averageDiscrimination || 0}%</div>
            <p className="text-xs text-muted-foreground">O'rtacha farqlash indeksi</p>
            <Progress value={Math.abs(discriminationData?.averageDiscrimination || 0)} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KR-20 Ishonchlilik</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reliabilityData?.averageReliability || 0}%</div>
            <p className="text-xs text-muted-foreground">Test ichki izchilligi</p>
            <Progress value={reliabilityData?.averageReliability || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Savollar</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemAnalysis?.totalQuestions || 0}</div>
            <p className="text-xs text-muted-foreground">Tahlil qilingan savollar</p>
            <p className="text-xs text-muted-foreground mt-1">
              {itemAnalysis?.totalAttempts || 0} urinish
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📊 Savol Qiyinligi (p-value)</CardTitle>
            <CardDescription>Eng oson va eng qiyin savollar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {difficultyData ? (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[var(--ep-green)]">✅ Eng Oson Savollar</h4>
                  {difficultyData.easiest?.slice(0, 3).map((q: QuestionAnalysisItem, idx: number) => (
                    <div key={q.questionId} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{q.question}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.totalAttempts} urinish
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 bg-green-50">
                        {q.pValue}%
                      </Badge>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[var(--ep-red)]">❌ Eng Qiyin Savollar</h4>
                  {difficultyData.hardest?.slice(0, 3).map((q: QuestionAnalysisItem) => (
                    <div key={q.questionId} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{q.question}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.totalAttempts} urinish
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 bg-red-50">
                        {q.pValue}%
                      </Badge>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
                </div>

                {itemAnalysis?.difficultyDistribution && (
                  <div className="glass-chart">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={itemAnalysis.difficultyDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.category}: ${entry.percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(Array.isArray(itemAnalysis.difficultyDistribution) ? itemAnalysis.difficultyDistribution : []).map((_: DifficultyDistributionItem, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Ma'lumot yuklanmoqda...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Discriminatsiya Indeksi</CardTitle>
            <CardDescription>Savol farqlash qobiliyati (top 27% vs bottom 27%)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {discriminationData ? (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[var(--ep-green)]">⭐ Eng Yaxshi Savollar</h4>
                  {discriminationData.best?.slice(0, 3).map((q: DiscriminationItem) => (
                    <div key={q.questionId} className="space-y-1 p-2 rounded border">
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate flex-1">{q.question}</p>
                        <Badge className="ml-2">{q.discriminationIndex}%</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Top 27%: {q.topCorrect}%</span>
                        <span>Bottom 27%: {q.bottomCorrect}%</span>
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-[var(--ep-red)]">⚠️ Eng Zaif Savollar</h4>
                  {discriminationData.worst?.slice(0, 3).map((q: DiscriminationItem) => (
                    <div key={q.questionId} className="space-y-1 p-2 rounded border">
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate flex-1">{q.question}</p>
                        <Badge variant="outline" className="ml-2 bg-red-50">
                          {q.discriminationIndex}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Top 27%: {q.topCorrect}%</span>
                        <span>Bottom 27%: {q.bottomCorrect}%</span>
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
                </div>

                <div className="glass-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={discriminationData.best?.slice(0, 5).map((q: DiscriminationItem) => ({
                      name: q.question.substring(0, 20) + '...',
                      DI: q.discriminationIndex,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="DI" fill="hsl(var(--primary))" name="Discriminatsiya %" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Ma'lumot yuklanmoqda...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔬 KR-20 Ishonchlilik Analizi</CardTitle>
          <CardDescription>Har bir test uchun ichki izchillik koeffitsienti</CardDescription>
        </CardHeader>
        <CardContent>
          {reliabilityData?.tests && reliabilityData.tests.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {reliabilityData.tests.slice(0, 5).map((test: ReliabilityTest) => (
                  <div key={test.testId} className="space-y-2 p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{test.testTitle}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          test.kr20 >= 80 ? "default" : 
                          test.kr20 >= 70 ? "secondary" : 
                          "outline"
                        }>
                          {test.reliability}
                        </Badge>
                        <span className="text-lg font-bold">{test.kr20}%</span>
                      </div>
                    </div>
                    <Progress value={test.kr20} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{test.totalQuestions} savol</span>
                      <span>{test.totalAttempts} urinish</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reliabilityData.tests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="testTitle" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="kr20" fill="hsl(var(--chart-1))" name="KR-20 %" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Test ma'lumotlari topilmadi
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
