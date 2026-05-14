/**
 * @module BinsTabTypes
 * @description Types and interfaces for the BinsTab feature.
 */

export interface Bin360Data {
  bin: {
    id: string;
    binCode: string;
    fullAddress: string;
    warehouseName: string;
    zoneName: string;
    binType: string;
  };
  capacity: {
    maxWeight: number | null;
    maxVolume: number | null;
    currentOccupancy: number;
    occupancyStatus: string;
  };
  currentMaterials: {
    count: number;
    totalStockValue: number;
    items: Array<{
      id: string;
      kod: string;
      xomAshyo: string;
      currentStock: number;
      unitOfMeasure: string;
      expiryDate?: string;
      stockValue: number;
    }>;
  };
  expiryAlerts: {
    count: number;
    expired: number;
    expiringSoon: number;
    items: Array<{
      materialName: string;
      expiryDate?: string;
      daysUntilExpiry: number | null;
      quantity: number;
      unit: string;
      isExpired: boolean;
    }>;
  };
  recentMovements: {
    count: number;
    items: Array<{
      transactionType: string;
      quantity: number;
      transactionDate: string;
      materialName: string;
    }>;
  };
}
