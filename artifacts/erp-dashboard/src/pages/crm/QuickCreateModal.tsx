import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, Building2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuickCreateModalProps, EntityType } from "./crm-types";

interface DuplicateEntry {
  id: number;
  name?: string;
  title?: string;
}

export function QuickCreateModal({ entityType, onClose }: QuickCreateModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stir, setStir] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicateEntry[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const createMutation = useMutation<unknown, Error, boolean>({
    mutationFn: async (force: boolean) => {
      const endpoints: Partial<Record<EntityType, string>> = {
        leads: "/api/crm/leads",
        deals: "/api/crm/deals",
        contacts: "/api/crm/contacts",
        companies: "/api/crm/companies",
      };
      const phones = phone ? [{ value: phone, type: "WORK" }] : [];
      const emails = email ? [{ value: email, type: "WORK" }] : [];
      const payloads: Record<string, Record<string, unknown>> = {
        leads: { title, phones, emails },
        deals: { title, opportunity: 0, currencyId: "UZS" },
        contacts: { name: title, phones, emails, force },
        companies: { title, phones, emails, stir: stir || undefined, force },
      };
      const endpoint = endpoints[entityType];
      if (!endpoint) throw new Error("Unknown entity type");
      return apiRequest("POST", endpoint, payloads[entityType]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/crm/${entityType}`] });
      toast({ title: "Yaratildi" });
      onClose();
    },
    onError: async (error: unknown) => {
      const errMsg = (error as Error)?.message || "";
      if (errMsg.startsWith("409:")) {
        try {
          const jsonStr = errMsg.slice(4).trim();
          const data = JSON.parse(jsonStr);
          if (data.code === "DUPLICATE_DETECTED") {
            setDuplicates(data.duplicates || []);
            setShowDuplicateWarning(true);
            return;
          }
        } catch {}
      }
      toast({ title: "Xatolik", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Nom kerak", variant: "destructive" });
      return;
    }
    setDuplicates([]);
    setShowDuplicateWarning(false);
    createMutation.mutate(false);
  };

  const handleForceCreate = () => {
    setShowDuplicateWarning(false);
    createMutation.mutate(true);
  };

  const entityLabels: Partial<Record<EntityType, string>> = {
    leads: "Lid",
    deals: "Bitim",
    contacts: "Kontakt",
    companies: "Kompaniya",
  };

  const showStir = entityType === "companies";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()} data-testid="quick-create-modal">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tez {entityLabels[entityType]} yaratish</h3>

          {showDuplicateWarning ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-yellow-700 text-sm">Duplikat topildi</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Xuddi shunday {entityLabels[entityType]?.toLowerCase()} mavjud:
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {(Array.isArray(duplicates) ? duplicates : []).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 p-2 rounded border text-sm">
                    {entityType === "contacts" ? (
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 truncate">{d.name || d.title || `ID: ${d.id}`}</span>
                    <Badge variant="outline" className="text-xs">ID: {d.id}</Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDuplicateWarning(false)} className="flex-1">
                  Orqaga
                </Button>
                <Button
                  variant="default"
                  onClick={handleForceCreate}
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-force-create"
                >
                  {createMutation.isPending ? "..." : "Baribir yaratish"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomi *</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={`${entityLabels[entityType]} nomi`}
                  data-testid="input-quick-title"
                  autoFocus
                />
              </div>
              {entityType !== "deals" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      data-testid="input-quick-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      data-testid="input-quick-email"
                    />
                  </div>
                  {showStir && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">STIR (INN)</label>
                      <Input
                        value={stir}
                        onChange={e => setStir(e.target.value)}
                        placeholder="123456789"
                        data-testid="input-quick-stir"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? "..." : "Yaratish"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
