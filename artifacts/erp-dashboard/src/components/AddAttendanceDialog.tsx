/**
 * @module AddAttendanceDialog
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
interface AddAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function AddAttendanceDialog({ open, onOpenChange, userId }: AddAttendanceDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    userId: userId || "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "",
    checkOut: "",
    status: "present" as "present" | "absent" | "leave" | "sick",
    isLate: false,
    isEarlyLeave: false,
    minutesLate: 0,
    minutesEarly: 0,
    notes: "",
  });

  useEffect(() => {
    if (userId) {
      setFormData(prev => ({ ...prev, userId }));
    }
  }, [userId]);

  const { data: employeesResponse } = useQuery<{ data: { id: string; fullName: string; employeeId: string }[] }>({
    queryKey: ["/api/employees"],
  });
  const employees = employeesResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Davomat muvaffaqiyatli qo'shildi",
      });
      onOpenChange(false);
      setFormData({
        userId: userId || "",
        date: new Date().toISOString().split('T')[0],
        checkIn: "",
        checkOut: "",
        status: "present",
        isLate: false,
        isEarlyLeave: false,
        minutesLate: 0,
        minutesEarly: 0,
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error?.message || "Davomat qo'shishda xatolik yuz berdi",
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
          <DialogTitle className="text-[18px] font-semibold">Davomat qo'shish</DialogTitle>
          <DialogDescription>
            Xodim davomatini qayd qilish
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!userId && (
            <div className="space-y-1">
          <Label htmlFor="userId">Xodim *</Label>
              <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                <SelectTrigger data-testid="select-employee" className="h-9">
                  <SelectValue placeholder="Xodimni tanlang" />
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
          <Label htmlFor="date">Sana *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min="2000-01-01"
                max={new Date().toISOString().split('T')[0]}
                required
                data-testid="input-date"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="status">Holat *</Label>
              <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value as "present" | "absent" | "leave" | "sick" })}>
                <SelectTrigger data-testid="select-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Keldi</SelectItem>
                  <SelectItem value="absent">Kelmadi</SelectItem>
                  <SelectItem value="leave">Ta'til</SelectItem>
                  <SelectItem value="sick">Kasallik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="checkIn">Kelish vaqti (HH:MM)</Label>
              <Input
                id="checkIn"
                type="time"
                value={formData.checkIn ? formData.checkIn.substring(0, 5) : ""}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value ? e.target.value + ":00" : "" })}
                data-testid="input-check-in"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="checkOut">Ketish vaqti (HH:MM)</Label>
              <Input
                id="checkOut"
                type="time"
                value={formData.checkOut ? formData.checkOut.substring(0, 5) : ""}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value ? e.target.value + ":00" : "" })}
                data-testid="input-check-out"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="minutesLate">Kechikish (daqiqa)</Label>
              <Input
                id="minutesLate"
                type="number"
                min="0"
                value={formData.minutesLate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  minutesLate: parseInt(e.target.value) || 0,
                  isLate: parseInt(e.target.value) > 0
                })}
                data-testid="input-minutes-late"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="minutesEarly">Erta ketish (daqiqa)</Label>
              <Input
                id="minutesEarly"
                type="number"
                min="0"
                value={formData.minutesEarly}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  minutesEarly: parseInt(e.target.value) || 0,
                  isEarlyLeave: parseInt(e.target.value) > 0
                })}
                data-testid="input-minutes-early"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label htmlFor="notes">Izoh</Label>
            <Textarea
              id="notes"
              placeholder="Qo'shimcha ma'lumot..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !formData.userId} data-testid="button-submit">
              {createMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
