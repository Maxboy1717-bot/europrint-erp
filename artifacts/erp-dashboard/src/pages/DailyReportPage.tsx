import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, Users, FileText, AlertCircle, Wrench, Gauge } from "lucide-react";

export default function DailyReportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ tasks_completed: "", metrics: "", tomorrow_plan: "" });
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [reportType, setReportType] = useState<"all" | "operator" | "office">("all");
  const [overrideId, setOverrideId] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const hour = now.getHours();
  const deadlinePassed = hour >= 20;

  const empId = user?.employeeId || 1;

  const { data: myReports, isLoading } = useQuery({
    queryKey: ["/api/hr-v2/daily-reports/employee", empId],
    queryFn: () => apiRequest("GET", `/api/hr-v2/daily-reports/employee?employeeId=${empId}&limit=14`),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/hr-v2/daily-reports/stats", today],
    queryFn: () => apiRequest("GET", `/api/hr-v2/daily-reports/stats?date=${today}`),
    refetchInterval: 60000,
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: () => apiRequest("GET", "/api/departments"),
  });

  const { data: deptReports } = useQuery({
    queryKey: ["/api/hr-v2/daily-reports/department", selectedDept, today],
    queryFn: () => apiRequest("GET", `/api/hr-v2/daily-reports/department/${selectedDept}?date=${today}`),
    enabled: !!selectedDept,
  });

  const { data: allReports, isLoading: isLoadingAllReports } = useQuery({
    queryKey: ["/api/hr-v2/daily-reports", reportType, today],
    queryFn: async () => { const r = await apiRequest("GET", `/api/hr-v2/daily-reports/by-date?date=${today}&type=${reportType}&limit=100`); return Array.isArray(r) ? r : []; },
    enabled: !selectedDept,
  });

  const todayReport = (Array.isArray(myReports) ? myReports : []).find((r) => r.report_date?.startsWith(today));

  const submit = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/daily-reports", data),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Hisobot yuborildi", description: "+5 ball qo'shildi!" });
      setForm({ tasks_completed: "", metrics: "", tomorrow_plan: "" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/employee"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/stats"] });
    },
    onError: (e: Error) => toast({ title: "Xato", description: e.message, variant: "destructive" }),
  });

  const hrOverride = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => apiRequest("PATCH", `/api/hr-v2/daily-reports/${id}/override`, data),
    onSuccess: () => {
      toast({ title: "✅ Hisobot yangilandi (HR override)" });
      setOverrideId(null);
      setOverrideReason("");
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/department"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/daily-reports/stats"] });
    },
  });

  interface DailyReportEmployee {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
    submitted_at: string;
    tasks_completed: string;
    is_machine_operator: boolean;
  }
  interface DeptItem { id: number; name: string }
  const deptList = (Array.isArray(departments) ? departments : ((departments as Record<string, unknown>)?.departments || [])) as DeptItem[];
  const submittedList = ((deptReports as Record<string, unknown>)?.submitted || []) as DailyReportEmployee[];
  const missingList = ((deptReports as Record<string, unknown>)?.missing || []) as DailyReportEmployee[];

  return (
    <div className="p-6 space-y-6 bg-[#0f0f23] min-h-screen text-white">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#ff5d2e]" /> Kunlik Hisobot
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {" · "}
          {deadlinePassed ? (
            <span className="text-red-400">Muddati o'tdi (20:00)</span>
          ) : (
            <span className="text-green-400">Soat 17:00—20:00 orasida topshiring ({20 - hour} soat qoldi)</span>
          )}
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: "Bugun topshirildi", value: stats?.stats?.submitted_count || 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-900/20" },
          { label: "Sababsiz yo'qlik", value: stats?.stats?.auto_absent_count || 0, icon: XCircle, color: "text-red-400", bg: "bg-red-900/20" },
          { label: "Kutilmoqda", value: stats?.stats?.pending_count || 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-900/20" },
          { label: "Bo'limlar qatnashgan", value: stats?.stats?.departments_with_reports || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-900/20" },
        ]).map((s) => (
          <Card key={s.label} className={`border-slate-700 ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="submit">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="submit" className="text-slate-300 data-[state=active]:bg-[#ff5d2e] data-[state=active]:text-white">
            ✏️ Hisobot yozish
          </TabsTrigger>
          <TabsTrigger value="history" className="text-slate-300 data-[state=active]:bg-[#ff5d2e] data-[state=active]:text-white">
            📜 Tarixim
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-slate-300 data-[state=active]:bg-[#ff5d2e] data-[state=active]:text-white">
            👥 HR Ko'rinish
          </TabsTrigger>
        </TabsList>

        {/* SUBMIT FORM */}
        <TabsContent value="submit" className="mt-4">
          {todayReport?.status === "submitted" ? (
            <Card className="bg-green-900/20 border-green-700/50 max-w-2xl">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-green-400">Bugungi hisobot topshirildi!</h3>
                <p className="text-slate-400 mt-2">
                  Yuborildi: {todayReport.submitted_at ? new Date(todayReport.submitted_at).toLocaleTimeString() : "—"}
                </p>
                <div className="mt-4 text-left bg-slate-800/50 p-4 rounded-lg space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Bajarilgan ishlar</div>
                    <div className="text-slate-200 mt-1 text-sm">{todayReport.tasks_completed}</div>
                  </div>
                  {todayReport.metrics && (
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Ko'rsatkichlar</div>
                      <div className="text-slate-200 mt-1 text-sm">{todayReport.metrics}</div>
                    </div>
                  )}
                  {todayReport.tomorrow_plan && (
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">Ertangi reja</div>
                      <div className="text-slate-200 mt-1 text-sm">{todayReport.tomorrow_plan}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700 max-w-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>📝 Bugungi hisobot</span>
                  {deadlinePassed ? (
                    <Badge className="bg-red-700 text-white">Muddati o'tdi</Badge>
                  ) : (
                    <Badge className="bg-green-700 text-white">{20 - hour} soat qoldi</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">
                    1. Bajarilgan ishlar * <span className="text-slate-500">(kamida 30 belgi)</span>
                  </Label>
                  <Textarea
                    value={form.tasks_completed}
                    onChange={e => setForm(f => ({ ...f, tasks_completed: e.target.value }))}
                    placeholder="Bugun qanday vazifalar bajarildi? Nima amalga oshirildi?"
                    className="bg-slate-700 border-slate-600 text-white mt-1 min-h-28"
                    maxLength={2000}
                  />
                  <div className={`text-xs mt-1 ${form.tasks_completed.length < 30 ? 'text-red-400' : 'text-green-400'}`}>
                    {form.tasks_completed.length}/2000 belgi (kamida 30 kerak)
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">2. Ko'rsatkichlar / Miqdorlar <span className="text-slate-500">(ixtiyoriy)</span></Label>
                  <Textarea
                    value={form.metrics}
                    onChange={e => setForm(f => ({ ...f, metrics: e.target.value }))}
                    placeholder="Masalan: 150 ta mahsulot tayyorlandi, 3 ta buyurtma yopildi..."
                    className="bg-slate-700 border-slate-600 text-white mt-1 min-h-16"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">3. Ertangi reja <span className="text-slate-500">(ixtiyoriy)</span></Label>
                  <Textarea
                    value={form.tomorrow_plan}
                    onChange={e => setForm(f => ({ ...f, tomorrow_plan: e.target.value }))}
                    placeholder="Ertaga nima qilmoqchisiz?"
                    className="bg-slate-700 border-slate-600 text-white mt-1 min-h-16"
                  />
                </div>
                <Button
                  onClick={() => submit.mutate({ ...form, employee_id: empId, report_date: today })}
                  disabled={form.tasks_completed.length < 30 || submit.isPending}
                  className="w-full bg-[#ff5d2e] hover:bg-[#e04d1e] text-white h-12 text-base font-semibold">
                  {submit.isPending ? "Yuborilmoqda..." : "📤 Hisobotni yuborish (+5 ball)"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-4">
          <div className="space-y-3 max-w-2xl">
            {isLoading && <div className="text-center py-8 text-slate-400">Yuklanmoqda...</div>}
            {(Array.isArray(myReports) ? myReports : []).map((r) => (
              <Card key={r.id} className={`border transition-colors ${
                r.is_auto_absent ? 'border-red-700/50 bg-red-900/10' :
                r.status === 'submitted' ? 'border-green-700/30 bg-slate-800/50' :
                'border-slate-700 bg-slate-800/50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white">
                      {new Date(r.report_date).toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "long" })}
                    </div>
                    {r.is_auto_absent ? (
                      <Badge className="bg-red-700 text-white text-xs">❌ Sababsiz yo'qlik</Badge>
                    ) : r.status === 'submitted' ? (
                      <Badge className="bg-green-700 text-white text-xs">✅ Topshirildi</Badge>
                    ) : (
                      <Badge className="bg-yellow-700 text-white text-xs">⏳ Kutilmoqda</Badge>
                    )}
                  </div>
                  {r.tasks_completed && (
                    <p className="text-slate-400 text-sm line-clamp-2">{r.tasks_completed}</p>
                  )}
                  {r.submitted_at && (
                    <div className="text-xs text-slate-500 mt-1">
                      Yuborildi: {new Date(r.submitted_at).toLocaleTimeString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!myReports || (Array.isArray(myReports) && myReports.length === 0)) && !isLoading && (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Hali hisobot yo'q. Birinchi hisobotingizni yuboring!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ADMIN VIEW */}
        <TabsContent value="admin" className="mt-4">
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedDept} onValueChange={v => setSelectedDept(v === "all" ? "" : v)}>
                <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white" data-testid="select-dept-filter">
                  <SelectValue placeholder="Bo'limni tanlang..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Barcha bo'limlar</SelectItem>
                  {(Array.isArray(deptList) ? deptList : []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)} className="text-white">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator / Office / All filter — only when no dept selected */}
              {!selectedDept && <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1" data-testid="filter-report-type">
                {(["all", "operator", "office"] as const).map(tp => (
                  <button
                    key={tp}
                    onClick={() => setReportType(tp)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                      reportType === tp
                        ? tp === "operator"
                          ? "bg-blue-600 text-white"
                          : tp === "office"
                          ? "bg-purple-600 text-white"
                          : "bg-[#ff5d2e] text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                    data-testid={`filter-${tp}`}
                  >
                    {tp === "operator" && <Wrench className="w-3 h-3" />}
                    {tp === "all" ? "Barchasi" : tp === "operator" ? "Operator hisobotlari" : "Ofis hisobotlari"}
                  </button>
                ))}
              </div>}
              <div className="text-sm text-slate-400">Bugun: {today}</div>
            </div>

            {selectedDept && deptReports && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Submitted */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2 text-base">
                      <CheckCircle className="w-4 h-4" /> Topshirilgan ({submittedList.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {(Array.isArray(submittedList) ? submittedList : []).map((r) => (
                      <div key={r.id} className="p-3 bg-green-900/10 border border-green-800/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white text-sm">{r.first_name} {r.last_name}</div>
                            <div className="text-xs text-slate-400">{r.employee_code}</div>
                          </div>
                          <div className="text-right">
                            {r.submitted_at && (
                              <div className="text-xs text-slate-400">{new Date(r.submitted_at).toLocaleTimeString()}</div>
                            )}
                            <Badge className="bg-green-800 text-white text-xs mt-1">✅ Topshirildi</Badge>
                          </div>
                        </div>
                        {r.tasks_completed && (
                          <p className="text-slate-400 text-xs mt-2 line-clamp-2">{r.tasks_completed}</p>
                        )}
                        {/* HR Override */}
                        {overrideId === r.id ? (
                          <div className="mt-3 space-y-2">
                            <Input
                              value={overrideReason}
                              onChange={e => setOverrideReason(e.target.value)}
                              placeholder="Sabab (majburiy)..."
                              className="bg-slate-700 border-slate-600 text-white text-xs h-7"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-6 text-xs bg-red-700 hover:bg-red-800"
                                disabled={!overrideReason || hrOverride.isPending}
                                onClick={() => hrOverride.mutate({ id: r.id, is_auto_absent: true, status: "absent", hr_user_id: 1, reason: overrideReason })}>
                                Yo'qlik deb belgilash
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 text-xs text-slate-400"
                                onClick={() => { setOverrideId(null); setOverrideReason(""); }}>
                                Bekor
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="mt-2 h-6 text-xs text-slate-500 hover:text-slate-300 p-0"
                            onClick={() => setOverrideId(r.id)}>
                            <AlertCircle className="w-3 h-3 mr-1" /> HR override
                          </Button>
                        )}
                      </div>
                    ))}
                    {submittedList.length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-sm">Hali hech kim topshirmagan</div>
                    )}
                  </CardContent>
                </Card>

                {/* Missing */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                      <XCircle className="w-4 h-4" /> Topshirmagan ({missingList.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {(Array.isArray(missingList) ? missingList : []).map((e) => (
                      <div key={e.id} className="p-3 bg-red-900/10 border border-red-800/30 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-sm">{e.first_name} {e.last_name}</div>
                          <div className="text-xs text-slate-400">{e.employee_code}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.is_machine_operator && (
                            <Badge className="bg-blue-800 text-white text-xs">Operator</Badge>
                          )}
                          <Badge className="bg-red-800/60 text-red-300 text-xs">Topshirmagan</Badge>
                        </div>
                      </div>
                    ))}
                    {missingList.length === 0 && (
                      <div className="text-center py-6 text-green-400 text-sm">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                        Barcha xodimlar hisobot topshirdi!
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* All reports filtered by type when no dept selected */}
            {!selectedDept && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300">
                    {reportType === "operator" ? (
                      <span className="flex items-center gap-1.5"><Wrench className="w-4 h-4 text-blue-400" /> Operator hisobotlari (bugun)</span>
                    ) : reportType === "office" ? (
                      <span>Ofis xodimlari hisobotlari (bugun)</span>
                    ) : (
                      <span>Barcha hisobotlar (bugun)</span>
                    )}
                  </h3>
                  {Array.isArray(allReports) && (
                    <span className="text-xs text-slate-400">{allReports.length} ta hisobot</span>
                  )}
                </div>

                {isLoadingAllReports && (
                  <div className="text-center py-8 text-slate-400">Yuklanmoqda...</div>
                )}

                {!isLoadingAllReports && Array.isArray(allReports) && allReports.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {reportType === "operator" ? "Bugun operator hisobotlari yo'q" :
                       reportType === "office" ? "Bugun ofis hisobotlari yo'q" :
                       "Bugun hech qanday hisobot topshirilmagan"}
                    </p>
                  </div>
                )}

                {!isLoadingAllReports && Array.isArray(allReports) && allReports.length > 0 && (
                  <div className="space-y-2">
                    {(Array.isArray(allReports) ? allReports : []).map((r) => {
                      const isOp = r.is_machine_operator_report || r.is_machine_operator;
                      let prodData: Record<string, any> = {};
                      if (isOp && r.tasks_completed) {
                        try { prodData = JSON.parse(r.tasks_completed); } catch { /* not JSON */ }
                      }
                      return (
                        <div key={r.id} className={`p-3 rounded-lg border ${
                          isOp ? "border-blue-800/40 bg-blue-900/10" :
                          r.is_auto_absent ? "border-red-800/40 bg-red-900/10" :
                          "border-slate-700 bg-slate-800/50"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {isOp && <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              <span className="font-medium text-white text-sm truncate">
                                {r.first_name} {r.last_name}
                              </span>
                              <span className="text-xs text-slate-500">{r.employee_code}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isOp && prodData.oee !== undefined && (
                                <span className="text-xs flex items-center gap-0.5 text-blue-300">
                                  <Gauge className="w-3 h-3" />
                                  {Number(prodData.oee).toFixed(1)}%
                                </span>
                              )}
                              {r.is_auto_absent ? (
                                <Badge className="bg-red-700 text-white text-xs">❌ Yo'qlik</Badge>
                              ) : r.status === "submitted" ? (
                                <Badge className="bg-green-700 text-white text-xs">✅ Topshirildi</Badge>
                              ) : (
                                <Badge className="bg-yellow-700 text-white text-xs">⏳ Kutilmoqda</Badge>
                              )}
                            </div>
                          </div>
                          {!isOp && r.tasks_completed && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{r.tasks_completed}</p>
                          )}
                          {isOp && prodData.produced !== undefined && (
                            <p className="text-xs text-blue-300/70 mt-1">
                              Ishlab chiqarildi: {Number(prodData.produced || prodData.today_produced || 0).toLocaleString()} dona
                              {prodData.defects !== undefined && ` · Nuqson: ${prodData.defects}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
