/**
 * @module RemainingTabsB
 * @description TestsTab component and re-export of HrTab.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, Award, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, ComposedChart, Line,
} from "recharts";
import type { RemainingTabsProps } from "./RemainingTabsTypes";
import { useTranslation } from '@/lib/i18n';

import { tLabel } from '@/lib/i18n/tLabel';
export { HrTab } from "./RemainingTabsHr";

// ---------------------------------------------------------------------------
// TestsTab
// ---------------------------------------------------------------------------

export function TestsTab({
  stats,
  testResults,
}: Pick<RemainingTabsProps, 'stats' | 'testResults'>) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("jamiTestlar")}</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTests || 0}</div>
            <p className="text-xs text-muted-foreground">{t("barchaTestlar")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("otganlar")}</CardTitle>
            <CheckCircle className="w-4 h-4 text-[var(--ep-green)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-green)]">{stats?.passedTests || 0}</div>
            <p className="text-xs text-muted-foreground">{t("muvaffaqiyatli1")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("otishFoizi1")}</CardTitle>
            <Award className="w-4 h-4 text-[var(--ep-blue)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-blue)]">{stats?.passRate || 0}%</div>
            <p className="text-xs text-muted-foreground">{t("umumiyFoiz")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("ortachaVaqt")}</CardTitle>
            <Clock className="w-4 h-4 text-[var(--ep-purple)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--ep-purple)]">{stats?.averageTestTime || 0}</div>
            <p className="text-xs text-muted-foreground">{t("daqiqa1")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("testNatijalari")}</CardTitle>
            <CardDescription>{t("harBirTestBoyichaOrtacha")}</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length > 0 ? (
              <div className="glass-chart">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={(Array.isArray(testResults) ? testResults : []).slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="testTitle" angle={-15} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageScore" fill="hsl(var(--primary))" name={tLabel('analytics.RemainingTabsB.ortachaBall', "O'rtacha ball %")} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("otishStatistikasi")}</CardTitle>
            <CardDescription>{t("otganVaOtmaganXodimlarNisbati")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={[
                    { name: "O'tgan", value: stats?.passedTests || 0, fill: '#22c55e' },
                    { name: "O'tmagan", value: (stats?.totalTests || 0) - (stats?.passedTests || 0), fill: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  dataKey="value"
                >
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("savolTuriTaqsimoti")}</CardTitle>
            <CardDescription>{t("savolTurlarigaKoraTahlil")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Ko\'p tanlovli', value: 0, fill: '#3b82f6' },
                    { name: 'Ochiq savol', value: 0, fill: '#22c55e' },
                    { name: 'Haqiqat/Yolg\'on', value: 0, fill: '#eab308' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("harBirSavolgaKetganVaqt")}</CardTitle>
            <CardDescription>{t("oRtachaVaqtSoniyalarda")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { type: 'Oson', avgTime: 25 },
                { type: "O'rtacha", avgTime: 45 },
                { type: 'Qiyin', avgTime: 75 },
                { type: 'Juda qiyin', avgTime: 120 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgTime" fill="hsl(var(--chart-2))" name={tLabel('analytics.RemainingTabsB.ortachaVaqtS', "O'rtacha vaqt (s)")} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("qaytaUrinishlarTahlili")}</CardTitle>
          <CardDescription>{t("xodimlarningQaytaUrinishNaqshlari")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="glass-chart">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={[
              { attempt: '1-urinish', count: 45, passRate: 45 },
              { attempt: '2-urinish', count: 30, passRate: 65 },
              { attempt: '3-urinish', count: 15, passRate: 75 },
              { attempt: '4+ urinish', count: 10, passRate: 82 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempt" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" name={tLabel('analytics.RemainingTabsB.xodimlarSoni', "Xodimlar soni")} />
              <Line type="monotone" dataKey="passRate" stroke="#22c55e" strokeWidth={2} name={tLabel('analytics.RemainingTabsB.otishFoizi', "O'tish foizi %")} />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("testlarQiyinlikDarajasi")}</CardTitle>
          <CardDescription>{t("qiyinlikBoyichaTestlarTaqsimoti")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("oson80100OTish")}</span>
                <Badge variant="outline" className="bg-green-50">
                  {Math.round((testResults.length || 0) * 0.25)} test
                </Badge>
              </div>
              <Progress value={25} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("oRtacha6079OTish")}</span>
                <Badge variant="outline" className="bg-blue-50">
                  {Math.round((testResults.length || 0) * 0.45)} test
                </Badge>
              </div>
              <Progress value={45} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("qiyin4059OTish")}</span>
                <Badge variant="outline" className="bg-yellow-50">
                  {Math.round((testResults.length || 0) * 0.20)} test
                </Badge>
              </div>
              <Progress value={20} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("judaQiyin039OTish")}</span>
                <Badge variant="outline" className="bg-red-50">
                  {Math.round((testResults.length || 0) * 0.10)} test
                </Badge>
              </div>
              <Progress value={10} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
