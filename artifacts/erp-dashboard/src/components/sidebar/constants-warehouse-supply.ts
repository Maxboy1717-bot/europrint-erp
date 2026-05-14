/** @module constants-warehouse-supply @description Sidebar navigation constants for Warehouse/WMS (tz08) and Supply/Logistics (tz09) modules. */

import {
  BarChart3, Target, Package, ArrowRightLeft, PackageCheck, MessageSquare,
  ShieldCheck, FileText, ClipboardCheck, Barcode, ScrollText, Layers,
  Scale, Settings, Users, DollarSign, ShoppingCart, Truck, Zap, CreditCard,
  BadgeCheck, Globe, Navigation, Car, Map, Fuel, UserCog, Calendar,
} from "lucide-react";
import { MenuGroup } from "./types";

export const menuGroupsWarehouseSupply: Record<string, MenuGroup> = {
  tz08: {
    title: "Ombor",
    icon: Package,
    defaultUrl: "warehouse/hub",
    items: [
      // ── ASOSIY (Hub + per-warehouse) ──
      { title: "📊 OMBOR DASHBOARD", url: "", icon: BarChart3, separator: true },
      { title: "Ombor Hub (9 ombor)", url: "warehouse/hub", icon: BarChart3 },
      { title: "Real-time KPI", url: "wms/kpi-hub", icon: Target },
      { title: "Material 360°", url: "inventory/materials", icon: Package },

      // ── OPERATSIYALAR ──
      { title: "⚡ OPERATSIYALAR", url: "", icon: ArrowRightLeft, separator: true },
      { title: "Yangi Kirim (Wizard)", url: "wms/kirim-new", icon: PackageCheck },
      { title: "Ko'chirish Hujjatlari", url: "wms/transfer", icon: ArrowRightLeft },
      { title: "Ichki So'rovlar", url: "wms/internal-requests", icon: MessageSquare },

      // ── QC & KARANTIN ──
      { title: "🔬 QC & KARANTIN", url: "", icon: ShieldCheck, separator: true },
      { title: "Karantin Ro'yxati", url: "wms/quarantine", icon: ShieldCheck },
      { title: "QC Ko'rib chiqish", url: "wms/qc-review", icon: ShieldCheck },
      { title: "Inventar Pasportlari", url: "wms/passports", icon: FileText },

      // ── INVENTAR & BARKOD ──
      { title: "📦 INVENTAR & BARKOD", url: "", icon: ClipboardCheck, separator: true },
      { title: "Inventarizatsiya", url: "wms/inventory", icon: ClipboardCheck },
      { title: "Barkod Navbati", url: "wms/barcodes-queue", icon: Barcode },
      { title: "Roll boshqaruv (AI)", url: "warehouse/rolls", icon: ScrollText },

      // ── HISOBOTLAR & AUDIT ──
      { title: "📊 HISOBOTLAR", url: "", icon: BarChart3, separator: true },
      { title: "Hisobotlar Markazi (22)", url: "wms/reports", icon: BarChart3 },
      { title: "Material Balans", url: "wms/material-balance", icon: Layers },
      { title: "Ishlab Chiqarish Balansi", url: "wms/production-balance", icon: Scale },
      { title: "Audit Jurnali", url: "wms/audit-log", icon: ClipboardCheck },

      // ── BOSHQARUV ──
      { title: "⚙️ BOSHQARUV", url: "", icon: Settings, separator: true },
      { title: "Xodimlar", url: "wms/employee-inventory", icon: Users },
      { title: "Xabarnomalar", url: "wms/notifications", icon: MessageSquare },
      { title: "Tayyor Mahsulot Ijara", url: "wms/rental", icon: DollarSign },
    ],
  },
  tz09: {
    title: "Ta'minot",
    icon: Truck,
    defaultUrl: "mm/dashboard",
    items: [
      { title: "TA'MINOT", url: "", icon: ShoppingCart, separator: true },
      { title: "MM Dashboard", url: "mm/dashboard", icon: BarChart3 },
      { title: "Yetkazuvchilar", url: "mm/vendors", icon: Truck },
      { title: "Xarid Buyurtmalari", url: "mm/purchase-orders", icon: ShoppingCart },
      { title: "PUL NAZORATI", url: "", icon: DollarSign, separator: true },
      { title: "Xarajat Nazorati", url: "integration/expense-management", icon: DollarSign },
      { title: "Chek Bot", url: "mm/check-bot", icon: Zap },
      { title: "Kreditor Qarzlar", url: "mm/creditor-debts", icon: CreditCard },
      { title: "YETKAZUVCHI", url: "", icon: BadgeCheck, separator: true },
      { title: "Yetkazuvchi Baho", url: "integration/vendor-performance", icon: BadgeCheck },
      { title: "Supplier Portal", url: "mm/supplier-portal", icon: Globe },
      { title: "LOGISTIKA", url: "", icon: Navigation, separator: true },
      { title: "Transport Parki", url: "logistics/transport", icon: Car },
      { title: "Marshrut Rejalashtirish", url: "logistics/route-planning", icon: Map },
      { title: "GPS Monitoring", url: "logistics/gps", icon: Navigation },
      { title: "Yoqilg'i Nazorati", url: "logistics/fuel", icon: Fuel },
      { title: "HAYDOVCHI", url: "", icon: UserCog, separator: true },
      { title: "Haydovchi Boshqaruvi", url: "logistics/drivers", icon: UserCog },
      { title: "Mashina Jadvali", url: "logistics/vehicle-schedule", icon: Calendar },
    ],
  },
};
