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
    public readonly userId: string) {}
}
