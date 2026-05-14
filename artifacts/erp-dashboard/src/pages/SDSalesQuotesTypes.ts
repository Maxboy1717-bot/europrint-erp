/**
 * @module SDSalesQuotesTypes
 * @description TypeScript interfaces, types, and constants for SDSalesQuotes.
 */

export interface SdCustomerItem {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface PriceResult {
  blankLengthMm?: number;
  blankWidthMm?: number;
  blankAreaM2?: number;
  totalPaperM2?: number;
  paperCost?: number;
  printCost?: number;
  plateCost?: number;
  dieCost?: number;
  processingCost?: number;
  extrasCost?: number;
  deliveryCost?: number;
  totalCostPrice?: number;
  markupPercent?: number;
  markupAmount?: number;
  vatAmount?: number;
  unitPriceWithVat?: number;
  totalPriceWithVat?: number;
  grossMarginPercent?: number;
}

export interface SdQuotationItem {
  id: string;
  quotationNumber?: string;
  status?: string;
  customerName?: string;
  quantity?: number;
  validUntil?: string;
  totalPrice?: number;
  unitPrice?: number;
  notes?: string;
  customerId?: string;
}

export interface CalcForm {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  paperType: string;
  printColors: number;
  quantity: number;
  isNewDie: boolean;
  lamination: boolean;
  embossing: boolean;
  perforation: boolean;
  deliveryKm: number;
}

export interface QuotationForm {
  customerId: string;
  validUntil: string;
  notes: string;
  paymentTerms: string;
}

export const PAPER_TYPES = [
  { value: "b_flute", label: "B-flute 3mm (Standart)" },
  { value: "c_flute", label: "C-flute 4mm (O'rta)" },
  { value: "bc_flute", label: "BC-flute 7mm (Ikki qavat)" },
  { value: "e_flute", label: "E-flute 1.5mm (Ingichka)" },
  { value: "micro", label: "Micro-flute (Eng ingichka)" },
];

export const PRINT_COLORS = [
  { value: 0, label: "Bossiz" },
  { value: 1, label: "1 rang" },
  { value: 2, label: "2 rang" },
  { value: 4, label: "4 rang (To'liq CMYK)" },
];

export const DELIVERY_TYPES = [
  { value: 0, label: "Toshkent (Standart)" },
  { value: 30, label: "30 km gacha" },
  { value: 60, label: "60 km gacha" },
  { value: 100, label: "100 km gacha" },
];

export const defaultCalcForm: CalcForm = {
  lengthMm: 300, widthMm: 200, heightMm: 100,
  paperType: "b_flute", printColors: 0, quantity: 1000,
  isNewDie: false, lamination: false, embossing: false, perforation: false,
  deliveryKm: 0,
};

export const defaultQuotationForm: QuotationForm = {
  customerId: "",
  validUntil: "",
  notes: "",
  paymentTerms: "70% avans, 30% yetkazishdan oldin",
};
