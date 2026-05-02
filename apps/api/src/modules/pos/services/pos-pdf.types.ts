export interface PdfMovementData {
  movementNumber:  string;
  typeCode:        string;
  status:          string;
  createdAt:       Date;
  supplierName?:   string | null;
  documentNumber?: string | null;
  fromWarehouse?:  string | null;
  toWarehouse?:    string | null;
  createdByName?:  string | null;
  lines: Array<{
    xomAshyo:      string;
    quantity:      number;
    unitOfMeasure: string;
    unitPrice:     number;
    totalPrice:    number;
    currency:      string;
    batchId?:      string | null;
    expiryDate?:   Date | null;
  }>;
}
