/**
 * @module ComparisonPanel
 * @description React UI component.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
interface ComparisonData {
  name: string;
  current: number;
  previous: number;
  benchmark?: number;
}

interface ComparisonPanelProps {
  title: string;
  data: ComparisonData[];
  metric: string;
  comparisonType: "time" | "benchmark" | "department" | "position";
}

export function ComparisonPanel({title, data, metric, comparisonType }: ComparisonPanelProps) {
  const { t } = useTranslation('common');
  const [selectedView, setSelectedView] = useState<"chart" | "table">("chart");

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getComparisonLabel = () => {
    switch (comparisonType) {
      case "time":
        return { current: "Joriy davr", previous: "Oldingi davr" };
      case "benchmark":
        return { current: "Hozirgi", previous: "Benchmark" };
      case "department":
        return { current: "Bo'lim", previous: "Kompaniya o'rtachasi" };
      case "position":
        return { current: "Lavozim", previous: "Kompaniya o'rtachasi" };
    }
  };

  const labels = getComparisonLabel();

  return (
    <Card className="backdrop-blur-sm bg-card/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[14px] font-semibold">{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedView === "chart" ? "default" : "outline"}
              onClick={() => setSelectedView("chart")}
            >
              {t("grafik")}
            </Button>
            <Button
              size="sm"
              variant={selectedView === "table" ? "default" : "outline"}
              onClick={() => setSelectedView("table")}
            >
              {t("jadval")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedView === "chart" ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="current" fill="hsl(var(--primary))" name={labels.current} radius={[8, 8, 0, 0]} />
              <Bar dataKey="previous" fill="hsl(var(--muted))" name={labels.previous} radius={[8, 8, 0, 0]} />
              {data[0]?.benchmark !== undefined && (
                <Bar dataKey="benchmark" fill="hsl(var(--chart-3))" name="Benchmark" radius={[8, 8, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm font-medium border-b pb-2">
              <div>{t("nom")}</div>
              <div className="text-right">{labels.current}</div>
              <div className="text-right">{labels.previous}</div>
              <div className="text-right">{t("ozgarish")}</div>
              <div className="text-right">{t('status1')}</div>
            </div>
            {(Array.isArray(data) ? data : []).map((item, index) => {
              const change = calculateChange(item.current, item.previous);
              const isPositive = change > 0;
              
              return (
                <div key={`k-${index}`} className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm items-center py-2 border-b border-border/50">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-right font-semibold">{item.current.toFixed(1)}{metric}</div>
                  <div className="text-right text-muted-foreground">{item.previous.toFixed(1)}{metric}</div>
                  <div className={`text-right font-medium ${isPositive ? "text-[var(--ep-green)] dark:text-green-400" : "text-[var(--ep-red)] dark:text-red-400"}`}>
                    {isPositive ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                  <div className="text-right">
                    {isPositive ? (
                      <Badge variant="default" className="bg-green-500/10 text-[var(--ep-green)] dark:text-green-400 border-green-500/20">
                        {t("Yaxshi")}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-red-500/10 text-[var(--ep-red)] dark:text-red-400 border-red-500/20">
                        {t("pasaygan")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {(Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.current, 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Jami {labels.current.toLowerCase()}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {(Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.previous, 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Jami {labels.previous.toLowerCase()}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              (Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.current, 0) > (Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.previous, 0)
                ? "text-[var(--ep-green)] dark:text-green-400"
                : "text-[var(--ep-red)] dark:text-red-400"
            }`}>
              {(
                (((Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.current, 0) - (Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.previous, 0)) /
                  (Array.isArray(data) ? data : []).reduce((sum, item) => sum + item.previous, 0)) *
                100
              ).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t("umumiyOzgarish")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
