/**
 * @module CameraAIPrompts
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bot, Camera, CheckCircle, Edit2, Save } from "lucide-react";
import { CameraWithPrompt, CAMERA_TYPES } from "./types";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
export function CameraAIPrompts() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localPrompts, setLocalPrompts] = useState<Record<string, { prompt: string; sensitivity: string; enabled: boolean }>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const { data, isLoading, refetch } = useQuery<{ cameras: CameraWithPrompt[] }>({
    queryKey: ["/api/camera-ai/cameras"],
  });

  const cameras_list = data?.cameras ?? [];

  const getLocal = (cam: CameraWithPrompt) =>
    localPrompts[cam.id] ?? {
      prompt: cam.ai_prompt ?? CAMERA_TYPES.find(ct => cam.name?.toLowerCase().includes(ct.type))?.defaultPrompt ?? "",
      sensitivity: cam.ai_sensitivity ?? "medium",
      enabled: cam.ai_enabled ?? true,
    };

  const saveMutation = useMutation({
    mutationFn: async ({ id, prompt, sensitivity, enabled }: { id: string; prompt: string; sensitivity: string; enabled: boolean }) =>
      apiRequest("PUT", `/api/camera-ai/cameras/${id}/prompt`, { aiPrompt: prompt, aiSensitivity: sensitivity, aiEnabled: enabled }),
    onSuccess: (_data, vars) => {
      setSaved(prev => ({ ...prev, [vars.id]: true }));
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/camera-ai/cameras"] });
      refetch();
      toast({ title: "AI prompt saqlandi", description: "Kamera AI sozlamalari muvaffaqiyatli yangilandi" });
      setTimeout(() => setSaved(prev => ({ ...prev, [vars.id]: false })), 3000);
    },
    onError: () => toast({ title: "Xato", description: "Saqlashda xatolik", variant: "destructive" }),
  });

  if (isLoading) return <div className="text-center py-8 text-[13px] text-muted-foreground">{t("Yuklanmoqda...")}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--ep-blue)]" />
            {t("harKameraUchunAiPrompt")}
          </CardTitle>
          <CardDescription>
            Har bir kamera uchun alohida AI tahlil yo'riqnomasi. Super Admin tomonidan boshqariladi. Jami: {cameras_list.length} ta kamera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cameras_list.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>{t("haliKameraQoshilmaganKameralarBoshqaruvi")}</p>
            </div>
          ) : (Array.isArray(cameras_list) ? cameras_list : []).map(cam => {
            const loc = getLocal(cam);
            const isEditing = editingId === cam.id;
            return (
              <Card key={cam.id} className="bg-muted/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{cam.name}</span>
                      <Badge variant="outline" className="text-xs">{cam.code}</Badge>
                      {cam.location && <span className="text-xs text-muted-foreground">{cam.location}</span>}
                      <Badge variant={cam.is_active ? "default" : "secondary"} className="text-xs">
                        {cam.is_active ? "Faol" : "O'chiq"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {saved[cam.id] && (
                        <span className="text-[var(--ep-green)] text-sm flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> {t("saqlandi")}
                        </span>
                      )}
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} data-testid={`button-cancel-prompt-${cam.id}`}>{t("Bekor")}</Button>
                          <Button size="sm" onClick={() => saveMutation.mutate({ id: cam.id, ...loc })} disabled={saveMutation.isPending} data-testid={`button-save-prompt-${cam.id}`}>
                            {saveMutation.isPending ? <EPLoader size={12} className="mr-1" /> : <Save className="h-3 w-3 mr-1" />} Saqlash
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingId(cam.id)} data-testid={`button-edit-prompt-${cam.id}`}>
                          <Edit2 className="h-3 w-3 mr-1" /> {t("edit")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={loc.enabled}
                        onCheckedChange={v => setLocalPrompts(p => ({ ...p, [cam.id]: { ...loc, enabled: v } }))}
                        disabled={!isEditing}
                        data-testid={`switch-ai-enabled-${cam.id}`}
                      />
                      <Label className="text-sm">{tLabel("common.CameraAIPrompts.tsx.aiTahlilYoqilgan", "AI tahlil yoqilgan")}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">{t("sezgirlik")}</Label>
                      <Select
                        value={loc.sensitivity}
                        onValueChange={v => setLocalPrompts(p => ({ ...p, [cam.id]: { ...loc, sensitivity: v } }))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="w-28 h-9" data-testid={`select-sensitivity-${cam.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t("low")}</SelectItem>
                          <SelectItem value="medium">{t("medium")}</SelectItem>
                          <SelectItem value="high">{t("high")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    value={loc.prompt}
                    onChange={e => setLocalPrompts(p => ({ ...p, [cam.id]: { ...loc, prompt: e.target.value } }))}
                    disabled={!isEditing}
                    rows={3}
                    placeholder={tLabel('common.CameraAIPrompts.buKameraUchunAiKorsatmasi', "Bu kamera uchun AI ko'rsatmasi (prompt) kiriting...")}
                    className="text-sm resize-none"
                    data-testid={`textarea-prompt-${cam.id}`}
                  />
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
