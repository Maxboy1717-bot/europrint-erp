/**
 * @module JobDescriptionsPage
 * @description HR lavozim tavsiflar (job descriptions). Route: /hr/job-descriptions
 * GET/POST /api/hr/onboarding/job-descriptions
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Briefcase, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

interface JobDescription {
  id: number;
  position_id?: number | null;
  title: string;
  title_ru?: string | null;
  department?: string | null;
  reports_to?: string | null;
  position_purpose?: string | null;
  is_active?: boolean | null;
  is_current_version?: boolean | null;
  version?: number | null;
  created_at?: string | null;
}

export default function JobDescriptionsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [positionId, setPositionId] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [positionPurpose, setPositionPurpose] = useState("");

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["/api/hr/onboarding/job-descriptions"],
  });
  const items: JobDescription[] = (() => {
    const d = rawData as Record<string, unknown> | null;
    if (!d) return [];
    if (Array.isArray(d)) return d as JobDescription[];
    if (Array.isArray((d as { items?: unknown[] }).items)) return (d as { items: JobDescription[] }).items;
    if (Array.isArray((d as { data?: unknown[] }).data)) return (d as { data: JobDescription[] }).data;
    return [];
  })();

  const createMutation = useMutation({
    mutationFn: (payload: object) =>
      apiRequest("POST", "/api/hr/onboarding/job-descriptions", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding/job-descriptions"] });
      setIsOpen(false);
      setPositionId(""); setTitle(""); setDepartment(""); setReportsTo(""); setPositionPurpose("");
      toast({ title: t("lavozimTavsifQoshildi", "Lavozim tavsifi qo'shildi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  function handleCreate() {
    if (!title.trim() || !positionPurpose.trim()) {
      toast({ title: t("majburiyMaydonlar", "Majburiy maydonlarni to'ldiring"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      positionId: positionId ? Number(positionId) : 1,
      title: title.trim(),
      department: department.trim() || undefined,
      reportsTo: reportsTo.trim() || undefined,
      positionPurpose: positionPurpose.trim(),
      keyResponsibilities: [],
      kpiMetrics: [],
    });
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-[var(--ep-blue)]" />
          <h1 className="font-semibold text-base">{t("lavozimTavsiflar", "Lavozim Tavsiflar")}</h1>
          {!isLoading && (
            <Badge variant="outline" className="text-xs">{items.length}</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)} data-testid="button-create-job-description">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t("tavsifQoshish", "Tavsif qo'shish")}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("tavsifYoq", "Tavsiflar topilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("id", "ID")}</TableHead>
                    <TableHead>{t("lavozimNomi", "Lavozim")}</TableHead>
                    <TableHead>{t("boim", "Bo'lim")}</TableHead>
                    <TableHead>{t("hisobotBeriladi", "Hisobot beriladi")}</TableHead>
                    <TableHead>{t("status28", "Faol")}</TableHead>
                    <TableHead>{t("sana", "Sana")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} data-testid={`row-job-desc-${item.id}`}>
                      <TableCell className="font-mono text-sm text-muted-foreground">{item.id}</TableCell>
                      <TableCell className="font-medium text-sm">{item.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.department ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.reports_to ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "outline"} className="text-xs">
                          {item.is_active ? t("faol", "faol") : t("nofaol", "nofaol")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("yangiLavozimTavsif", "Yangi lavozim tavsifi")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("lavozimId", "Lavozim ID")} *</Label>
                <Input
                  type="number"
                  min="1"
                  value={positionId}
                  onChange={e => setPositionId(e.target.value)}
                  placeholder="1"
                  data-testid="input-position-id"
                />
              </div>
              <div>
                <Label>{t("boim", "Bo'lim")}</Label>
                <Input
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder={t("boimNomi", "Masalan: Marketing")}
                  data-testid="input-department"
                />
              </div>
            </div>
            <div>
              <Label>{t("lavozimNomi", "Lavozim sarlavhasi")} *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t("lavozimTavsifPlaceholder", "Masalan: Marketing menejeri")}
                data-testid="input-job-title"
              />
            </div>
            <div>
              <Label>{t("hisobotBeriladi", "Hisobot beriladi (kimga)")}</Label>
              <Input
                value={reportsTo}
                onChange={e => setReportsTo(e.target.value)}
                placeholder={t("hisobotPlaceholder", "Masalan: Marketing direktori")}
                data-testid="input-reports-to"
              />
            </div>
            <div>
              <Label>{t("lavozimMaqsadi", "Lavozim maqsadi")} *</Label>
              <Textarea
                value={positionPurpose}
                onChange={e => setPositionPurpose(e.target.value)}
                placeholder={t("lavozimMaqsadiPlaceholder", "Bu lavozim kompaniyaga nima beradi...")}
                rows={3}
                data-testid="input-position-purpose"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>{t("cancel")}</Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !title.trim() || !positionPurpose.trim()}
                data-testid="button-save-job-description"
              >
                {t("Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
