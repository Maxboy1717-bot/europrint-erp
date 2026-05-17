/**
 * @module AbcAnalysisTab
 * @description React UI component.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChartIcon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/format";
import { AbcData, AbcItem, TranslationType, ABC_COLORS, PIE_COLORS } from "./types";
import { apiRequest } from '@/lib/queryClient';

interface AbcAnalysisTabProps {
  t: TranslationType;
  period: string;
  setPeriod: (val: string) => void;
}

export function AbcAnalysisTab({ t, period, setPeriod }: AbcAnalysisTabProps) {
  const { data: abcData, isLoading: isLoadingAbc, refetch: refetchAbc } = useQuery<AbcData>({
    queryKey: ["/api/warehouse/reports/abc-analysis", period],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      return await apiRequest('GET', `/api/warehouse/reports/abc-analysis?${params}`);
    },
  });

  const abcPieData = useMemo(() => {
    if (!abcData?.summary) return [];
    return [
      { name: "A", value: abcData.summary.classA },
      { name: "B", value: abcData.summary.classB },
      { name: "C", value: abcData.summary.classC },
    ];
  }, [abcData]);

  if (isLoadingAbc) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([1, 2, 3]).map(i => <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>{t.abc.period}</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 h-9" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="60">60</SelectItem>
              <SelectItem value="90">90</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetchAbc()} data-testid="button-refresh-abc">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.abc.distribution}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={abcPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(Array.isArray(abcPieData) ? abcPieData : []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ABC_COLORS[entry.name as keyof typeof ABC_COLORS] || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.abc.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.abc.material}</TableHead>
                    <TableHead className="text-right">{t.abc.totalValue}</TableHead>
                    <TableHead className="text-right">{t.abc.percentage}</TableHead>
                    <TableHead className="text-right">{t.abc.cumulative}</TableHead>
                    <TableHead className="text-center">{t.abc.class}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abcData?.data?.map((item: AbcItem) => (
                    <TableRow key={item.materialId} data-testid={`row-abc-${item.materialId}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalValue)} {t.common.sum}</TableCell>
                      <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{item.cumulativePercentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.class === 'A' ? 'bg-green-500/20 text-green-400' :
                          item.class === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.class}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!abcData?.data || abcData.data.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {t.common.noData}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table></div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
