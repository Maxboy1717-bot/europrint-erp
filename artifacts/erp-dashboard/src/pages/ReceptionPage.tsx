/**
 * @module ReceptionPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EPStatusPill } from "@/components/ep";

export default function ReceptionPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    visitor_name: "", visitor_phone: "", visitor_company: "",
    visit_purpose: "", host_employee_id: "", registered_by: "1"
  });
  interface BadgeVisit { visitor_name: string; visitor_company: string; check_in_at: string; }
  interface BadgeResult { badge_code: string; badge_expires_at: string; visit?: BadgeVisit; }
  interface ValidateResult { valid: boolean; visitor_name?: string; host_name?: string; expires_at?: string; error?: string; }
  const [lastBadge, setLastBadge] = useState<BadgeResult | null>(null);
  const [validateCode, setValidateCode] = useState("");
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/hr-v2/reception/stats"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/reception/stats"),
    refetchInterval: 30000,
  });

  interface ActiveVisit { id: number; visitor_name: string; visitor_company: string; host_name: string; check_in_at: string; badge_code: string }
  const { data: active, isLoading } = useQuery<ActiveVisit[]>({
    queryKey: ["/api/hr-v2/reception/active"],
    queryFn: () => apiRequest("GET", "/api/hr-v2/reception/active"),
    refetchInterval: 30000,
  });

  interface VisitLogEntry { id: number; visitor_name: string; visitor_company: string; host_name: string; check_in_at: string; check_out_at: string; duration_minutes: number; badge_code: string }
  const { data: log } = useQuery<VisitLogEntry[]>({
    queryKey: ["/api/hr-v2/reception/log"],
    queryFn: () =>
      apiRequest("GET", "/api/hr-v2/reception/log")
        .then((j: unknown) => (Array.isArray(j) ? j : ((j as { data?: unknown[] }).data ?? []))),
  });

  const checkIn = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/hr-v2/reception/check-in", data),
    onSuccess: (data) => {
      toast({ title: "✅ Tashrif ro'yxatga olindi", description: `Badge kodi: ${data.badge_code}` });
      setLastBadge(data);
      setForm({ visitor_name: "", visitor_phone: "", visitor_company: "", visit_purpose: "", host_employee_id: "", registered_by: "1" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/reception/active"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/reception/stats"] });
    },
    onError: (e: Error) => toast({ title: "Xato", description: e.message, variant: "destructive" }),
  });

  const checkOut = useMutation({
    mutationFn: (visitId: number) => apiRequest("PATCH", `/api/hr-v2/reception/${visitId}/check-out`, {}),
    onSuccess: () => {
      toast({ title: "✅ Tashrif yakunlandi" });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/reception/active"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/reception/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/hr-v2/reception/log"] });
    },
  });

  const validateBadge = async () => {
    const data = await apiRequest("GET", `/api/hr-v2/reception/badge/${validateCode}`);
    setValidateResult(data);
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🏢 Reception — Tashrif Boshqaruvi</h1>
        <p className="text-muted-foreground text-sm mt-1">Tashrifchilarni ro'yxatga olish va nazorat qilish</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: "Hozir ichkari", value: stats?.currently_inside || 0, color: "text-green-400", icon: "🟢" },
          { label: "Bugun", value: stats?.today_visitors || 0, color: "text-blue-400", icon: "📅" },
          { label: "Bu hafta", value: stats?.this_week || 0, color: "text-purple-400", icon: "📊" },
          { label: "Jami", value: stats?.total_all_time || 0, color: "text-muted-foreground", icon: "📋" },
        ]).map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="checkin">
        <TabsList className="bg-muted">
          <TabsTrigger value="checkin" className="data-[state=active]:bg-card data-[state=active]:text-foreground">➕ Check-in</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-card data-[state=active]:text-foreground">🟢 Hozir ichkari</TabsTrigger>
          <TabsTrigger value="validate" className="data-[state=active]:bg-card data-[state=active]:text-foreground">🔍 Badge tekshirish</TabsTrigger>
          <TabsTrigger value="log" className="data-[state=active]:bg-card data-[state=active]:text-foreground">📋 Jurnal</TabsTrigger>
        </TabsList>

        {/* CHECK-IN FORM */}
        <TabsContent value="checkin" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-foreground">Yangi tashrif ro'yxatga olish</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {([
                  { key: "visitor_name", label: "Tashrifchi ismi *", placeholder: "To'liq ism" },
                  { key: "visitor_phone", label: "Telefon raqami", placeholder: "+998 90 123 45 67" },
                  { key: "visitor_company", label: "Kompaniya", placeholder: "Kompaniya nomi" },
                  { key: "visit_purpose", label: "Tashrif maqsadi", placeholder: "Uchrashuv, shartnoma, ..." },
                  { key: "host_employee_id", label: "Kimga keldi (xodim ID) *", placeholder: "Xodim ID raqami" },
                ]).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <Label className="text-muted-foreground text-sm">{label}</Label>
                    <Input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder} className="bg-input border-border mt-1" />
                  </div>
                ))}
                <Button onClick={() => checkIn.mutate({ ...form, host_employee_id: parseInt(form.host_employee_id), registered_by: parseInt(form.registered_by) })}
                  disabled={!form.visitor_name || !form.host_employee_id || checkIn.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white">
                  {checkIn.isPending ? "Saqlanmoqda..." : "✅ Ro'yxatga olish"}
                </Button>
              </CardContent>
            </Card>

            {/* Badge print preview */}
            {lastBadge && (
              <Card className="bg-card border-2 border-primary">
                <CardHeader><CardTitle className="text-foreground text-center">🎫 Berilgan Badge</CardTitle></CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="bg-white text-black p-6 rounded-xl mx-auto max-w-64">
                    <div className="text-blue-900 font-bold text-lg">EuroPrint</div>
                    <div className="text-3xl font-bold tracking-widest my-4 text-[var(--ep-red)]">{lastBadge.badge_code}</div>
                    <div className="font-semibold">{lastBadge.visit?.visitor_name}</div>
                    <div className="text-sm text-gray-600">{lastBadge.visit?.visitor_company}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(lastBadge.visit?.check_in_at ?? '').toLocaleTimeString()} — {new Date(lastBadge.badge_expires_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <Button onClick={() => window.print()} variant="outline" className="border-border text-muted-foreground">
                    🖨️ Chop etish
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ACTIVE VISITORS */}
        <TabsContent value="active" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground">🟢 Hozir ichkari ({active?.length || 0} kishi)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {active?.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">
                      {v.visitor_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{v.visitor_name}</div>
                      <div className="text-xs text-muted-foreground">{v.visitor_company} → {v.host_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Kirdi: {new Date(v.check_in_at).toLocaleTimeString()} |
                        Badge: <span className="font-mono text-yellow-400">{v.badge_code}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => checkOut.mutate(v.id)}
                      className="bg-muted hover:bg-[var(--ep-red)]/90 text-foreground hover:text-white text-xs">
                      Chiqish
                    </Button>
                  </div>
                ))}
                {(!active || active.length === 0) && (
                  <div className="text-center py-8 text-[13px] text-muted-foreground">Hozir hech kim yo'q</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BADGE VALIDATE */}
        <TabsContent value="validate" className="mt-4">
          <Card className="bg-card border-border max-w-md">
            <CardHeader><CardTitle className="text-foreground">🔍 Badge Tekshirish</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={validateCode} onChange={e => setValidateCode(e.target.value.toUpperCase())}
                  placeholder="Badge kodi (masalan: A1B2C3D4)" maxLength={8}
                  className="bg-input border-border font-mono text-lg text-center" />
                <Button onClick={validateBadge} className="bg-primary hover:bg-primary/90 text-white">
                  Tekshirish
                </Button>
              </div>
              {validateResult && (
                <div className={`p-4 rounded-lg ${validateResult.valid ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'}`}>
                  {validateResult.valid ? (
                    <div className="space-y-1">
                      <div className="text-green-400 font-bold text-lg">✅ Badge Haqiqiy</div>
                      <div className="text-foreground">{validateResult.visitor_name}</div>
                      <div className="text-muted-foreground text-sm">Mezboni: {validateResult.host_name}</div>
                      <div className="text-muted-foreground text-sm">Muddat: {new Date(validateResult.expires_at ?? '').toLocaleString()}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-red-400 font-bold text-lg">❌ Badge Noto'g'ri</div>
                      <div className="text-muted-foreground text-sm mt-1">{validateResult.error}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOG */}
        <TabsContent value="log" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-foreground">📋 Tashrif Jurnali</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      {(["Tashrifchi", "Kompaniya", "Mezboni", "Kirish", "Chiqish", "Muddat (daq)", "Badge"]).map(h => (
                        <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {log?.slice(0, 50).map((v) => (
                      <tr key={v.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-2 px-3 text-foreground">{v.visitor_name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{v.visitor_company || "—"}</td>
                        <td className="py-2 px-3 text-foreground">{v.host_name || "—"}</td>
                        <td className="py-2 px-3 text-foreground">{new Date(v.check_in_at).toLocaleTimeString()}</td>
                        <td className="py-2 px-3 text-foreground">{v.check_out_at ? new Date(v.check_out_at).toLocaleTimeString() : <EPStatusPill tone="success">Ichkari</EPStatusPill>}</td>
                        <td className="py-2 px-3 text-muted-foreground">{v.duration_minutes ? Math.round(v.duration_minutes) : "—"}</td>
                        <td className="py-2 px-3 font-mono text-yellow-400">{v.badge_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
