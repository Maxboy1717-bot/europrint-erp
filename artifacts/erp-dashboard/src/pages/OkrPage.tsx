/**
 * @module OkrPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Target } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface Objective {
  id: number;
  title: string;
  description?: string;
  owner?: string;
  quarter: string;
  targetDate?: string;
  progress: number;
  status: string;
}

export default function OkrPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [targetDate, setTargetDate] = useState("");

  const { data: objectives = [], isLoading } = useQuery<Objective[]>({
    queryKey: ["/api/okr/objectives"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string; quarter: string; targetDate: string }) =>
      apiRequest("POST", "/api/okr/objectives", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/okr/objectives"] });
      toast({ title: "Maqsad muvaffaqiyatli qo'shildi" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsDialogOpen(false);
    setTitle("");
    setDescription("");
    setQuarter("Q1");
    setTargetDate("");
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Sarlavhani kiriting", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title, description, quarter, targetDate });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_track":
        return <EPStatusPill tone="success">{t("rejalashtirilgan")}</EPStatusPill>;
      case "at_risk":
        return <Badge className="bg-amber-100 text-amber-800">{t("xavfli")}</Badge>;
      case "behind":
        return <EPStatusPill tone="danger">{t("orqada")}</EPStatusPill>;
      case "completed":
        return <EPStatusPill tone="info">{t("Bajarildi")}</EPStatusPill>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const list = Array.isArray(objectives) ? objectives : [];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("okrMaqsadlarVaAsosiyNatijalar")}</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("yangiMaqsad")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">{t("Yuklanmoqda...")}</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("hechQandayMaqsadTopilmadi")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Maqsad")}</TableHead>
                  <TableHead>{t("masul")}</TableHead>
                  <TableHead>{t("chorak")}</TableHead>
                  <TableHead>{t("muddat")}</TableHead>
                  <TableHead>{t("progress5")}</TableHead>
                  <TableHead>{t("status28")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((obj) => (
                  <TableRow key={obj.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium max-w-xs">
                      <div>{obj.title}</div>
                      {obj.description && (
                        <div className="text-xs text-muted-foreground truncate">{obj.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{obj.owner || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{obj.quarter}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {obj.targetDate ? new Date(obj.targetDate).toLocaleDateString("uz-UZ") : "—"}
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={obj.progress ?? 0} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-10 text-right">{obj.progress ?? 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(obj.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiMaqsadQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("progress.title")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("maqsadSarlavhasi")} />
            </div>
            <div>
              <Label>{t("progress.description")}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("batafsilTavsif")} rows={3} />
            </div>
            <div>
              <Label>{t("chorak")}</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("endDate")}</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>{t("cancel")}</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending}>{t("Saqlash")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
