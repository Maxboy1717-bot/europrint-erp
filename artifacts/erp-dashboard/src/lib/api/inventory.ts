import { apiRequest } from "@/lib/queryClient";

export const inventoryApi = {
  updateMaterial: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/inventory/materials/${id}`, data),
  deleteMaterial: (id: number | string) =>
    apiRequest("DELETE", `/api/inventory/materials/${id}`),
  createEquipment: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/equipment", data),
  updateAsset: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/assets/${id}`, data),
  deleteAsset: (id: number | string) =>
    apiRequest("DELETE", `/api/assets/${id}`),
  updateAssetMgmt: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/asset-management/assets/${id}`, data),
  deleteAssetMgmt: (id: number | string) =>
    apiRequest("DELETE", `/api/asset-management/assets/${id}`),
  depreciateAsset: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/asset-management/assets/${id}/depreciate`, data),
  completeAssetMaintenance: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/asset-management/maintenance/${id}/complete`, data),
};
