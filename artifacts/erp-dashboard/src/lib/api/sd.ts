/**
 * @module sd
 * @description Frontend utility / library module.
 */

import { apiRequest } from "@/lib/queryClient";

export const sdApi = {
  createOrder: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/sd/orders", data),
  updateOrderStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/sd/orders/${id}/status`, { status }),
  advanceBypassOrder: (id: number | string, reason: string) =>
    apiRequest("POST", `/api/sd/orders/${id}/advance-bypass`, { reason }),
  techCheckpoint: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/sd/orders/${id}/tech-checkpoint`, data),

  createInvoice: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/sd/invoices", data),
  /** Hisob-faktura PDF URL — <a href> orqali (httpOnly cookie auth, pos-monitor pattern). */
  getInvoicePdfUrl: (id: string) => `/api/sd/invoices/${id}/pdf`,

  createCustomer: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/sd/customers", data),
  updateCustomer: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/sd/customers/${id}`, data),
  deleteCustomer: (id: number | string) =>
    apiRequest("DELETE", `/api/sd/customers/${id}`),
  addCustomerContact: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/sd/customers/${id}/contacts`, data),
  updateCustomerContact: (id: number | string, cid: number | string, data: Record<string, unknown>) =>
    apiRequest("PUT", `/api/sd/customers/${id}/contacts/${cid}`, data),
  deleteCustomerContact: (id: number | string, cid: number | string) =>
    apiRequest("DELETE", `/api/sd/customers/${id}/contacts/${cid}`),
  addCustomerInteraction: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/sd/customers/${id}/interactions`, data),
  addCustomerDocument: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/sd/customers/${id}/documents`, data),
  deleteCustomerDocument: (id: number | string, did: number | string) =>
    apiRequest("DELETE", `/api/sd/customers/${id}/documents/${did}`),

  createLead: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/sd/leads", data),
  updateLead: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/sd/leads/${id}`, data),
  updateLeadStatus: (id: number | string, status: string) =>
    apiRequest("PUT", `/api/sd/leads/${id}/status`, { status }),
  deleteLead: (id: number | string) =>
    apiRequest("DELETE", `/api/sd/leads/${id}`),
  convertLead: (id: number | string, data?: Record<string, unknown>) =>
    apiRequest("POST", `/api/sd/leads/${id}/convert`, data),
  addLeadActivity: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/sd/leads/${id}/activities`, data),

  updateDeliveryStatus: (id: number | string, status: string) =>
    apiRequest("PATCH", `/api/sd/deliveries/${id}/status`, { status }),

  updateKpiTarget: (id: number | string, data: Record<string, unknown>) =>
    apiRequest("PATCH", `/api/sd/kpi-targets/${id}`, data),
  createContract: (data: Record<string, unknown>) =>
    apiRequest("POST", "/api/sd/contracts", data),
  resolveComplaint: (id: number | string, cid: number | string, data: Record<string, unknown>) =>
    apiRequest("POST", `/api/sd/customers/${id}/complaints/${cid}/resolve`, data),
  convertQuotation: (id: number | string) =>
    apiRequest("POST", `/api/sd/quotations/${id}/convert`),
  convertQuotationToOrder: (id: number | string) =>
    apiRequest("POST", `/api/sd/quotations/${id}/convert-to-order`),
  deleteCustomerCompetitor: (id: number | string, coid: number | string) =>
    apiRequest("DELETE", `/api/sd/customers/${id}/competitors/${coid}`),

};
