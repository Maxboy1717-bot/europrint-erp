import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Gift, TrendingUp, CheckCircle, Clock, XCircle, RefreshCcw } from "lucide-react";

const CURRENT_USER_ID = 1;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Kutilmoqda", color: "bg-blue-100 text-blue-700" },
  interview: { label: "Intervyuda", color: "bg-amber-100 text-amber-700" },
  hired: { label: "Qabul qilindi", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rad etildi", color: "bg-red-100 text-red-700" },
};

export default function ReferralPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  interface Referral { id: number; status: string; candidate_full_name: string; candidate_phone: string; position_title: string; bonus_paid: boolean; bonus_type: string; bonus_amount: string | number; created_at: string; referrer_name: string; referrer_id: number; hr_notes: string }
  const [editTarget, setEditTarget] = useState<Referral | null>(null);
  const [form, setForm] = useState({ candidate_full_name: "", candidate_phone: "", position_title: "" });
  const [editForm, setEditForm] = useState({ status: "", bonus_type: "", bonus_amount: "", bonus_paid: false, hr_notes: "" });

  const { data: resp, isLoading } = useQuery<{ referrals?: Referral[]; stats?: Record<string, unknown> }>({
    queryKey: ["/api/hr/referrals"],
    queryFn: () => apiRequest("GET", "/api/hr/referrals"),
  });

  const { data: boomerang } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/hr/referrals/boomerang"],
    queryFn: () => apiRequest("GET", "/api/hr/referrals/boomerang"),
  });

  const referrals: Referral[] = resp?.referrals || [];
  const stats = resp?.stats || {};

  const myReferrals = (Array.isArray(referrals) ? referrals : []).filter((r) => r.referrer_id === CURRENT_USER_ID);

  const createMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/hr/referrals", body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Tavsiya yuborildi!" });
      qc.invalidateQueries({ queryKey: ["/api/hr/referrals"] });
      setAddOpen(false);
      setForm({ candidate_full_name: "", candidate_phone: "", position_title: "" });
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) => apiRequest("PATCH", `/api/hr/referrals/${id}`, body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) { toast({ title: "Xato", description: String(data.error), variant: "destructive" }); return; }
      toast({ title: "✅ Yangilandi!" });
      qc.invalidateQueries({ queryKey: ["/api/hr/referrals"] });
      setEditTarget(null);
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-green-600" />
          <h1 className="font-semibold text-base">Referral Tizimi</h1>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />Do'st tavsiya qilish
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: "Jami tavsiyalar", value: (stats.total as number) || 0, icon: Users, color: "text-blue-600" },
            { label: "Qabul qilingan", value: (stats.hired as number) || 0, icon: CheckCircle, color: "text-green-600" },
            { label: "Kutilmoqda", value: (stats.pending as number) || 0, icon: Clock, color: "text-amber-600" },
            { label: "Bonus to'langan", value: (stats.bonus_paid_count as number) || 0, icon: Gift, color: "text-purple-600" },
          ]).map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="my">
          <TabsList>
            <TabsTrigger value="my">Mening tavsiyalarim</TabsTrigger>
            <TabsTrigger value="all">Barcha tavsiyalar (HR)</TabsTrigger>
            <TabsTrigger value="boomerang">🔄 Boomerang Hire</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Yuklanmoqda...</div>
                ) : myReferrals.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Hali tavsiya yo'q</p>
                    <Button size="sm" className="mt-3" onClick={() => setAddOpen(true)}>
                      Do'stingizni tavsiya qiling
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nomzod</TableHead>
                        <TableHead>Lavozim</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead>Bonus</TableHead>
                        <TableHead>Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(myReferrals) ? myReferrals : []).map((r) => {
                        const st = STATUS_MAP[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };
                        return (
                          <TableRow key={r.id}>
                            <TableCell>
                              <p className="font-medium text-sm">{r.candidate_full_name}</p>
                              <p className="text-xs text-muted-foreground">{r.candidate_phone}</p>
                            </TableCell>
                            <TableCell className="text-sm">{r.position_title}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {r.bonus_paid ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  {r.bonus_type === "money" ? `${r.bonus_amount} so'm` : `${r.bonus_amount} kun ta'til`}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString("uz-UZ") : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomzod</TableHead>
                      <TableHead>Tavsiyachi</TableHead>
                      <TableHead>Lavozim</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead className="text-right">Amal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow>
                    ) : referrals.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Tavsiyalar yo'q</TableCell></TableRow>
                    ) : (Array.isArray(referrals) ? referrals : []).map((r) => {
                      const st = STATUS_MAP[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{r.candidate_full_name}</p>
                            <p className="text-xs text-muted-foreground">{r.candidate_phone}</p>
                          </TableCell>
                          <TableCell className="text-sm">{r.referrer_name || `#${r.referrer_id}`}</TableCell>
                          <TableCell className="text-sm">{r.position_title}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.bonus_paid ? (
                              <Badge variant="default" className="text-xs">To'langan</Badge>
                            ) : r.status === "hired" ? (
                              <Badge variant="outline" className="text-xs text-orange-600">Kutilmoqda</Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setEditTarget(r);
                                setEditForm({
                                  status: r.status,
                                  bonus_type: r.bonus_type || "",
                                  bonus_amount: String(r.bonus_amount ?? ""),
                                  bonus_paid: r.bonus_paid,
                                  hr_notes: r.hr_notes || "",
                                });
                              }}
                            >
                              Tahrirlash
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boomerang" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-indigo-600" />
                  Boomerang Hire — Sobiq xodimlar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Bo'lim</TableHead>
                      <TableHead>Lavozim</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((boomerang?.alumni as unknown[] | undefined) || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Sobiq xodimlar bazasi bo'sh
                        </TableCell>
                      </TableRow>
                    ) : ((boomerang?.alumni as unknown[] | undefined) || []).map((a: { id: number; full_name: string; department_name?: string; position_name?: string; last_day?: string; rehire_eligible?: boolean; status?: string }) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">{a.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.department_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.position_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {a.status === "fired" ? "Ishdan bo'shatilgan" : a.status === "resigned" ? "Ketgan" : a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add referral dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Do'st / tanish tavsiya qilish</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>To'liq ismi</Label>
              <Input value={form.candidate_full_name} onChange={e => setForm(f => ({ ...f, candidate_full_name: e.target.value }))} placeholder="Ism Familiya Otasining ismi" className="mt-1" />
            </div>
            <div>
              <Label>Telefon raqami</Label>
              <Input value={form.candidate_phone} onChange={e => setForm(f => ({ ...f, candidate_phone: e.target.value }))} placeholder="+998 90 000 00 00" className="mt-1" />
            </div>
            <div>
              <Label>Qaysi lavozimga?</Label>
              <Input value={form.position_title} onChange={e => setForm(f => ({ ...f, position_title: e.target.value }))} placeholder="Lavozim nomi" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
            <Button
              onClick={() => createMut.mutate({ ...form, referrer_id: CURRENT_USER_ID })}
              disabled={!form.candidate_full_name || !form.candidate_phone || !form.position_title || createMut.isPending}
            >
              {createMut.isPending ? "Yuborilmoqda..." : "Tavsiya qilish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit referral dialog (HR) */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Referral holati yangilash (HR)</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Holat</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Kutilmoqda</SelectItem>
                    <SelectItem value="interview">Intervyuda</SelectItem>
                    <SelectItem value="hired">Qabul qilindi</SelectItem>
                    <SelectItem value="rejected">Rad etildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.status === "hired" && (
                <>
                  <div>
                    <Label>Bonus turi</Label>
                    <Select value={editForm.bonus_type} onValueChange={v => setEditForm(f => ({ ...f, bonus_type: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Bonus tanlang..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="money">Pul bonusi</SelectItem>
                        <SelectItem value="vacation">Ta'til kunlari</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{editForm.bonus_type === "vacation" ? "Necha kun ta'til?" : "Bonus miqdori (so'm)"}</Label>
                    <Input type="number" value={editForm.bonus_amount} onChange={e => setEditForm(f => ({ ...f, bonus_amount: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="bp" checked={editForm.bonus_paid} onChange={e => setEditForm(f => ({ ...f, bonus_paid: e.target.checked }))} />
                    <Label htmlFor="bp">Bonus to'landi</Label>
                  </div>
                </>
              )}
              <div>
                <Label>HR izohi</Label>
                <Textarea value={editForm.hr_notes} onChange={e => setEditForm(f => ({ ...f, hr_notes: e.target.value }))} rows={2} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Bekor</Button>
            <Button
              onClick={() => updateMut.mutate({ id: editTarget!.id, body: editForm })}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
