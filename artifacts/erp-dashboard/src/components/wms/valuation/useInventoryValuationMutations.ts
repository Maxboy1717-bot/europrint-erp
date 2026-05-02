import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InventoryValuationCountForm, AssetInventoryForm } from "./types";

interface UseInventoryValuationMutationsProps {
  setNewCountForm: (form: InventoryValuationCountForm) => void;
  setIsCreateDialogOpen: (open: boolean) => void;
  setNewAssetForm: (form: AssetInventoryForm) => void;
  setIsCreateAssetDialogOpen: (open: boolean) => void;
}

export function useInventoryValuationMutations({
  setNewCountForm,
  setIsCreateDialogOpen,
  setNewAssetForm,
  setIsCreateAssetDialogOpen,
}: UseInventoryValuationMutationsProps) {
  const { toast } = useToast();

  const createCountMutation = useMutation({
    mutationFn: (data: InventoryValuationCountForm) => 
      apiRequest("POST", "/api/finance-extended/inventory-counts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/inventory-counts"] });
      toast({ title: "Inventarizatsiya yaratildi" });
      setIsCreateDialogOpen(false);
      setNewCountForm({
        countDate: new Date().toISOString().split("T")[0],
        warehouseId: "",
        countType: "full",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: (data: AssetInventoryForm) => 
      apiRequest("POST", "/api/finance-extended/asset-inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/asset-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-extended/asset-inventory/summary"] });
      toast({ title: "Aktiv yaratildi" });
      setIsCreateAssetDialogOpen(false);
      setNewAssetForm({
        assetCode: "",
        assetName: "",
        assetType: "equipment",
        location: "",
        purchaseDate: "",
        purchaseValue: 0,
        currentValue: 0,
        usefulLife: 5,
        salvageValue: 0,
        condition: "good",
        serialNumber: "",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  return {
    createCountMutation,
    createAssetMutation,
  };
}
