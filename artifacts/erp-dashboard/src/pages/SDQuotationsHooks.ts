/**
 * @module SDQuotationsHooks
 * @description Custom hooks encapsulating data-fetching and mutation logic for
 * the SDQuotations page.
 */

import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuotationFormData, QuotationLineItem, Quotation } from "./SDQuotationsTypes";

// ---------------------------------------------------------------------------
// useQuotationsData — queries only
// ---------------------------------------------------------------------------

export function useQuotationsData() {
  const quotations = useQuery<Quotation[]>({ queryKey: ["/api/sd/quotations"] });
  const companies = useQuery<Array<{ id: string; name: string }>>({ queryKey: ["/api/crm/companies"] });
  const products = useQuery<Array<{ id: string; name: string; basePrice?: number }>>({ queryKey: ["/api/products"] });

  return { quotations, companies, products };
}

// ---------------------------------------------------------------------------
// useQuotationsMutations
// ---------------------------------------------------------------------------

export interface SaveQuotationArgs {
  data: QuotationFormData;
  items: QuotationLineItem[];
  editingQuotation: Quotation | null;
}

export interface QuotationMutationCallbacks {
  onSaveSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function useQuotationsMutations({ onSaveSuccess, onDeleteSuccess }: QuotationMutationCallbacks) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const saveQuotation = useMutation({
    mutationFn: async ({ data, items, editingQuotation }: SaveQuotationArgs) => {
      const safeItems = Array.isArray(items) ? items : [];
      const netValue = safeItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100),
        0,
      );
      const payload = {
        ...data,
        netValue,
        taxAmount: 0,
        totalValue: netValue,
        items: safeItems.map((item) => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          unit: "dona",
          netValue: item.quantity * item.unitPrice * (1 - item.discount / 100),
        })),
      };
      if (editingQuotation) {
        await apiRequest("PATCH", `/api/sd/quotations/${editingQuotation.id}`, payload);
      } else {
        await apiRequest("POST", "/api/sd/quotations", payload);
      }
    },
    onSuccess: (_data, { editingQuotation }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      toast({ description: editingQuotation ? "Taklif yangilandi" : "Taklif yaratildi" });
      onSaveSuccess();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", description: err.message || "Xatolik yuz berdi" });
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/sd/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      toast({ description: "Taklif o'chirildi" });
      onDeleteSuccess();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", description: err.message || "Xatolik yuz berdi" });
    },
  });

  const convertToOrder = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest<{ order: { id: string; documentNumber?: string } }>(
        "POST",
        `/api/sd/quotations/${id}/convert-to-order`,
        {},
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sd/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sd/orders"] });
      toast({ description: `Taklif buyurtmaga aylantirildi: ${data?.order?.documentNumber || ""}` });
      navigate("/sd/sales-orders");
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", description: err.message || "Xatolik yuz berdi" });
    },
  });

  return { saveQuotation, deleteQuotation, convertToOrder };
}
