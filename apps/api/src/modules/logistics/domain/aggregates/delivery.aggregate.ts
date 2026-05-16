/**
 * @module delivery.aggregate
 * @description Source module. See exports for details.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { v4 as uuid } from 'uuid';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export class Delivery extends AggregateRoot {
  id: string;
  orderId: number;
  driverId: number;
  vehicleId: string;
  status: DeliveryStatus;
  departure: Date | null;
  arrival: Date | null;
  currentLat: number | null;
  currentLng: number | null;
  createdAt: Date;
  updatedAt: Date;

  // New fields for extended delivery functionality
  salesOrderId: string;
  deliveryNumber: string;
  customerName: string;
  deliveryAddress: string;
  vehicleNumber: string | null;
  completedAt: Date | null;

  constructor(customerName: string, deliveryAddress: string);
  constructor(orderId: number, driverId: number, vehicleId: string);
  constructor(
    customerNameOrOrderId: string | number,
    deliveryAddressOrDriverId?: string | number,
    vehicleId?: string,
  ) {
    super();
    this.id = uuid();

    if (typeof customerNameOrOrderId === 'string') {
      // New constructor
      this.customerName = customerNameOrOrderId;
      this.deliveryAddress = deliveryAddressOrDriverId as string;
      this.salesOrderId = '';
      this.deliveryNumber = `DEL-${Date.now()}`;
      this.status = DeliveryStatus.PENDING;
      this.vehicleNumber = null;
      this.driverId = 0;
      this.vehicleId = '';
      this.orderId = 0;
      this.completedAt = null;
    } else {
      // Old constructor
      this.orderId = customerNameOrOrderId;
      this.driverId = deliveryAddressOrDriverId as number;
      this.vehicleId = vehicleId ?? '';
      this.status = DeliveryStatus.PENDING;
      this.customerName = '';
      this.deliveryAddress = '';
      this.salesOrderId = '';
      this.deliveryNumber = `DEL-${Date.now()}`;
      this.vehicleNumber = null;
      this.completedAt = null;
    }

    this.departure = null;
    this.arrival = null;
    this.currentLat = null;
    this.currentLng = null;
    this.createdAt = _time.now();
    this.updatedAt = _time.now();
  }

  dispatch(): void {
    this.status = DeliveryStatus.DISPATCHED;
    this.departure = _time.now();
    this.updatedAt = _time.now();
  }

  updateLocation(lat: number, lng: number): void {
    this.currentLat = lat;
    this.currentLng = lng;
    this.status = DeliveryStatus.IN_TRANSIT;
    this.updatedAt = _time.now();
  }

  complete(): void {
    this.status = DeliveryStatus.DELIVERED;
    this.arrival = _time.now();
    this.completedAt = _time.now();
    this.updatedAt = _time.now();
  }

  fail(reason: string): void {
    this.status = DeliveryStatus.FAILED;
    this.updatedAt = _time.now();
  }

  assign(driverId: string, vehicleNumber: string): void {
    this.driverId = parseInt(driverId);
    this.vehicleNumber = vehicleNumber;
    this.status = DeliveryStatus.ASSIGNED;
    this.updatedAt = _time.now();
  }

  static create(orderId: number, driverId: number, vehicleId: string): Delivery {
    return new Delivery(orderId, driverId, vehicleId);
  }

  static createForSalesOrder(customerName: string, deliveryAddress: string): Delivery {
    return new Delivery(customerName, deliveryAddress);
  }
}
