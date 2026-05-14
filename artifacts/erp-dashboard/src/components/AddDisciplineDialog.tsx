/**
 * @module AddDisciplineDialog
 * @description React UI component.
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
;

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface AddDisciplineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function AddDisciplineDialog({ open, onOpenChange, userId }: AddDisciplineDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    userId: userId || "",
    type: "warning" as "warning" | "penalty" | "reward",
    amount: 0,
    reason: "",
    reasonRu: "",
    givenBy: "", // HR/Admin ID
  });

  useEffect(() => {
    if (userId) {
      setFormData(prev => ({ ...prev, userId }));
    }
  }, [userId]);

  const { data: employeesData } = useQuery<{ data: { id: string; fullName: string; employeeId: string; role: string }[] }>({
    queryKey: ["/api/employees"],
  });
  const employees = employeesData?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/discipline-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discipline-records"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Intizom yozuvi muvaffaqiyatli qo'shildi",
      });
      onOpenChange(false);
      setFormData({
        userId: userId || "",
        type: "warning",
        amount: 0,
        reason: "",
        reasonRu: "",
        givenBy: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error?.message || "Intizom yozuvi qo'shishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("intizomYozuviQoshish")}</DialogTitle>
          <DialogDescription>
            {t("xodimgaOgohlantirishJazoYokiMukofot")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!userId && (
            <div className="space-y-1">
          <Label htmlFor="userId">{t("xodim")}</Label>
              <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                <SelectTrigger data-testid="select-employee" className="h-9">
                  <SelectValue placeholder={t("xodimniTanlang")} />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(employees) ? employees : []).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="type">{t("turi")}</Label>
              <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as "warning" | "penalty" | "reward" })}>
                <SelectTrigger data-testid="select-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">{t("warning")}</SelectItem>
                  <SelectItem value="penalty">{t("jazo")}</SelectItem>
                  <SelectItem value="reward">{t("mukofot")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
          <Label htmlFor="amount">Summa (so'm)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                data-testid="input-amount"
              />
              <p className="text-xs text-muted-foreground">
                {formData.type === "penalty" ? "Jarima summasi" : formData.type === "reward" ? "Mukofot summasi" : "Ixtiyoriy"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
          <Label htmlFor="reason">Sabab (O'zbek) *</Label>
            <Textarea
              id="reason"
              placeholder={t("sababVaTafsilot")}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              required
              data-testid="input-reason"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="reasonRu">Sabab (Rus)</Label>
            <Textarea
              id="reasonRu"
              placeholder="Причина и подробности..."
              value={formData.reasonRu}
              onChange={(e) => setFormData({ ...formData, reasonRu: e.target.value })}
              rows={3}
              data-testid="input-reason-ru"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="givenBy">{t("kimBerdi")}</Label>
            <Select value={formData.givenBy} onValueChange={(value) => setFormData({ ...formData, givenBy: value })}>
              <SelectTrigger data-testid="select-given-by" className="h-9">
                <SelectValue placeholder="HR/Admin tanlang" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(employees) ? employees : []).filter(emp => emp.role === "admin" || emp.role === "hr")
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !formData.userId || !formData.givenBy} 
              data-testid="button-submit"
            >
              {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
