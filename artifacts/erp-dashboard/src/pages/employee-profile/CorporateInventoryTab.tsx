/**
 * @module CorporateInventoryTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CorporateInventoryItem, CorporateInventoryTabProps, InventoryFormState } from "./CorporateInventoryTabTypes";
import { INITIAL_INVENTORY_FORM } from "./CorporateInventoryTabTypes";
import { InventoryKpiRow, ActiveInventoryTable, ReturnedInventoryTable } from "./CorporateInventoryTabSections";
import { AddInventoryDialog } from "./CorporateInventoryTabDialogs";

export function CorporateInventoryTab({ employeeId, isHr }: CorporateInventoryTabProps) {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState<InventoryFormState>(INITIAL_INVENTORY_FORM);

  const { data: items, isLoading } = useQuery<CorporateInventoryItem[]>({
    queryKey: ["/api/employees", employeeId, "corporate-inventory"],
    queryFn: async () => {
      const res = (await apiRequest('GET', `/api/employees/${employeeId}/corporate-inventory`)) as unknown as Response;
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    },
    enabled: !!employeeId,
  });

  const addMutation = useMutation({
    mutationFn: async (data: InventoryFormState) => {
      return await apiRequest("POST", `/api/employees/${employeeId}/corporate-inventory`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "corporate-inventory"] });
      setAddDialogOpen(false);
      setForm(INITIAL_INVENTORY_FORM);
      toast({ title: "Inventar qo'shildi" });
    },
    onError: () => toast({ title: "Xatolik yuz berdi", variant: "destructive" }),
  });

  const signMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return await apiRequest("PATCH", `/api/employees/${employeeId}/corporate-inventory/${itemId}/sign`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "corporate-inventory"] });
      toast({ title: "Imzo tasdiqlandi" });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return await apiRequest("PATCH", `/api/employees/${employeeId}/corporate-inventory/${itemId}/return`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "corporate-inventory"] });
      toast({ title: "Qaytarildi deb belgilandi" });
    },
  });

  const safeItems = Array.isArray(items) ? items : [];
  const activeItems = safeItems.filter(i => !i.returnedDate);
  const returnedItems = safeItems.filter(i => i.returnedDate);

  return (
    <div className="space-y-6">
      <InventoryKpiRow activeItems={activeItems} returnedItems={returnedItems} />

      <ActiveInventoryTable
        isLoading={isLoading}
        activeItems={activeItems}
        isHr={isHr}
        signPending={signMutation.isPending}
        returnPending={returnMutation.isPending}
        onAdd={() => setAddDialogOpen(true)}
        onSign={(id) => signMutation.mutate(id)}
        onReturn={(id) => returnMutation.mutate(id)}
      />

      <ReturnedInventoryTable returnedItems={returnedItems} />

      <AddInventoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        form={form}
        onChange={setForm}
        onSave={() => addMutation.mutate(form)}
        isPending={addMutation.isPending}
      />
    </div>
  );
}
