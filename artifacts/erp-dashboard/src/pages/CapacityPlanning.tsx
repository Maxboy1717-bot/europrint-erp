import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ErrorState } from "@/components/ui/error-state";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle, TrendingUp, Calendar, Clock, Search, BarChart3, CalendarClock, Zap, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const capacityFormSchema = z.object({
  workCenterId: z.string().min(1, "Work center tanlash majburiy"),
  date: z.string().min(1, "Sana kiritish majburiy"),
  availableHours: z.number().min(0.1, "Available hours 0 dan katta bo'lishi kerak"),
  efficiency: z.number().min(0).max(100, "Efficiency 0-100 orasida bo'lishi kerak"),
  utilizationTarget: z.number().min(0).max(100, "Utilization target 0-100 orasida bo'lishi kerak"),
});

const calendarFormSchema = z.object({
  workCenterId: z.string().min(1, "Work center tanlash majburiy"),
  shiftName: z.string().min(1, "Shift nomi kiritish majburiy"),
  startTime: z.string().min(1, "Boshlanish vaqti kiritish majburiy"),
  endTime: z.string().min(1, "Tugash vaqti kiritish majburiy"),
  workingDays: z.array(z.string()).default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
});

type CapacityFormValues = z.infer<typeof capacityFormSchema>;
type CalendarFormValues = z.infer<typeof calendarFormSchema>;

interface WorkCenter {
  id: string;
  code: string;
  name: string;
}

interface Capacity {
  id: string;
  workCenterId: string;
  date: string;
  availableHours: number;
  efficiency: number;
  utilizationTarget: number;
}

interface ShiftCalendar {
  id: string;
  workCenterId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
}

