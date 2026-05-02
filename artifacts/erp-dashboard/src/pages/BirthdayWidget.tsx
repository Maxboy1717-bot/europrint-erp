import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Cake, Gift, Bell, Settings, PartyPopper } from "lucide-react";

const CURRENT_USER_ID = 1;
const TODAY = new Date();

interface BirthdayEmployee { id: number; full_name: string; department_name?: string; age?: number; birth_date?: string; next_birthday?: string; }

function BirthdayBanner({ employees }: { employees: BirthdayEmployee[] }) {
  if (employees.length === 0) return null;
  return (
    <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 text-white">
      <div className="flex items-center gap-3">
        <PartyPopper className="h-6 w-6" />
        <div>
          <p className="font-bold">🎂 Bugun tug'ilgan kun!</p>
          <p className="text-sm opacity-90">
            {(Array.isArray(employees) ? employees : []).map((e) => e.full_name).join(", ")} — tabriklaymiz!
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BirthdayWidget() {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ notify_colleagues: true, notify_self_evening: true });

  const { data: todayBirthdays = [], isLoading: loadingToday } = useQuery<BirthdayEmployee[]>({
    queryKey: ["/api/hr/birthdays/today"],
    queryFn: () => apiRequest("GET", "/api/hr/birthdays/today"),
  });

  const { data: upcomingBirthdays = [], isLoading: loadingUpcoming } = useQuery<BirthdayEmployee[]>({
    queryKey: ["/api/hr/birthdays/upcoming"],
    queryFn: () => apiRequest("GET", "/api/hr/birthdays/upcoming?days=7"),
  });

  const { data: mySettings } = useQuery<{ notify_colleagues?: boolean; notify_self_evening?: boolean }>({
    queryKey: ["/api/hr/birthdays/settings", CURRENT_USER_ID],
    queryFn: () => apiRequest("GET", `/api/hr/birthdays/settings/${CURRENT_USER_ID}`),
  });

  const saveMut = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/hr/birthdays/settings/${CURRENT_USER_ID}`, settings),
    onSuccess: () => {
      toast({ title: "✅ Sozlamalar saqlandi!" });
      setSettingsOpen(false);
    },
    onError: () => toast({ title: "Xato", variant: "destructive" }),
  });

  const isSelfBirthday = (Array.isArray(todayBirthdays) ? todayBirthdays : []).some((e) => e.id === CURRENT_USER_ID);
  const hour = TODAY.getHours();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cake className="h-5 w-5 text-pink-500" />
          <h1 className="font-semibold text-base">Tug'ilgan Kunlar</h1>
          {todayBirthdays.length > 0 && (
            <Badge className="bg-pink-100 text-pink-700 border-0">Bugun: {todayBirthdays.length} ta</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-3.5 w-3.5 mr-1" />Sozlamalar
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Self birthday banner (shown after 18:00) */}
        {isSelfBirthday && hour >= 18 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-5 text-white text-center">
            <div className="text-4xl mb-2">🎂</div>
            <h2 className="text-xl font-bold mb-1">Tug'ilgan kuningiz bilan!</h2>
            <p className="opacity-90 text-sm">EuroPrint jamoasi siz bilan faxrlanadi. Baxt, sog'lik va muvaffaqiyat tilaymiz!</p>
          </div>
        )}

        {/* Today's birthdays */}
        <BirthdayBanner employees={todayBirthdays} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="h-4 w-4 text-pink-500" />
              Bugun tug'ilgan kunlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingToday ? (
              <div className="text-center py-4 text-muted-foreground">Yuklanmoqda...</div>
            ) : todayBirthdays.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Cake className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Bugun tug'ilgan kun yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(todayBirthdays) ? todayBirthdays : []).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between bg-pink-50 rounded-lg px-4 py-3 border border-pink-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {emp.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {emp.department_name} · {emp.age ? `${emp.age} yosh` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl">🎂</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-500" />
              Keyingi 7 kundagi tug'ilgan kunlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUpcoming ? (
              <div className="text-center py-4 text-muted-foreground">Yuklanmoqda...</div>
            ) : upcomingBirthdays.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keyingi 7 kunda tug'ilgan kun yo'q</p>
              </div>
            ) : (
              <div className="divide-y">
                {(Array.isArray(upcomingBirthdays) ? upcomingBirthdays : []).map((emp) => {
                  const bd = new Date(emp.birth_date ?? '');
                  const nextBd = emp.next_birthday ? new Date(emp.next_birthday) : null;
                  const days = nextBd ? Math.ceil((nextBd.getTime() - TODAY.setHours(0,0,0,0)) / 86400000) : null;
                  return (
                    <div key={emp.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                          {emp.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.department_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={days === 1 ? "default" : "secondary"} className="text-xs">
                          {days === 0 ? "Bugun!" : days === 1 ? "Ertaga" : `${days} kundan so'ng`}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {bd.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Bildirishnoma tartibi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="shrink-0 font-medium text-foreground">7:30</span>
              <span>Barcha hamkasblar yangi tug'ilgan kunlardan xabardor bo'ladi (Telegram)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 font-medium text-foreground">18:00</span>
              <span>Tug'ilgan kun egasi ERP da tabrik banner ko'radi</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 font-medium text-foreground">18:00</span>
              <span>Xodimning o'ziga shaxsiy tabrik xabari yuboriladi (Telegram)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tug'ilgan kun bildirishnoma sozlamalari</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="nc"
                checked={settings.notify_colleagues}
                onChange={e => setSettings(s => ({ ...s, notify_colleagues: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="nc" className="cursor-pointer">
                Hamkasblarimga mening tug'ilgan kunim haqida xabar yuborilsin
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="nse"
                checked={settings.notify_self_evening}
                onChange={e => setSettings(s => ({ ...s, notify_self_evening: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="nse" className="cursor-pointer">
                Kechqurun menga tabrik xabari yuborilsin
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Bekor</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
