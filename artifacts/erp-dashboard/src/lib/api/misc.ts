/**
 * @module misc
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const ecommerceApi = {
  createProduct: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/admin/products", data),
  updateProduct: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/products/${id}`, data),
  deleteProduct: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/products/${id}`),
  createCategory: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/admin/categories", data),
  updateCategory: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/categories/${id}`, data),
  deleteCategory: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/categories/${id}`),
  updateCustomer: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/customers/${id}`, data),
  updateOrderStatus: (id: number | string, status: string) =>
    apiRequest("PUT", `/api/admin/customer-orders/${id}/status`, { status }),
  updateOrder: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/admin/customer-orders/${id}`, data),
  deleteOrder: (id: number | string) =>
    apiRequest("DELETE", `/api/admin/customer-orders/${id}`),
  createPublicOrder: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/public/orders", data),
};