export default function CapacityPlanning() {
  const { t } = useTranslation('production');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [showCapacityDialog, setShowCapacityDialog] = useState(false);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const capacityForm = useForm<CapacityFormValues>({
    resolver: zodResolver(capacityFormSchema),
    defaultValues: {
      workCenterId: "",
      date: new Date().toISOString().split('T')[0],
      availableHours: 8,
      efficiency: 100,
      utilizationTarget: 85,
    },
  });

  const calendarForm = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: {
      workCenterId: "",
      shiftName: "",
      startTime: "08:00",
      endTime: "17:00",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  });

  const { data: workCenters = [], isError: workCentersError, refetch: refetchWorkCenters } = useQuery<WorkCenter[]>({
    queryKey: ['/api/erp/work-centers'],
  });

  const { data: capacityList = [] } = useQuery<Array<{ capacity: Capacity; workCenter: WorkCenter }>>({
    queryKey: ['/api/erp/work-center-capacity'],
  });

  const { data: calendars = [] } = useQuery<ShiftCalendar[]>({
    queryKey: ['/api/erp/shift-calendars'],
  });

  const { data: loadAnalysis = null, isLoading: loadAnalysisLoading } = useQuery<{
    workCenters: Array<{
      workCenterName: string;
      workCenterCode?: string;
      availableHours: number;
      loadedHours: number;
      loadPercentage: number;
      isBottleneck: boolean;
      status: string;
    }>;
  } | null>({
    queryKey: ['/api/erp/capacity/load-analysis', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: dateFrom, endDate: dateTo });
      const response = await fetch(`/api/erp/capacity/load-analysis?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch load analysis');
      return response.json();
    },
  });

  const createCapacityMutation = useMutation({
    mutationFn: async (data: CapacityFormValues) => apiRequest('POST', '/api/erp/work-center-capacity', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/work-center-capacity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/erp/capacity'] });
      setShowCapacityDialog(false);
      capacityForm.reset();
      toast({ title: t('capacityAdded') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: t('capacityError') });
    },
  });

  const createCalendarMutation = useMutation({
    mutationFn: async (data: CalendarFormValues) => apiRequest('POST', '/api/erp/shift-calendars', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/erp/shift-calendars'] });
      setShowCalendarDialog(false);
      calendarForm.reset();
      toast({ title: t('calendarCreated') });
    },
    onError: () => {
      toast({ variant: "destructive", title: tCommon('error'), description: t('calendarError') });
    },
  });

  const handleCreateCapacity = (data: CapacityFormValues) => {
    createCapacityMutation.mutate(data);
  };

  const handleCreateCalendar = (data: CalendarFormValues) => {
    createCalendarMutation.mutate(data);
  };

  const getWorkCenterName = (wcId: string) => {
    const wc = (Array.isArray(workCenters) ? workCenters : []).find((w) => w.id === wcId);
    return wc ? wc.name : wcId;
  };

  const bottlenecks = loadAnalysis?.workCenters?.filter((wc) => wc.isBottleneck) || [];
  const overloaded = loadAnalysis?.workCenters?.filter((wc) => wc.status === 'overloaded') || [];

  const chartData = loadAnalysis?.workCenters?.map((wc) => ({
    name: wc.workCenterName?.substring(0, 15) || 'Unknown',
    available: wc.availableHours,
    loaded: wc.loadedHours,
    utilization: wc.loadPercentage,
  })) || [];

  if (workCentersError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState onRetry={refetchWorkCenters} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-surface">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface">
              Quvvatlarni <span className="font-bold text-primary">Rejalashtirish</span>
            </h1>
            <p className="text-on-surface-variant">{t('capacityPlanningDesc')}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high border-none"
            onClick={() => setShowCalendarDialog(true)} 
            data-testid="button-create-calendar"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('shiftCalendar')}
          </Button>
          <Button 
            className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            onClick={() => setShowCapacityDialog(true)} 
            data-testid="button-create-capacity"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addCapacity')}
          </Button>
        </div>
      </div>

      <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-on-surface">{t('dateRange')}</CardTitle>
          <CardDescription className="text-on-surface-variant font-medium">{t('loadAnalysisDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px] flex-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 block">{t('start')}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-surface-container-low border-none"
                data-testid="input-date-from"
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2 block">{t('end')}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-surface-container-low border-none"
                data-testid="input-date-to"
              />
            </div>
            <Button
              className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/erp/capacity'] });
              }}
              data-testid="button-refresh"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('analyze')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis" className="w-full space-y-6">
        <TabsList className="bg-surface-container-low p-1 rounded-xl inline-flex">
          <TabsTrigger value="analysis" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-analysis">{t('loadAnalysisTab')}</TabsTrigger>
          <TabsTrigger value="capacity" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-capacity">{t('capacityData')}</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg px-6 py-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-calendar">{t('shiftCalendar')}</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 mt-0">
          {loadAnalysisLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !loadAnalysis || !loadAnalysis.workCenters ? (
            <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
              <CardContent className="py-12">
                <EmptyState
                  icon={BarChart3}
                  title={t('noCapacityData')}
                  description={t('noCapacityDataDesc')}
                  action={{
                    label: t('addCapacity'),
                    onClick: () => setShowCapacityDialog(true),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('totalWorkCenters')}</p>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-on-surface" data-testid="text-total-centers">
                    {loadAnalysis?.workCenters?.length || 0}
                  </div>
                </Card>

                <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('bottlenecks')}</p>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-red-600" data-testid="text-bottlenecks">
                    {bottlenecks.length || 0}
                  </div>
                </Card>

                <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{t('overloaded')}</p>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-amber-600" data-testid="text-overloaded">
                    {overloaded.length || 0}
                  </div>
                </Card>
              </div>

              <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-on-surface">{t('workCenterLoadChart')}</CardTitle>
                  <CardDescription className="text-on-surface-variant font-medium">{t('capacityLoadComparison')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--outline-variant))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--on-surface-variant))', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--on-surface-variant))', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{backgroundColor: 'hsl(var(--surface-container-lowest))', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                          itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                        />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey="available" fill="#0058cb" name={t('availableHours')} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="loaded" fill="#ef4444" name={t('loadedHours')} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface-container-lowest rounded-lg border-none shadow-none">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-on-surface">{t('criticalWorkCenters')}</CardTitle>
                  <CardDescription className="text-on-surface-variant font-medium">{t('bottlenecksHighLoad')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {bottlenecks.length === 0 ? (
                    <p className="text-center text-on-surface-variant py-8 italic">{t('noBottlenecksFound')}</p>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(bottlenecks) ? bottlenecks : []).map((wc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-surface-container transition-colors"
                          data-testid={`row-bottleneck-${idx}`}
                        >
                          <div>
                            <p className="font-bold text-on-surface">{wc.workCenterName}</p>
                            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mt-0.5">{tCommon('code')}: {wc.workCenterCode}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-bold" data-testid={`badge-load-${idx}`}>
                              {wc.loadPercentage.toFixed(1)}%
                            </Badge>
                            <Badge className="bg-surface-container text-on-surface rounded-full px-2.5 py-0.5 text-xs font-semibold">{wc.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          {capacityList.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={TrendingUp}
                  title={t('noCapacityEntries')}
                  description={t('noCapacityEntriesDesc')}
                  action={{
                    label: t('addCapacity'),
                    onClick: () => setShowCapacityDialog(true),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(Array.isArray(capacityList) ? capacityList : []).map((item) => (
                <Card key={item.capacity.id} className="hover-elevate" data-testid={`card-capacity-${item.capacity.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{item.workCenter?.name || 'Unknown'}</CardTitle>
                        <CardDescription>{item.capacity.date}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" data-testid={`badge-hours-${item.capacity.id}`}>
                          {item.capacity.availableHours}h
                        </Badge>
                        <Badge variant="outline">Efficiency: {item.capacity.efficiency}%</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {calendars.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={CalendarClock}
                  title={t('noShiftCalendar')}
                  description={t('noShiftCalendarDesc')}
                  action={{
                    label: t('createShiftCalendar'),
                    onClick: () => setShowCalendarDialog(true),
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {(Array.isArray(calendars) ? calendars : []).map((cal) => (
                <Card key={cal.id} className="hover-elevate" data-testid={`card-calendar-${cal.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{cal.shiftName}</CardTitle>
                        <CardDescription>{getWorkCenterName(cal.workCenterId)}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" data-testid={`badge-time-${cal.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {cal.startTime} - {cal.endTime}
                        </Badge>
                        <Badge variant="secondary">{cal.workingDays?.length || 0} days</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCapacityDialog} onOpenChange={setShowCapacityDialog}>
        <DialogContent data-testid="dialog-create-capacity">
          <DialogHeader>
            <DialogTitle>{t('addCapacity')}</DialogTitle>
            <DialogDescription>{t('defineCapacity')}</DialogDescription>
          </DialogHeader>
          <Form {...capacityForm}>
            <form onSubmit={capacityForm.handleSubmit(handleCreateCapacity)} className="space-y-4">
              <FormField
                control={capacityForm.control}
                name="workCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workCenter')} <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-work-center">
                          <SelectValue placeholder={tCommon('select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                          <SelectItem key={wc.id} value={wc.id}>
                            {wc.name} ({wc.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={capacityForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCommon('date')} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={capacityForm.control}
                  name="availableHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('availableHours')} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-available-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={capacityForm.control}
                  name="efficiency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('efficiency')} (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-efficiency"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={capacityForm.control}
                  name="utilizationTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('utilizationTarget')} (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-utilization-target"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCapacityDialog(false)} data-testid="button-cancel">
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={createCapacityMutation.isPending} data-testid="button-submit">
                  {createCapacityMutation.isPending ? t('saving') : tCommon('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent data-testid="dialog-create-calendar">
          <DialogHeader>
            <DialogTitle>{t('createShiftCalendar')}</DialogTitle>
            <DialogDescription>{t('defineWorkSchedule')}</DialogDescription>
          </DialogHeader>
          <Form {...calendarForm}>
            <form onSubmit={calendarForm.handleSubmit(handleCreateCalendar)} className="space-y-4">
              <FormField
                control={calendarForm.control}
                name="workCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workCenter')} <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-calendar-work-center">
                          <SelectValue placeholder={tCommon('select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Array.isArray(workCenters) ? workCenters : []).map((wc) => (
                          <SelectItem key={wc.id} value={wc.id}>
                            {wc.name} ({wc.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={calendarForm.control}
                name="shiftName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shiftName')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1st Shift, 2nd Shift..." data-testid="input-shift-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={calendarForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('startTime')} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={calendarForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('endTime')} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCalendarDialog(false)} data-testid="button-cancel-calendar">
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={createCalendarMutation.isPending} data-testid="button-submit-calendar">
                  {createCalendarMutation.isPending ? t('saving') : tCommon('save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
