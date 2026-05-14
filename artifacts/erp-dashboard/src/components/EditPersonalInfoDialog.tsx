/**
 * @module EditPersonalInfoDialog
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
interface EmployeePersonalInfo {
  age?: number | string;
  gender?: string;
  childrenCount?: number;
  maritalStatus?: string;
  childrenEducation?: string;
  householdSize?: number;
  householdMembers?: string;
  housingType?: string;
}

interface EditPersonalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  employee?: EmployeePersonalInfo;
}

export function EditPersonalInfoDialog({ open, onOpenChange, userId, employee }: EditPersonalInfoDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    age: employee?.age || "",
    gender: employee?.gender || "",
    childrenCount: employee?.childrenCount || 0,
    maritalStatus: employee?.maritalStatus || "",
    childrenEducation: employee?.childrenEducation || "",
    householdSize: employee?.householdSize || 0,
    householdMembers: employee?.householdMembers || "",
    housingType: employee?.housingType || "",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        age: employee.age || "",
        gender: employee.gender || "",
        childrenCount: employee.childrenCount || 0,
        maritalStatus: employee.maritalStatus || "",
        childrenEducation: employee.childrenEducation || "",
        householdSize: employee.householdSize || 0,
        householdMembers: employee.householdMembers || "",
        housingType: employee.housingType || "",
      });
    }
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", `/api/employees/${userId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", userId] });
      toast({
        title: "Muvaffaqiyat",
        description: "Shaxsiy ma'lumotlar muvaffaqiyatli yangilandi",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error?.message || "Shaxsiy ma'lumotlarni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Shaxsiy ma'lumotlarni tahrirlash</DialogTitle>
          <DialogDescription>
            ABC analiz uchun xodimning shaxsiy ma'lumotlarini yangilang
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="age">Yoshi</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                data-testid="input-age"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="gender">Jinsi</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger data-testid="select-gender" className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="erkak">Erkak</SelectItem>
                  <SelectItem value="ayol">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="maritalStatus">Oilaviy holat</Label>
              <Select value={formData.maritalStatus} onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}>
                <SelectTrigger data-testid="select-marital-status" className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oilali">Oilali</SelectItem>
                  <SelectItem value="bo'ydoq">Bo'ydoq</SelectItem>
                  <SelectItem value="turmushga_chiqqan">Turmushga chiqqan</SelectItem>
                  <SelectItem value="turmushga_chiqmagan">Turmushga chiqmagan</SelectItem>
                  <SelectItem value="ajrashgan">Ajrashgan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
          <Label htmlFor="childrenCount">Farzandlar soni</Label>
              <Input
                id="childrenCount"
                type="number"
                min="0"
                max="20"
                value={formData.childrenCount}
                onChange={(e) => setFormData({ ...formData, childrenCount: parseInt(e.target.value) || 0 })}
                data-testid="input-children-count"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label htmlFor="childrenEducation">Farzandlarning ta'lim holati</Label>
            <Select value={formData.childrenEducation} onValueChange={(value) => setFormData({ ...formData, childrenEducation: value })}>
              <SelectTrigger data-testid="select-children-education" className="h-9">
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yo'q">Farzand yo'q</SelectItem>
                <SelectItem value="maktabgacha">Maktabgacha</SelectItem>
                <SelectItem value="maktabda">Maktabda</SelectItem>
                <SelectItem value="oliy ta'lim">Oliy ta'limda</SelectItem>
                <SelectItem value="bitirgan">Ta'limni bitirgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-4">Uy-joy sharoiti</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
          <Label htmlFor="housingType">Uy turi</Label>
                <Select value={formData.housingType} onValueChange={(value) => setFormData({ ...formData, housingType: value })}>
                  <SelectTrigger data-testid="select-housing-type" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shaxsiy">Shaxsiy uy</SelectItem>
                    <SelectItem value="ijara">Ijara</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
          <Label htmlFor="householdSize">Oilada necha kishi yashaydi</Label>
                <Input
                  id="householdSize"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.householdSize}
                  onChange={(e) => setFormData({ ...formData, householdSize: parseInt(e.target.value) || 0 })}
                  data-testid="input-household-size"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="householdMembers">Kimlar bilan yashaydi</Label>
              <Input
                id="householdMembers"
                placeholder="Masalan: turmush o'rtog'i, 2 ta farzand, qaynona, qaynota"
                value={formData.householdMembers}
                onChange={(e) => setFormData({ ...formData, householdMembers: e.target.value })}
                data-testid="input-household-members"
              />
              <p className="text-xs text-muted-foreground">
                Oila a'zolarini vergul bilan ajratib yozing
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              data-testid="button-cancel"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save-personal"
            >
              {updateMutation.isPending ? (
                <>
                  <EPLoader className="mr-2" />
                  Saqlanmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
