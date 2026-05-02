import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2, Plus, TrendingDown, DollarSign, Recycle, Target,
  AlertTriangle, BarChart3, Lightbulb
} from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

interface WasteByTypeItem {
  wasteType: string;
  totalQuantity: string | number;
  totalCost?: string | number;
}

interface WasteByMachineItem {
  machineId: string | null;
  totalQuantity: string | number;
  totalCost: string | number;
}

interface WasteDashboard {
  today?: { totalQuantity: string | number; recordCount: number };
  month?: { totalCost: string | number; totalQuantity: string | number };
  week?: { totalQuantity: string | number; recordCount: number };
  recyclable?: { totalQuantity: string | number; totalRecyclable: string | number; totalRecycled: string | number };
  byType?: WasteByTypeItem[];
  byMachine?: WasteByMachineItem[];
}

interface WasteTrend {
  period: string;
  totalQuantity: string | number;
  totalCost: string | number;
}

interface WasteRecord {
  id: string;
  date: string;
  wasteType: string;
  materialType: string | null;
  quantity: string | number;
  unit: string;
  totalCost: string | number | null;
  machineId: string | null;
  cause: string | null;
  shiftNumber: number | null;
}

interface WasteCause {
  cause: string;
  recordCount: number;
  totalQuantity: string | number;
}

interface WasteByMaterialItem {
  materialType: string;
  totalQuantity: string | number;
}

interface WasteAnalysis {
  topCauses?: WasteCause[];
  recommendations?: string[];
  byType?: WasteByTypeItem[];
  byMaterial?: WasteByMaterialItem[];
}

interface WasteTarget {
  id: string;
  targetType: string;
  period: string;
  maxWastePercentage: number;
  maxWasteCost: number | null;
  machineId: string | null;
  isActive: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
}

const WASTE_TYPES = ["setup", "trim", "defect", "overrun", "material_defect", "other"] as const;
const MATERIAL_TYPES = ["karton", "kraft", "qog'oz", "bo'yoq", "yelim"] as const;
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];


const wasteRecordFormSchema = z.object({
  wasteType: z.enum(["setup", "trim", "defect", "overrun", "material_defect", "other"]),
  materialType: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().default("kg"),
  costPerUnit: z.number().min(0).default(0),
  cause: z.string().optional(),
  correctionAction: z.string().optional(),
  shiftNumber: z.number().int().min(1).max(3).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  isRecyclable: z.boolean().default(false),
  recycledQuantity: z.number().min(0).default(0),
  machineId: z.string().optional(),
  operatorId: z.string().optional(),
  productionOrderId: z.string().optional(),
  orderId: z.string().optional(),
});

const wasteTargetFormSchema = z.object({
  targetType: z.enum(["daily", "weekly", "monthly"]),
  machineId: z.string().optional(),
  materialType: z.string().optional(),
  maxWastePercentage: z.number().min(0).max(100),
  maxWasteCost: z.number().min(0).optional(),
  period: z.string().min(1),
  isActive: z.boolean().default(true),
});

function useWasteTranslations() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const COMMON_KEYS = new Set(['save', 'cancel', 'date', 'notes', 'noData', 'unit']);
  return (key: string) => {
    if (key === 'title') return t('wasteTracking');
    if (COMMON_KEYS.has(key)) return tCommon(key);
    return t(key);
  };
}

