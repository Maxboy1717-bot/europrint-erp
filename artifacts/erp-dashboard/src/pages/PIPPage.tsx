import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-700", active: "bg-blue-700", completed: "bg-green-700"
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama", active: "Faol", completed: "Yakunlandi"
};
const RESULT_COLORS: Record<string, string> = { PASSED: "bg-green-700", FAILED: "bg-red-700" };

interface PipItem { id: number; first_name: string; last_name: string; duration_days: number; start_date: string; end_date: string; status: string; latest_progress: string | null; result: string | null }
interface PipProgress { progress_percent: number; created_at: string }

export default function PIPPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPip, setSelectedPip] = useState<PipItem | null>(null);
  const [form, setForm] = useState({ employee_id: "", created_by: "1", supervisor_id: "", duration_days: "30", start_date: new Date().toISOString().split("T")[0], goals: "", success_criteria: "" });
  const [progressForm, setProgressForm] = useState({ progress_percent: "0", notes: "" });

  const { data: pips, isLoading } = useQuery<PipItem[]>({
    queryKey: ["/api/hr-v2/pip"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/pip"),
  });

  const { data: pipDetail } = useQuery<{ pip?: PipItem & { goals?: string; success_criteria?: string }; progress?: PipProgress[] }>({
    queryKey: ["/api/hr-v2/pip", selectedPip?.id],
    queryFn: () => apiRequest("GET", `/api/hr-v2/pip/${selectedPip!.id}`),
    enabled: !!selectedPip?.id,
  });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/pip", data),
    onSuccess: () => {
      toast({ title: "✅ PIP yaratildi" });
      setShowCreate(false);
      setForm({ employee_id: "", created_by: "1", supervisor_id: "", duration_days: "30", start_date: new Date().toISOString().split("T")[0], goals: "", success_criteria: "" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip"] });
    },
  });

  const acknowledge = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hr-v2/pip/${id}/acknowledge`, {}),
    onSuccess: () => { toast({ title: "✅ Tasdiqlandi" }); qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip"] }); },
  });

  const addProgress = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => apiRequest("POST", `/api/hr-v2/pip/${id}/progress`, { ...data, updated_by: 1 }),
    onSuccess: () => {
      toast({ title: "✅ Progress yangilandi" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip", selectedPip?.id] });
    },
  });

  const complete = useMutation({
    mutationFn: ({ id, result }: { id: number; result: string }) => apiRequest("PATCH", `/api/hr-v2/pip/${id}/complete`, { result }),
    onSuccess: () => { toast({ title: "✅ PIP yakunlandi" }); qc.invalidateQueries({ queryKey: ["/api/hr-v2/pip"] }); },
  });

  return (
    <div className="p-6 space-y-6 bg-[#0f0f23] min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📈 PIP — Samaradorlikni Yaxshilash Rejasi</h1>
          <p className="text-slate-400 text-sm mt-1">Performance Improvement Plans — 30/60/90 kunlik rejalar</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#ff5d2e] hover:bg-[#e04d1e] text-white">
          ➕ Yangi PIP
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="bg-slate-800/50 border-[#ff5d2e] max-w-2xl">
          <CardHeader><CardTitle className="text-white">Yangi PIP yaratish</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Xodim ID *</Label>
                <Input value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  placeholder="Xodim ID" className="bg-slate-700 border-slate-600 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">Nazoratchi ID</Label>
                <Input value={form.supervisor_id} onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))}
                  placeholder="Supervisor ID" className="bg-slate-700 border-slate-600 text-white mt-1" />
              </div>
              <div>
                <Label className="text-slate-300">Davomiyligi (kun) *</Label>
                <Select value={form.duration_days} onValueChange={v => setForm(f => ({ ...f, duration_days: v }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(["30", "60", "90"]).map(d => <SelectItem key={d} value={d} className="text-white">{d} kun</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Boshlanish sanasi *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Maqsadlar *</Label>
              <Textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
                placeholder="PIP maqsadlari va kutilgan natijalar..." className="bg-slate-700 border-slate-600 text-white mt-1 min-h-24" />
            </div>
            <div>
              <Label className="text-slate-300">Muvaffaqiyat mezonlari</Label>
              <Textarea value={form.success_criteria} onChange={e => setForm(f => ({ ...f, success_criteria: e.target.value }))}
                placeholder="Qanday natijaga erishilsa muvaffaqiyatli deb hisoblanadi?" className="bg-slate-700 border-slate-600 text-white mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => create.mutate({ ...form, employee_id: parseInt(form.employee_id), duration_days: parseInt(form.duration_days) })}
                disabled={!form.employee_id || !form.goals || create.isPending}
                className="bg-[#ff5d2e] hover:bg-[#e04d1e] text-white">
                {create.isPending ? "Yaratilmoqda..." : "✅ Yaratish"}
              </Button>
              <Button onClick={() => setShowCreate(false)} variant="outline" className="border-slate-600 text-slate-300">Bekor qilish</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PIP List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-slate-400 text-sm font-medium">Barcha PIP rejalar ({pips?.length || 0})</h3>
          {isLoading && <div className="text-slate-400 text-center py-4">Yuklanmoqda...</div>}
          {pips?.map((pip) => (
            <Card key={pip.id}
              onClick={() => setSelectedPip(pip)}
              className={`cursor-pointer transition-all ${selectedPip?.id === pip.id ? 'border-[#ff5d2e] bg-slate-700/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white text-sm">{pip.first_name} {pip.last_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{pip.duration_days} kunlik reja</div>
                    <div className="text-xs text-slate-500">{pip.start_date} → {pip.end_date}</div>
                  </div>
                  <Badge className={`${STATUS_COLORS[pip.status] || 'bg-slate-700'} text-white text-xs`}>
                    {STATUS_LABELS[pip.status] || pip.status}
                  </Badge>
                </div>
                {pip.latest_progress !== null && pip.status === 'active' && (
                  <div className="mt-3">
                    <Progress value={parseInt(pip.latest_progress) || 0} className="h-1.5" />
                    <div className="text-xs text-slate-500 mt-0.5">{pip.latest_progress || 0}% progress</div>
                  </div>
                )}
                {pip.result && (
                  <Badge className={`mt-2 ${RESULT_COLORS[pip.result] || 'bg-slate-700'} text-white text-xs`}>
                    {pip.result === "PASSED" ? "✅ O'tdi" : "❌ O'tmadi"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
          {(!pips || pips.length === 0) && !isLoading && (
            <div className="text-center py-8 text-slate-400 text-sm">Hali PIP yo'q</div>
          )}
        </div>

        {/* PIP Detail */}
        {selectedPip && pipDetail && (
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{pipDetail.pip?.first_name} {pipDetail.pip?.last_name} — PIP #{pipDetail.pip?.id}</span>
                  <Badge className={`${STATUS_COLORS[pipDetail.pip?.status ?? ''] || 'bg-slate-700'} text-white`}>
                    {STATUS_LABELS[pipDetail.pip?.status ?? '']}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Davomiyligi</div>
                    <div className="text-white font-semibold">{pipDetail.pip?.duration_days} kun</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Boshlanish</div>
                    <div className="text-white font-semibold">{pipDetail.pip?.start_date}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Tugash</div>
                    <div className="text-white font-semibold">{pipDetail.pip?.end_date}</div>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">Maqsadlar</div>
                  <div className="text-slate-200 text-sm bg-slate-700/50 p-3 rounded">{pipDetail.pip?.goals}</div>
                </div>
                {pipDetail.pip?.success_criteria && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Muvaffaqiyat mezonlari</div>
                    <div className="text-slate-200 text-sm bg-slate-700/50 p-3 rounded">{pipDetail.pip.success_criteria}</div>
                  </div>
                )}
                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {pipDetail.pip?.status === 'draft' && (
                    <Button onClick={() => acknowledge.mutate(pipDetail.pip!.id)} size="sm"
                      className="bg-blue-700 hover:bg-blue-600 text-white">
                      ✅ Tasdiqlash (Xodim)
                    </Button>
                  )}
                  {pipDetail.pip?.status === 'active' && (
                    <>
                      <Button onClick={() => complete.mutate({ id: pipDetail.pip!.id, result: "PASSED" })} size="sm"
                        className="bg-green-700 hover:bg-green-600 text-white">✅ O'tdi</Button>
                      <Button onClick={() => complete.mutate({ id: pipDetail.pip!.id, result: "FAILED" })} size="sm"
                        className="bg-red-700 hover:bg-red-600 text-white">❌ O'tmadi</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress updates */}
            {pipDetail.pip?.status === 'active' && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-white text-base">Progress Yangilash</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-slate-300 text-sm">Progress (%)</Label>
                      <Input type="number" min="0" max="100" value={progressForm.progress_percent}
                        onChange={e => setProgressForm(f => ({ ...f, progress_percent: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1" />
                    </div>
                    <div className="flex-2">
                      <Label className="text-slate-300 text-sm">Izoh</Label>
                      <Input value={progressForm.notes}
                        onChange={e => setProgressForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Bu haftadagi o'zgarish..." className="bg-slate-700 border-slate-600 text-white mt-1" />
                    </div>
                    <Button onClick={() => addProgress.mutate({ id: pipDetail.pip!.id, data: { ...progressForm, progress_percent: parseInt(progressForm.progress_percent) } })}
                      className="bg-[#ff5d2e] hover:bg-[#e04d1e] text-white" size="sm">
                      Saqlash
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {pipDetail.progress?.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-700/30 p-2 rounded">
                        <div className="w-12 text-center">
                          <div className="text-white font-bold">{p.progress_percent}%</div>
                        </div>
                        <Progress value={p.progress_percent} className="flex-1 h-2" />
                        <div className="text-slate-400 text-xs">{new Date(p.created_at).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
