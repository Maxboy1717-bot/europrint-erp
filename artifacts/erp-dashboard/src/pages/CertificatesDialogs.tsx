/**
 * @module CertificatesDialogs
 * @description Create certificate dialog for Certificates page.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award } from "lucide-react";
import { User, Course } from "./CertificatesTypes";

interface CreateCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[] | undefined;
  courses: Course[] | undefined;
  selectedUserId: string;
  onUserChange: (id: string) => void;
  selectedCourseId: string;
  onCourseChange: (id: string) => void;
  score: string;
  onScoreChange: (v: string) => void;
  bonusAmount: string;
  onBonusChange: (v: string) => void;
  expiresAt: string;
  onExpiresAtChange: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateCertificateDialog({
  open,
  onOpenChange,
  users,
  courses,
  selectedUserId,
  onUserChange,
  selectedCourseId,
  onCourseChange,
  score,
  onScoreChange,
  bonusAmount,
  onBonusChange,
  expiresAt,
  onExpiresAtChange,
  onSubmit,
  isPending,
}: CreateCertificateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          data-testid="button-create-certificate"
          className="bg-primary text-white shadow-sm gap-2"
        >
          <Award className="w-4 h-4" />
          Sertifikat Berish
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Yangi Sertifikat Berish</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Kursni muvaffaqiyatli yakunlagan xodimga sertifikat yarating
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="employee" className="text-foreground font-semibold">Xodim</Label>
            <Select value={selectedUserId} onValueChange={onUserChange}>
              <SelectTrigger
                id="employee"
                data-testid="select-employee"
                className="bg-muted/40 border-border h-9"
              >
                <SelectValue placeholder="Xodimni tanlang" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(Array.isArray(users) ? users : []).map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} ({user.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
          <Label htmlFor="course" className="text-foreground font-semibold">Kurs</Label>
            <Select value={selectedCourseId} onValueChange={onCourseChange}>
              <SelectTrigger
                id="course"
                data-testid="select-course"
                className="bg-muted/40 border-border border-2 border-primary-container h-9"
              >
                <SelectValue placeholder="Kursni tanlang" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {courses?.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="score" className="text-foreground font-semibold">Yakuniy Ball</Label>
              <Input
                id="score"
                data-testid="input-score"
                type="number"
                min="0"
                max="100"
                placeholder="0-100"
                value={score}
                onChange={e => onScoreChange(e.target.value)}
                className="bg-muted/40 border-border"
              />
            </div>
            <div className="space-y-1">
          <Label htmlFor="bonus" className="text-foreground font-semibold">Bonus Miqdori</Label>
              <Input
                id="bonus"
                data-testid="input-bonus"
                type="number"
                min="0"
                placeholder="so'm"
                value={bonusAmount}
                onChange={e => onBonusChange(e.target.value)}
                className="bg-muted/40 border-border"
              />
            </div>
          </div>
          <div className="space-y-1">
          <Label htmlFor="expiresAt" className="text-foreground font-semibold">Amal qilish muddati</Label>
            <Input
              id="expiresAt"
              data-testid="input-expires-at"
              type="date"
              value={expiresAt}
              onChange={e => onExpiresAtChange(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              max="2099-12-31"
              className="bg-muted/40 border-border"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
            className="bg-muted/60 text-foreground border-none shadow-none"
          >
            Bekor qilish
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            data-testid="button-submit"
            className="bg-primary text-white font-semibold shadow-none"
          >
            {isPending ? "Yaratilmoqda..." : "Sertifikat Berish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