function KPICards() {
  const tr = useWasteTranslations();
  const { data: dashboard, isLoading, isError, refetch} = useQuery<WasteDashboard>({
    queryKey: ["/api/waste/dashboard"],
  });

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([1, 2, 3, 4]).map(i => (
          <Card key={`k-${i}`}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: `${tr("totalWaste")} (${tr("today")})`,
      value: `${Number(dashboard?.today?.totalQuantity || 0).toFixed(1)} ${tr("kg")}`,
      sub: `${dashboard?.today?.recordCount || 0} ${tr("records")}`,
      icon: Trash2,
      color: "text-red-500",
    },
    {
      label: `${tr("wasteCost")} (${tr("thisMonth")})`,
      value: `${Number(dashboard?.month?.totalCost || 0).toLocaleString()} UZS`,
      sub: `${Number(dashboard?.month?.totalQuantity || 0).toFixed(1)} ${tr("kg")}`,
      icon: DollarSign,
      color: "text-orange-500",
    },
    {
      label: `${tr("totalWaste")} (${tr("thisWeek")})`,
      value: `${Number(dashboard?.week?.totalQuantity || 0).toFixed(1)} ${tr("kg")}`,
      sub: `${dashboard?.week?.recordCount || 0} ${tr("records")}`,
      icon: TrendingDown,
      color: "text-yellow-500",
    },
    {
      label: tr("recyclable"),
      value: dashboard?.recyclable?.totalQuantity
        ? `${((Number(dashboard.recyclable.totalRecyclable) / Number(dashboard.recyclable.totalQuantity)) * 100).toFixed(1)}%`
        : "0%",
      sub: `${Number(dashboard?.recyclable?.totalRecycled || 0).toFixed(1)} ${tr("kg")} ${tr("recycledQuantity").toLowerCase()}`,
      icon: Recycle,
      color: "text-green-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Array.isArray(cards) ? cards : []).map((card, i) => (
        <Card key={`k-${i}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate" data-testid={`text-kpi-label-${i}`}>{card.label}</p>
                <p className="text-xl font-bold mt-1" data-testid={`text-kpi-value-${i}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color} shrink-0`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WasteByTypeChart() {
  const tr = useWasteTranslations();
  const { data: dashboard } = useQuery<WasteDashboard>({ queryKey: ["/api/waste/dashboard"] });
  const byType = dashboard?.byType || [];

  if (byType.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByType")}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">{tr("noData")}</CardContent>
      </Card>
    );
  }

  const chartData = (Array.isArray(byType) ? byType : []).map((item: WasteByTypeItem) => ({
    name: tr(item.wasteType),
    value: Number(item.totalQuantity),
  }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByType")}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {(Array.isArray(chartData) ? chartData : []).map((_: ChartDataItem, i: number) => <Cell key={`k-${i}`} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function WasteTrendChart() {
  const tr = useWasteTranslations();
  const { data: trends } = useQuery<WasteTrend[]>({ queryKey: ["/api/waste/trends"] });

  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("trendChart")}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">{tr("noData")}</CardContent>
      </Card>
    );
  }

  const chartData = (Array.isArray(trends) ? trends : []).map((item: WasteTrend) => ({
    period: item.period,
    quantity: Number(item.totalQuantity),
    cost: Number(item.totalCost),
  }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("trendChart")}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="quantity" stroke="#ef4444" name={`${tr("quantity")} (${tr("kg")})`} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function WasteByMachineChart() {
  const tr = useWasteTranslations();
  const { data: dashboard } = useQuery<WasteDashboard>({ queryKey: ["/api/waste/dashboard"] });
  const byMachine = dashboard?.byMachine || [];

  if (byMachine.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByMachine")}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">{tr("noData")}</CardContent>
      </Card>
    );
  }

  const chartData = (Array.isArray(byMachine) ? byMachine : []).map((item: WasteByMachineItem) => ({
    machine: item.machineId || "N/A",
    quantity: Number(item.totalQuantity),
    cost: Number(item.totalCost),
  }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("wasteByMachine")}</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="machine" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#3b82f6" name={`${tr("quantity")} (${tr("kg")})`} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AddWasteRecordDialog() {
  const tr = useWasteTranslations();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof wasteRecordFormSchema>>({
    resolver: zodResolver(wasteRecordFormSchema),
    defaultValues: {
      wasteType: "defect",
      quantity: 0,
      unit: "kg",
      costPerUnit: 0,
      date: new Date().toISOString().split("T")[0],
      isRecyclable: false,
      recycledQuantity: 0,
      materialType: "",
      cause: "",
      correctionAction: "",
      notes: "",
      machineId: "",
      operatorId: "",
      productionOrderId: "",
      orderId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof wasteRecordFormSchema>) =>
      apiRequest("POST", "/api/waste/records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/waste/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/waste/trends"] });
      toast({ title: "Muvaffaqiyatli saqlandi" });
      setOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  const qty = form.watch("quantity");
  const cpu = form.watch("costPerUnit");
  const calculatedCost = (qty || 0) * (cpu || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-waste-record"><Plus className="h-4 w-4 mr-1" />{tr("addRecord")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tr("addRecord")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="wasteType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("wasteType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-waste-type"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(WASTE_TYPES) ? WASTE_TYPES : []).map(wt => <SelectItem key={wt} value={wt}>{tr(wt)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="materialType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("materialType")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-material-type"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Array.isArray(MATERIAL_TYPES) ? MATERIAL_TYPES : []).map(mt => <SelectItem key={mt} value={mt}>{mt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("quantity")}</FormLabel>
                  <FormControl><Input type="number" step="0.1" data-testid="input-quantity" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="costPerUnit" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("costPerUnit")}</FormLabel>
                  <FormControl><Input type="number" step="0.01" data-testid="input-cost-per-unit" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormItem>
                <FormLabel>{tr("totalCostLabel")}</FormLabel>
                <Input value={calculatedCost.toLocaleString()} disabled data-testid="text-calculated-cost" />
              </FormItem>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("date")}</FormLabel>
                  <FormControl><Input type="date" data-testid="input-date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shiftNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("shift")}</FormLabel>
                  <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                    <FormControl><SelectTrigger data-testid="select-shift"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1">1-{tr("shift").toLowerCase()}</SelectItem>
                      <SelectItem value="2">2-{tr("shift").toLowerCase()}</SelectItem>
                      <SelectItem value="3">3-{tr("shift").toLowerCase()}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="machineId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("machineId")}</FormLabel>
                  <FormControl><Input data-testid="input-machine-id" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="productionOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("productionOrderId")}</FormLabel>
                  <FormControl><Input data-testid="input-production-order" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="operatorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{tr("operatorId")}</FormLabel>
                  <FormControl><Input data-testid="input-operator-id" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="cause" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr("cause")}</FormLabel>
                <FormControl><Textarea data-testid="input-cause" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="correctionAction" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr("correctionAction")}</FormLabel>
                <FormControl><Textarea data-testid="input-correction-action" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex items-center gap-4 flex-wrap">
              <FormField control={form.control} name="isRecyclable" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel className="mt-0">{tr("isRecyclable")}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-recyclable" /></FormControl>
                </FormItem>
              )} />
              {form.watch("isRecyclable") && (
                <FormField control={form.control} name="recycledQuantity" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="mt-0">{tr("recycledQuantity")}</FormLabel>
                    <FormControl><Input type="number" step="0.1" className="w-24" data-testid="input-recycled-qty" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  </FormItem>
                )} />
              )}
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{tr("notes")}</FormLabel>
                <FormControl><Textarea data-testid="input-notes" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">{tr("cancel")}</Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-record">{tr("save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RecordsTable() {
  const tr = useWasteTranslations();
  const { data: records, isLoading } = useQuery<WasteRecord[]>({
    queryKey: ["/api/waste/records"],
  });

  if (isLoading) {
    return <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm">{tr("records")}</CardTitle>
        <AddWasteRecordDialog />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr("date")}</TableHead>
                <TableHead>{tr("wasteType")}</TableHead>
                <TableHead>{tr("materialType")}</TableHead>
                <TableHead className="text-right">{tr("quantity")}</TableHead>
                <TableHead className="text-right">{tr("totalCostLabel")}</TableHead>
                <TableHead>{tr("machineId")}</TableHead>
                <TableHead>{tr("cause")}</TableHead>
                <TableHead>{tr("shift")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!records || records.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">{tr("noData")}</TableCell>
                </TableRow>
              ) : (
                (Array.isArray(records) ? records : []).map((record: WasteRecord) => (
                  <TableRow key={record.id} data-testid={`row-waste-${record.id}`}>
                    <TableCell className="text-sm">{record.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{tr(record.wasteType)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{record.materialType || "-"}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{Number(record.quantity).toFixed(1)} {record.unit}</TableCell>
                    <TableCell className="text-right text-sm">{Number(record.totalCost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{record.machineId || "-"}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{record.cause || "-"}</TableCell>
                    <TableCell className="text-sm">{record.shiftNumber || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisTab() {
  const tr = useWasteTranslations();
  const { data: analysis, isLoading } = useQuery<WasteAnalysis>({
    queryKey: ["/api/waste/analysis"],
  });

  if (isLoading) {
    return <div className="space-y-4">{([1, 2]).map(i => <Card key={`k-${i}`}><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />{tr("topCauses")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!analysis?.topCauses || analysis.topCauses.length === 0) ? (
            <p className="text-sm text-muted-foreground">{tr("noData")}</p>
          ) : (
            <div className="space-y-2">
              {(Array.isArray(analysis.topCauses) ? analysis.topCauses : []).map((cause: WasteCause, i: number) => (
                <div key={`k-${i}`} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
                  <span className="text-sm">{cause.cause}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{cause.recordCount}x</Badge>
                    <span className="text-sm font-medium">{Number(cause.totalQuantity).toFixed(1)} {tr("kg")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-green-500" />{tr("recommendations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(!analysis?.recommendations || analysis.recommendations.length === 0) ? (
            <p className="text-sm text-muted-foreground">{tr("noData")}</p>
          ) : (
            <ul className="space-y-2">
              {(Array.isArray(analysis.recommendations) ? analysis.recommendations : []).map((rec: string, i: number) => (
                <li key={`k-${i}`} className="text-sm flex gap-2">
                  <span className="text-green-500 shrink-0">&#8226;</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("byType")}</CardTitle></CardHeader>
          <CardContent>
            {(!analysis?.byType || analysis.byType.length === 0) ? (
              <p className="text-sm text-muted-foreground">{tr("noData")}</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(analysis.byType) ? analysis.byType : []).map((item: WasteByTypeItem, i: number) => (
                  <div key={`k-${i}`} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{tr(item.wasteType)}</span>
                    <span className="text-sm font-medium">{Number(item.totalQuantity).toFixed(1)} {tr("kg")} / {Number(item.totalCost).toLocaleString()} UZS</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{tr("materialType")}</CardTitle></CardHeader>
          <CardContent>
            {(!analysis?.byMaterial || analysis.byMaterial.length === 0) ? (
              <p className="text-sm text-muted-foreground">{tr("noData")}</p>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(analysis.byMaterial) ? analysis.byMaterial : []).map((item: WasteByMaterialItem, i: number) => (
                  <div key={`k-${i}`} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{item.materialType}</span>
                    <span className="text-sm font-medium">{Number(item.totalQuantity).toFixed(1)} {tr("kg")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TargetsTab() {
  const tr = useWasteTranslations();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: targets, isLoading } = useQuery<WasteTarget[]>({
    queryKey: ["/api/waste/targets"],
  });

  const form = useForm<z.infer<typeof wasteTargetFormSchema>>({
    resolver: zodResolver(wasteTargetFormSchema),
    defaultValues: {
      targetType: "monthly",
      maxWastePercentage: 5,
      maxWasteCost: 0,
      period: new Date().toISOString().substring(0, 7),
      isActive: true,
      machineId: "",
      materialType: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof wasteTargetFormSchema>) =>
      apiRequest("POST", "/api/waste/targets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waste/targets"] });
      toast({ title: "Muvaffaqiyatli saqlandi" });
      setOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-target"><Target className="h-4 w-4 mr-1" />{tr("addTarget")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{tr("addTarget")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="targetType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("targetType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-target-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="daily">{tr("daily")}</SelectItem>
                        <SelectItem value="weekly">{tr("weekly")}</SelectItem>
                        <SelectItem value="monthly">{tr("monthly")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="maxWastePercentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("maxWastePercent")}</FormLabel>
                    <FormControl><Input type="number" step="0.1" data-testid="input-max-waste-pct" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="maxWasteCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("maxWasteCostLabel")}</FormLabel>
                    <FormControl><Input type="number" data-testid="input-max-waste-cost" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="period" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("period")}</FormLabel>
                    <FormControl><Input data-testid="input-target-period" placeholder="2026-02" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="machineId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr("machineId")}</FormLabel>
                    <FormControl><Input data-testid="input-target-machine" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-target">{tr("cancel")}</Button>
                  <Button type="submit" disabled={mutation.isPending} data-testid="button-save-target">{tr("save")}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (!targets || targets.length === 0) ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{tr("noData")}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(targets) ? targets : []).map((target: WasteTarget) => (
            <Card key={target.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="secondary">{tr(target.targetType)}</Badge>
                  <span className="text-xs text-muted-foreground">{target.period}</span>
                </div>
                <p className="text-lg font-bold" data-testid={`text-target-pct-${target.id}`}>{target.maxWastePercentage}%</p>
                <p className="text-xs text-muted-foreground">{tr("maxWastePercent")}</p>
                {target.maxWasteCost && (
                  <p className="text-sm mt-1">{Number(target.maxWasteCost).toLocaleString()} UZS</p>
                )}
                {target.machineId && (
                  <p className="text-xs text-muted-foreground mt-1">{tr("machineId")}: {target.machineId}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WasteTracking() {
  const tr = useWasteTranslations();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <BarChart3 className="h-6 w-6 text-red-500" />
        <h1 className="text-xl font-bold" data-testid="text-page-title">{tr("title")}</h1>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">{tr("dashboard")}</TabsTrigger>
          <TabsTrigger value="records" data-testid="tab-records">{tr("records")}</TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">{tr("analysis")}</TabsTrigger>
          <TabsTrigger value="targets" data-testid="tab-targets">{tr("targets")}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <KPICards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WasteByTypeChart />
            <WasteTrendChart />
          </div>
          <WasteByMachineChart />
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <RecordsTable />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <AnalysisTab />
        </TabsContent>

        <TabsContent value="targets" className="mt-4">
          <TargetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
