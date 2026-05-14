/**
 * @module MarketingSettingsDialogs
 * @description Dialog components for MarketingSettings page.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { SettingFormState, ApiFormState } from "./MarketingSettingsTypes";

import { useTranslation } from '@/lib/i18n';
interface ApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editApiId: string | null;
  apiForm: ApiFormState;
  onApiFormChange: (form: ApiFormState) => void;
  onSubmit: () => void;
  isSubmitPending: boolean;
}

export function ApiDialog({open,
  onOpenChange,
  editApiId,
  apiForm,
  onApiFormChange,
  onSubmit,
  isSubmitPending,
}: ApiDialogProps) {
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" data-testid="button-add-api">
          <Plus className="h-4 w-4" />API qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-none p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground font-bold">{editApiId ? "API ni tahrirlash" : "Yangi API sozlama"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Platforma *</Label>
            <Select value={apiForm.platform} onValueChange={(v) => onApiFormChange({ ...apiForm, platform: v })}>
              <SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">API Key</Label>
            <Input className="bg-background border-border" value={apiForm.apiKey} onChange={(e) => onApiFormChange({ ...apiForm, apiKey: e.target.value })} type="password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">API Secret</Label>
            <Input className="bg-background border-border" value={apiForm.apiSecret} onChange={(e) => onApiFormChange({ ...apiForm, apiSecret: e.target.value })} type="password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">{t('accessToken')}</Label>
            <Input className="bg-background border-border" value={apiForm.accessToken} onChange={(e) => onApiFormChange({ ...apiForm, accessToken: e.target.value })} type="password" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Page/Bot ID</Label>
            <Input className="bg-background border-border" value={apiForm.pageId} onChange={(e) => onApiFormChange({ ...apiForm, pageId: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Webhook Secret</Label>
            <Input className="bg-background border-border" value={apiForm.webhookSecret} onChange={(e) => onApiFormChange({ ...apiForm, webhookSecret: e.target.value })} type="password" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={apiForm.isActive} onCheckedChange={(v) => onApiFormChange({ ...apiForm, isActive: v })} className="data-[state=checked]:bg-primary" />
            <Label className="text-foreground font-medium">Faol</Label>
          </div>
          <Button onClick={onSubmit} disabled={isSubmitPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-submit-api">
            {editApiId ? "Saqlash" : "Yaratish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CreateSettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SettingFormState;
  onFormChange: (form: SettingFormState) => void;
  onSubmit: () => void;
  isSubmitPending: boolean;
}

export function CreateSettingDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isSubmitPending,
}: CreateSettingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-semibold gap-2" data-testid="button-create-setting">
          <Plus className="h-4 w-4" />Yangi Sozlama
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-none p-6">
        <DialogHeader>
          <DialogTitle className="text-foreground font-bold">Yangi Sozlama</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Kalit *</Label>
            <Input className="bg-background border-border" data-testid="input-setting-key" value={form.key} onChange={(e) => onFormChange({ ...form, key: e.target.value })} placeholder="brand_color" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Qiymat</Label>
            <Input className="bg-background border-border" value={form.value} onChange={(e) => onFormChange({ ...form, value: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Kategoriya</Label>
            <Input className="bg-background border-border" value={form.category} onChange={(e) => onFormChange({ ...form, category: e.target.value })} placeholder="general" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Tavsif</Label>
            <Textarea className="bg-background border-border" value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })} />
          </div>
          <Button onClick={onSubmit} disabled={!form.key || isSubmitPending} className="w-full bg-primary text-white font-bold h-11" data-testid="button-submit-setting">Yaratish</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
