/**
 * @module PosMyInventory.types
 * @description Shared types for the PosMyInventory page and its sub-components.
 * Split from PosMyInventory.tsx (Rule 16).
 */

export interface InventoryItem {
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  givenQty: number;
  returnedQty: number;
  balance: number;
  totalValue: number;
}

export interface ReturnModalProps {
  item: InventoryItem;
  onClose: () => void;
  onDone: () => void;
  t: (k: string) => string;
}
