import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@nestjs/cqrs';
import { DesignStatus } from '../enums/design-status.enum';

export class DesignOrder extends AggregateRoot {
  id: string;
  salesOrderId: number;
  productId: number;
  status: DesignStatus;
  description: string;
  aiGeneratedDesign: string | null;
  designerNotes: string | null;
  customerFeedback: string | null;
  designerId: number | null;
  customerId: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;

  constructor(
    salesOrderId: number,
    productId: number,
    description: string,
    customerId: number,
  ) {
    super();
    this.id = uuid();
    this.salesOrderId = salesOrderId;
    this.productId = productId;
    this.status = DesignStatus.NEW;
    this.description = description;
    this.aiGeneratedDesign = null;
    this.designerNotes = null;
    this.customerFeedback = null;
    this.designerId = null;
    this.customerId = customerId;
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
    this.approvedAt = null;
  }

  generateAiDesign(design: string): void {
    this.aiGeneratedDesign = design;
    this.status = DesignStatus.AI_GENERATED;
    this.updatedAt = _time.now();
  }

  submitForReview(designerId: number, notes: string): void {
    this.designerId = designerId;
    this.designerNotes = notes;
    this.status = DesignStatus.DESIGNER_REVIEW;
    this.updatedAt = _time.now();
  }

  requestCustomerApproval(): void {
    this.status = DesignStatus.WAITING_CUSTOMER_APPROVAL;
    this.updatedAt = _time.now();
  }

  approve(): void {
    this.status = DesignStatus.APPROVED;
    this.approvedAt = _time.now();
    this.updatedAt = _time.now();
  }

  reject(feedback: string): void {
    this.status = DesignStatus.REJECTED;
    this.customerFeedback = feedback;
    this.updatedAt = _time.now();
  }

  requestRevision(feedback: string): void {
    this.status = DesignStatus.REVISION_REQUESTED;
    this.customerFeedback = feedback;
    this.updatedAt = _time.now();
  }

  static create(
    salesOrderId: number,
    productId: number,
    description: string,
    customerId: number,
  ): DesignOrder {
    return new DesignOrder(salesOrderId, productId, description, customerId);
  }
}
