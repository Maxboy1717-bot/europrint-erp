import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  Camera, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Save, 
  Loader2 
} from "lucide-react";
import { 
  TriggerRule, 
  CameraWithPrompt, 
  DETECTION_TYPES, 
  ACTION_OPTIONS, 
  MODULE_LABELS, 
  SEVERITY_LABELS 
} from "./types";

export function CameraTriggerRules() {
  const { toast } = useToast();
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const { data: camerasData, isLoading: camsLoading } = useQuery<{ cameras: CameraWithPrompt[] }>({
    queryKey: ["/api/camera-ai/cameras"],
  });
  const cameras_list = camerasData?.cameras ?? [];

  const { data: rulesData, isLoading: rulesLoading } = useQuery<{
    triggerRules: TriggerRule[];
  }>({
    queryKey: ["/api/camera-ai/cameras", selectedCameraId, "trigger-rules"],
    queryFn: () => fetch(`/api/camera-ai/cameras/${selectedCameraId}/trigger-rules`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedCameraId,
  });

  const saveRulesMutation = useMutation({
    mutationFn: async () =>
      apiRequest("PUT", `/api/camera-ai/cameras/${selectedCameraId}/trigger-rules`, { triggerRules: rules }),
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["/api/camera-ai/cameras", selectedCameraId, "trigger-rules"] });
      toast({ title: "Trigger qoidalari saqlandi", description: `${rules.length} ta qoida muvaffaqiyatli saqlandi` });
    },
    onError: () => toast({ title: "Xato", description: "Saqlashda xatolik", variant: "destructive" }),
  });

  useEffect(() => {
    if (rulesData?.triggerRules && !isDirty) {
      setRules(rulesData.triggerRules);
    }
  }, [rulesData, isDirty]);

  const handleCameraSelect = (cid: string) => {
    setSelectedCameraId(cid);
    setIsDirty(false);
    setRules([]);
  };

  const addRule = () => {
    const newRule: TriggerRule = {
      id: Date.now().toString(),
      detectionType: "ppe_violation",
      action: "safety_alert",
      targetModule: "safety",
      severity: "high",
      enabled: true,
      description: "",
    };
    setRules(prev => [...prev, newRule]);
    setIsDirty(true);
  };

  const updateRule = (id: string, changes: Partial<TriggerRule>) => {
    setRules(prev => (prev ?? []).map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...changes };
      if (changes.detectionType) {
        const dt = DETECTION_TYPES.find(d => d.value === changes.detectionType);
        if (dt) updated.targetModule = dt.module;
      }
      return updated;
    }));
    setIsDirty(true);
  };

  const deleteRule = (id: string) => {
    setRules(prev => (prev ?? []).filter(r => r.id !== id));
    setIsDirty(true);
  };

  const toggleRule = (id: string) => {
    setRules(prev => (prev ?? []).map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setIsDirty(true);
  };

  if (camsLoading) return <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Per-kamera Trigger Qoidalari (TZ-18)
          </CardTitle>
          <CardDescription>
            Har bir kamera uchun aniqlash turi → modul alerti → harakatni sozlang.
            Bu qoidalar AI kamera tahlili natijalariga asoslanib avtomatik alertlar yaratadi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cameras_list.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Kameralar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kamera tanlang</Label>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(cameras_list) ? cameras_list : []).map(cam => (
                  <Button
                    key={cam.id}
                    variant={selectedCameraId === cam.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCameraSelect(cam.id)}
                    data-testid={`button-cam-select-${cam.id}`}
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    {cam.code || cam.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedCameraId && (
            <div className="space-y-4 pt-2">
              {rulesLoading ? (
                <div className="space-y-2">
                  {([1, 2]).map((n) => <Skeleton key={n} className="h-20 w-full" />)}
                </div>
              ) : (
                <>
                  {rules.length === 0 && !isDirty ? (
                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Bu kamera uchun trigger qoidalar yo'q. Yangi qoida qo'shing.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(rules) ? rules : []).map((rule, idx) => {
                        const sev = SEVERITY_LABELS[rule.severity] || SEVERITY_LABELS.high;
                        return (
                          <Card key={rule.id} className={`bg-muted/30 ${!rule.enabled ? "opacity-60" : ""}`}>
                            <CardContent className="pt-4 space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">Qoida #{idx + 1}</Badge>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${sev.color} bg-transparent border`}>{sev.label}</Badge>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => toggleRule(rule.id)}
                                    data-testid={`button-toggle-rule-${rule.id}`}
                                  >
                                    {rule.enabled
                                      ? <ToggleRight className="h-4 w-4 text-green-500" />
                                      : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteRule(rule.id)}
                                    data-testid={`button-delete-rule-${rule.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs font-semibold text-muted-foreground">Aniqlash turi</Label>
                                  <Select value={rule.detectionType} onValueChange={v => updateRule(rule.id, { detectionType: v })}>
                                    <SelectTrigger className="h-9" data-testid={`select-detection-${rule.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Array.isArray(DETECTION_TYPES) ? DETECTION_TYPES : []).map(dt2 => (
                                        <SelectItem key={dt2.value} value={dt2.value}>{dt2.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-semibold text-muted-foreground">Harakat</Label>
                                  <Select value={rule.action} onValueChange={v => updateRule(rule.id, { action: v })}>
                                    <SelectTrigger className="h-9" data-testid={`select-action-${rule.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Array.isArray(ACTION_OPTIONS) ? ACTION_OPTIONS : []).map(ao => (
                                        <SelectItem key={ao.value} value={ao.value}>{ao.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-semibold text-muted-foreground">Muhimlik</Label>
                                  <Select value={rule.severity} onValueChange={v => updateRule(rule.id, { severity: v })}>
                                    <SelectTrigger className="h-9" data-testid={`select-severity-${rule.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Past</SelectItem>
                                      <SelectItem value="medium">O'rta</SelectItem>
                                      <SelectItem value="high">Yuqori</SelectItem>
                                      <SelectItem value="critical">Kritik</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold">Modul:</span>
                                <Badge variant="secondary" className="text-xs">{MODULE_LABELS[rule.targetModule] || rule.targetModule}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" onClick={addRule} data-testid="button-add-trigger-rule">
                      <Plus className="h-4 w-4 mr-1" />
                      Qoida qo'shish
                    </Button>
                    {isDirty && (
                      <Button onClick={() => saveRulesMutation.mutate()} disabled={saveRulesMutation.isPending} data-testid="button-save-trigger-rules">
                        {saveRulesMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Saqlash
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
