/**
 * @module types
 * @description React UI component.
 */

import { LucideIcon } from "lucide-react";

export interface Product {
  id: string;
  code: string;
  name: string;
  type?: string;
}

export interface CrmCompany {
  id: string;
  name: string;
}

export interface BomHeader {
  id: string;
  bomNumber: string;
  productId: string;
  version: string;
  status: string;
  baseQuantity: number;
  baseUnit: string;
}

export interface BomItem {
  id: string;
  bomId: string;
  itemNumber: string;
  componentId: string;
  componentType: string;
  quantity: number;
  unit: string;
  scrapPercentage: number;
  notes?: string;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
}

export interface RoutingOperation {
  id: string;
  routingId: string;
  operationNumber: string;
  operationDescription: string;
  setupTime: number;
  machineTime: number;
  laborTime: number;
}

export interface MaterialCalculation {
  componentId: string;
  componentName: string;
  componentCode: string;
  unit: string;
  baseQuantity: number;
  scrapPercentage: number;
  requiredQuantity: number;
  availableStock: number;
  deficit: number;
  status: "sufficient" | "insufficient";
}

export interface Step {
  id: number;
  icon: LucideIcon;
  key: string;
}

export interface FormData {
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  productId: string;
  mahsulotTuri: string;
  vidZakaza: string;
  zakazFormy: string;
  tiraj: number;
  krasok: string;
  formatA: number;
  formatB: number;
  formatC: number;
  sana: string;
  tayyorBolishSanasi: string;
  tayyorBolishVaqti: string;
  schetNo: string;
  menedzherZakaza: string;
  texnolog: string;
  primZakaza: string;
  selectedBomId: string;
}

export type Language = "uz" | "uz-cyr" | "ru";

export interface Translation {
  title: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  step1Desc: string;
  step2Desc: string;
  step3Desc: string;
  step4Desc: string;
  step5Desc: string;
  papkaNo: string;
  papkaNoPlaceholder: string;
  autoGenerate: string;
  customer: string;
  customerPlaceholder: string;
  searchCustomer: string;
  noCustomers: string;
  product: string;
  productPlaceholder: string;
  searchProduct: string;
  noProducts: string;
  productType: string;
  vidZakaza: string;
  zakazFormy: string;
  quantity: string;
  krasok: string;
  formatA: string;
  formatB: string;
  formatC: string;
  orderDate: string;
  deadline: string;
  deadlineTime: string;
  schetNo: string;
  menedzherZakaza: string;
  texnolog: string;
  primZakaza: string;
  primZakazaPlaceholder: string;
  next: string;
  back: string;
  saveDraft: string;
  submit: string;
  selectBom: string;
  bomVersion: string;
  bomStatus: string;
  bomItems: string;
  noBoms: string;
  selectProductFirst: string;
  material: string;
  baseQty: string;
  scrap: string;
  required: string;
  available: string;
  deficit: string;
  status: string;
  sufficient: string;
  insufficient: string;
  orderSummary: string;
  bomSelected: string;
  materialsSummary: string;
  totalMaterials: string;
  sufficientMaterials: string;
  insufficientMaterials: string;
  estimatedTime: string;
  minutes: string;
  hours: string;
  noRouting: string;
  creating: string;
  created: string;
  error: string;
  validation: string;
  loading: string;
  active: string;
  draft: string;
  inactive: string;
  noBomSelected: string;
  [key: string]: string;
}
