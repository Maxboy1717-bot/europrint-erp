import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Search, UserCheck, Handshake, RefreshCcw, Mail, Building2, Calendar,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AlumniRecord {
  id: string;
  fullName: string;
  lastPosition?: string;
  exitDate?: string;
  exitReason?: string;
  currentEmployer?: string;
  collaborationProject?: string;
  isReturned?: boolean;
  contactEmail?: string;
  yearsWorked?: number;
}

interface AlumniResponse {
  alumni: AlumniRecord[];
  stats: { total: number; returned: number; collaborations: number };
}

const EXIT_REASON_MAP: Record<string, string> = {
  resignation:    "O'z xohishi",
  termination:    "Xizmat yaroqsizligi",
  contract_end:   "Shartnoma tugadi",
  relocation:     "Ko'chib ketish",
  retirement:     "Pensiya",
  other:          "Boshqa",
};

function InviteDialog({
  alumni,
  open,
  onClose,
}: {
  alumni: AlumniRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const invite = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/hr/alumni/${alumni?.id}/invite`, { message }),
    onSuccess: () => {
      toast({ title: "Taklif yuborildi", description: `${alumni?.fullName} ga taklif yuborildi` });
      setMessage("");
      onClose();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            Qayta taklif qilish
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          {alumni && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="font-medium">{alumni.fullName}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{alumni.lastPosition || "—"}</p>
            </div>
          )}
          <div>
            <Label>Shaxsiy xabar (ixtiyoriy)</Label>
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Xabar qoldiring..."
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button onClick={() => invite.mutate()} disabled={invite.isPending}>
            <Mail className="h-3.5 w-3.5 mr-1" />
            {invite.isPending ? "Yuborilmoqda..." : "Taklif yuborish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HRAlumni() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [inviteTarget, setInviteTarget] = useState<AlumniRecord | null>(null);

  const { data: resp, isLoading } = useQuery<AlumniResponse>({
    queryKey: ["/api/hr/alumni"],
  });

  const alumni = resp?.alumni || [];
  const stats = resp?.stats || { total: 0, returned: 0, collaborations: 0 };

  const filtered = alumni
    .filter(a => {
      if (filterType === "returned") return a.isReturned;
      if (filterType === "collaborating") return !!a.collaborationProject;
      if (filterType === "available") return !a.isReturned && !a.collaborationProject;
      return true;
    })
    .filter(a =>
      !search ||
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (a.lastPosition || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.currentEmployer || "").toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-indigo-600" />
          <h1 className="font-semibold text-base">HR — Alumni Hamjamiyati</h1>
          <Badge variant="secondary">{stats.total} a'zo</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Jami alumni a'zolari</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <RefreshCcw className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.returned}</div>
                <div className="text-xs text-muted-foreground">Qayta ishga qaytganlar</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2.5">
                <Handshake className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.collaborations}</div>
                <div className="text-xs text-muted-foreground">Faol hamkorliklar</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Ism, lavozim yoki kompaniya..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Filtr" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="returned">Qayta qaytganlar</SelectItem>
              <SelectItem value="collaborating">Hamkorlik qilayotganlar</SelectItem>
              <SelectItem value="available">Boshqalar</SelectItem>
            </SelectContent>
          </Select>
          {filtered.length !== alumni.length && (
            <span className="text-xs text-muted-foreground">{filtered.length} ta topildi</span>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Oxirgi lavozim</TableHead>
                  <TableHead>Chiqish sanasi</TableHead>
                  <TableHead>Chiqish sababi</TableHead>
                  <TableHead>Hozirgi ish joyi</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {alumni.length === 0
                          ? "Alumni ma'lumotlari mavjud emas"
                          : "Mos alumni topilmadi"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (Array.isArray(filtered) ? filtered : []).map(a => (
                    <TableRow key={a.id} data-testid={`row-alumni-${a.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                            {a.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{a.fullName}</p>
                            {a.yearsWorked != null && (
                              <p className="text-xs text-muted-foreground">{a.yearsWorked} yil staj</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.lastPosition || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.exitDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {a.exitDate.slice(0, 7)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {EXIT_REASON_MAP[a.exitReason || ""] || a.exitReason || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.currentEmployer ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {a.currentEmployer}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {a.isReturned ? (
                          <Badge variant="default" className="text-xs flex items-center gap-1 w-fit">
                            <RefreshCcw className="h-2.5 w-2.5" />Qaytdi
                          </Badge>
                        ) : a.collaborationProject ? (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                            <Handshake className="h-2.5 w-2.5" />Hamkor
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!a.isReturned && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setInviteTarget(a)}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />Taklif
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <InviteDialog
        alumni={inviteTarget}
        open={!!inviteTarget}
        onClose={() => setInviteTarget(null)}
      />
    </div>
  );
}
