/**
 * @module create-invoice.command
 * @description Source module. See exports for details.
 */

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export class CreateInvoiceCommand {
  constructor(public readonly salesOrderId: string,
    public readonly customerName: string,
    public readonly items: InvoiceItem[],
    public readonly dueDate: Date,
    public readonly notes: string | null,
    public readonly userId: string,
    // Master-reja 3.5 "eksport-invoys (Incoterms)" — ixtiyoriy (EP-SD-070).
    public readonly deliveryTerm: string | null = null,
    public readonly incotermCode: string | null = null,
    public readonly currency: string | null = null) {}
}
