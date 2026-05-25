/**
 * @module material.aggregate
 * @description Material aggregate root. Encapsulates stock invariants
 * (currentStock >= 0, addStock/consumeStock business rules) and emits
 * domain events on stock movements. Constructed via `Material.create()`
 * for new instances or `new Material(...)` for repository hydration.
 *
 * PA0-8 — Rewritten from an anemic public-field bag into a proper DDD
 * aggregate with private state, getters, factory, and Result-returning
 * business methods.
 */

import { Result, Ok, Err } from '@common/types/result.type';
import { AppErr } from '@common/result';
import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { MaterialStockAddedEvent } from '../events/material-stock-added.event';
import { MaterialStockConsumedEvent } from '../events/material-stock-consumed.event';

export interface MaterialProps {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  minStock: number;
  maxStock: number;
  unitCost: number;
  currentStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  reservedQuantity?: number;
}

export class Material extends AggregateRoot {
  private _id: string;
  private _materialCode: string;
  private _name: string;
  private _category: string;
  private _unitOfMeasure: string;
  private _minStock: number;
  private _maxStock: number;
  private _unitCost: number;
  private _currentStock: number;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _reservedQuantity: number;

  /**
   * Positional constructor kept for repository hydration paths that already
   * pass raw DB values in order. New code should prefer `Material.create()`.
   */
  constructor(
    id: string,
    materialCode: string,
    name: string,
    category: string,
    unitOfMeasure: string,
    minStock: number,
    maxStock: number,
    unitCost: number,
    currentStock: number,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    reservedQuantity: number = 0,
  ) {
    super();
    this._id = id;
    this._materialCode = materialCode;
    this._name = name;
    this._category = category;
    this._unitOfMeasure = unitOfMeasure;
    this._minStock = minStock;
    this._maxStock = maxStock;
    this._unitCost = unitCost;
    this._currentStock = currentStock;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._reservedQuantity = reservedQuantity;
  }

  /**
   * Factory method — validates invariants and returns Err on violation.
   * Use this for new aggregates; repositories hydrating from DB should use
   * the positional constructor.
   */
  static create(props: MaterialProps): Result<Material> {
    if (!props.id || props.id.trim() === '') {
      return Err(AppErr('VALIDATION', 'Material id is required'));
    }
    if (!props.materialCode || props.materialCode.trim() === '') {
      return Err(AppErr('VALIDATION', 'Material code is required'));
    }
    if (props.minStock < 0) {
      return Err(AppErr('VALIDATION', 'minStock cannot be negative'));
    }
    if (props.maxStock < props.minStock) {
      return Err(AppErr('VALIDATION', 'maxStock must be >= minStock'));
    }
    if (props.unitCost < 0) {
      return Err(AppErr('VALIDATION', 'unitCost cannot be negative'));
    }
    if (props.currentStock < 0) {
      return Err(AppErr('VALIDATION', 'currentStock cannot be negative'));
    }
    return Ok(new Material(
      props.id,
      props.materialCode,
      props.name,
      props.category,
      props.unitOfMeasure,
      props.minStock,
      props.maxStock,
      props.unitCost,
      props.currentStock,
      props.isActive,
      props.createdAt,
      props.updatedAt,
      props.reservedQuantity ?? 0,
    ));
  }

  // -- Getters (replace former public fields) --

  get id(): string { return this._id; }
  get materialCode(): string { return this._materialCode; }
  get name(): string { return this._name; }
  get category(): string { return this._category; }
  get unitOfMeasure(): string { return this._unitOfMeasure; }
  get minStock(): number { return this._minStock; }
  get maxStock(): number { return this._maxStock; }
  get unitCost(): number { return this._unitCost; }
  get currentStock(): number { return this._currentStock; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get reservedQuantity(): number { return this._reservedQuantity; }

  get isLowStock(): boolean {
    return this._currentStock < this._minStock;
  }

  get isOverStock(): boolean {
    return this._currentStock > this._maxStock;
  }

  get availableStock(): number {
    return Math.max(0, this._currentStock - this._reservedQuantity);
  }

  // -- Business methods --

  /**
   * Add stock. Quantity must be > 0. Emits MaterialStockAddedEvent.
   */
  addStock(quantity: number): Result<void> {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Err(AppErr('INVALID_QUANTITY', 'addStock quantity must be > 0'));
    }
    this._currentStock += quantity;
    this._updatedAt = new Date();
    this.addDomainEvent(
      new MaterialStockAddedEvent(this._id, quantity, this._currentStock),
    );
    return Ok();
  }

  /**
   * Consume stock. Quantity must be > 0 and <= currentStock.
   * Emits MaterialStockConsumedEvent.
   */
  consumeStock(quantity: number): Result<void> {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Err(AppErr('INVALID_QUANTITY', 'consumeStock quantity must be > 0'));
    }
    if (quantity > this._currentStock) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Insufficient stock: requested ${quantity}, available ${this._currentStock}`,
      ));
    }
    this._currentStock -= quantity;
    this._updatedAt = new Date();
    this.addDomainEvent(
      new MaterialStockConsumedEvent(this._id, quantity, this._currentStock),
    );
    return Ok();
  }

  /**
   * Reserve stock for a pending order. Quantity must be > 0 and the new
   * reservation total must not exceed currentStock.
   */
  reserve(quantity: number): Result<void> {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Err(AppErr('INVALID_QUANTITY', 'reserve quantity must be > 0'));
    }
    if (this._reservedQuantity + quantity > this._currentStock) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Insufficient stock to reserve: requested ${quantity}, available ${this._currentStock - this._reservedQuantity}`,
      ));
    }
    this._reservedQuantity += quantity;
    this._updatedAt = new Date();
    return Ok();
  }

  /**
   * Release a previously reserved quantity (e.g. on order cancellation).
   */
  releaseReservation(quantity: number): Result<void> {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Err(AppErr('INVALID_QUANTITY', 'releaseReservation quantity must be > 0'));
    }
    if (quantity > this._reservedQuantity) {
      return Err(AppErr(
        'BUSINESS_RULE_VIOLATION',
        `Cannot release more than reserved: requested ${quantity}, reserved ${this._reservedQuantity}`,
      ));
    }
    this._reservedQuantity -= quantity;
    this._updatedAt = new Date();
    return Ok();
  }
}
