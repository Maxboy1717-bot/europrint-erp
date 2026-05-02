import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Star, Users, TrendingUp, BarChart3, CheckCircle2 } from "lucide-react";

const CURRENT_USER_ID = 1;

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {([1, 2, 3, 4, 5]).map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${(hover || value) >= s ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
          />
        </button>
      ))}
    </div>
  );
}

interface ReviewableEmployee { id: number; full_name: string; department_name?: string; position_name?: string; is_reviewed?: boolean; alreadyReviewed?: boolean; }
interface DeptSummary { department_name: string; review_count: number; avg_rating: string; }

export default function PeerReviewPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<ReviewableEmployee | null>(null);
  const [rating, setRating] = useState(0);
  const [reason, setReasonText] = useState("");

  const { data: reviewable = [], isLoading } = useQuery<ReviewableEmployee[]>({
    queryKey: ["/api/hr/360/reviewable", CURRENT_USER_ID],
    queryFn: () => apiRequest("GET", `/api/hr/360/reviewable?reviewer_id=${CURRENT_USER_ID}`),
  });

  const { data: deptSummary = [] } = useQuery<DeptSummary[]>({
    queryKey: ["/api/hr/360/dept-summary"],
    queryFn: () => apiRequest("GET", "/api/hr/360/dept-summary"),
  });

  const submitMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiRequest("POST", "/api/hr/360/review", body),
    onSuccess: (data: Record<string, unknown>) => {
      if (data?.error) {
        toast({ title: "Xato", description: String(data.error), variant: "destructive" });
        return;
      }
      toast({ title: "✅ Baholash yuborildi!", description: `${selected?.full_name} baholandi` });
      qc.invalidateQueries({ queryKey: ["/api/hr/360/reviewable"] });
      qc.invalidateQueries({ queryKey: ["/api/hr/360/dept-summary"] });
      setSelected(null);
      setRating(0);
      setReasonText("");
    },
    onError: (err: Error) => toast({ title: "Xato", description: err?.message || "Yuborishda xato", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!selected) return;
    if (rating === 0) {
      toast({ title: "Xato", description: "Yulduz baho bering", variant: "destructive" });
      return;
    }
    if (reason.length < 30) {
      toast({ title: "Xato", description: `Sabab kamida 30 belgi bo'lishi kerak (hozir: ${reason.length})`, variant: "destructive" });
      return;
    }
    submitMut.mutate({ reviewer_id: CURRENT_USER_ID, reviewee_id: selected.id, rating, reason });
  };

  const reviewed = (Array.isArray(reviewable) ? reviewable : []).filter(e => e.alreadyReviewed);
  const pending = (Array.isArray(reviewable) ? reviewable : []).filter(e => !e.alreadyReviewed);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center gap-3">
        <Star className="h-5 w-5 text-yellow-500" />
        <h1 className="font-semibold text-base">360° Kunlik Baholash</h1>
        <Badge variant="secondary">{pending.length} kutilmoqda</Badge>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <Tabs defaultValue="review">
          <TabsList>
            <TabsTrigger value="review">⭐ Baholash</TabsTrigger>
            <TabsTrigger value="stats">📊 Bo'lim statistikasi</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold text-blue-600">{reviewable.length}</div>
                  <div className="text-xs text-muted-foreground">Jami xodimlar</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold text-green-600">{reviewed.length}</div>
                  <div className="text-xs text-muted-foreground">Baholangan (bugun)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold text-orange-600">{pending.length}</div>
                  <div className="text-xs text-muted-foreground">Baholanmagan</div>
                </CardContent>
              </Card>
            </div>

            {selected && (
              <Card className="border-primary/40 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {selected.full_name} ni baholash
                    <Badge variant="outline" className="ml-auto">{selected.department_name || "—"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Baho (1-5 yulduz)</p>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Sabab (kamida 30 belgi)
                      <span className={`ml-2 text-xs ${reason.length >= 30 ? "text-green-600" : "text-orange-500"}`}>
                        {reason.length}/30
                      </span>
                    </p>
                    <Textarea
                      value={reason}
                      onChange={e => setReasonText(e.target.value)}
                      placeholder="Bu xodim nima uchun bunday bahoga arziydi? Aniq misol keltiring..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitMut.isPending || rating === 0 || reason.length < 30}
                      className="flex-1"
                    >
                      {submitMut.isPending ? "Yuborilmoqda..." : "✅ Baholashni yuborish"}
                    </Button>
                    <Button variant="outline" onClick={() => { setSelected(null); setRating(0); setReasonText(""); }}>
                      Bekor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Xodimlar ro'yxati</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Yuklanmoqda...</div>
                ) : (
                  <div className="divide-y">
                    {(Array.isArray(pending) ? pending : []).map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {emp.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.department_name || "—"} · {emp.position_name || "—"}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={selected?.id === emp.id ? "default" : "outline"}
                          onClick={() => setSelected(emp)}
                        >
                          <Star className="h-3.5 w-3.5 mr-1" />Baholash
                        </Button>
                      </div>
                    ))}
                    {(Array.isArray(reviewed) ? reviewed : []).map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between px-4 py-3 opacity-50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">
                            {emp.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground">{emp.department_name || "—"}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Baholangan
                        </Badge>
                      </div>
                    ))}
                    {reviewable.length === 0 && (
                      <div className="py-10 text-center text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Xodimlar mavjud emas</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Bo'lim bo'yicha o'rtacha baho (so'nggi 30 kun)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deptSummary.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Hali baholash ma'lumotlari yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(deptSummary) ? deptSummary : []).map((dept) => (
                      <div key={dept.department_name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{dept.department_name || "Noma'lum bo'lim"}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-xs">{dept.review_count} ta baho</span>
                            <span className="font-bold text-yellow-600">{parseFloat(dept.avg_rating).toFixed(1)} ⭐</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                            style={{ width: `${(parseFloat(dept.avg_rating) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
