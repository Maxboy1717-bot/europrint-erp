/**
 * @module UsersPageDialogs
 * @description Role-change dialog, deactivate alert, and create-user dialog for UsersPage.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AdminUser, UserCreateForm } from "./UsersPageTypes";
import { ALL_ROLES } from "./UsersPageTypes";

import { useTranslation } from '@/lib/i18n';
interface RoleDialogProps {
  user: AdminUser | null;
  newRole: string;
  onRoleChange: (r: string) => void;
  onClose: () => void;
  onSave: () => void;
  isPending: boolean;
}

export function RoleChangeDialog({user, newRole, onRoleChange, onClose, onSave, isPending,
}: RoleDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={!!user} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Rolni o'zgartirish — @{user?.username}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label className="mb-2 block">Yangi rol</Label>
          <Select value={newRole} onValueChange={onRoleChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            disabled={isPending || newRole === user?.role}
            onClick={onSave}
          >
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeactivateAlertProps {
  deleteId: number | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateAlert({ deleteId, onClose, onConfirm }: DeactivateAlertProps) {
  return (
    <AlertDialog open={deleteId !== null} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Foydalanuvchini nofaol qilish</AlertDialogTitle>
          <AlertDialogDescription>
            Foydalanuvchi tizimga kira olmaydi. Keyinchalik tiklash mumkin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Nofaol qilish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UserCreateForm;
  onChange: (updated: UserCreateForm) => void;
  onSave: () => void;
  isPending: boolean;
}

export function CreateUserDialog({ open, onOpenChange, form, onChange, onSave, isPending, }: CreateUserDialogProps) {
  const { t } = useTranslation('common');
  const set = (patch: Partial<UserCreateForm>) => onChange({ ...form, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">Yangi foydalanuvchi</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>{t('username')}</Label>
            <Input
              value={form.username}
              onChange={e => set({ username: e.target.value })}
              placeholder="username (min 3 belgi)"
            />
          </div>
          <div>
            <Label>{t('email1')}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => set({ email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label>Parol</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => set({ password: e.target.value })}
              placeholder="Katta harf, raqam va belgi bo'lsin"
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select
              value={form.role}
              onValueChange={v => set({ role: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor</Button>
          <Button
            disabled={isPending || !form.username || !form.email || !form.password}
            onClick={onSave}
          >
            {isPending ? "Yaratilmoqda..." : "Yaratish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
