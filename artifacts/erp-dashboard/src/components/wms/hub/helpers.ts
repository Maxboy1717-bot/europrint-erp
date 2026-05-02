import { 
  Package, 
  ScrollText, 
  Boxes, 
  Factory, 
  Trash2, 
  ShieldCheck, 
  Wrench, 
  Beaker 
} from "lucide-react";

export const warehouseIcons: Record<string, typeof Package> = {
  "RM-MAIN":   Package,
  "RM-ROLLS":  ScrollText,
  "FG-MAIN":   Boxes,
  "WIP-MAIN":  Factory,
  "SCRAP-MAIN":Trash2,
  "SCRAP":     Trash2,
  "QC-HOLD":   ShieldCheck,
  "TOOL-MAIN": Wrench,
  "MRO-MAIN":  Wrench,
  "MRO-STORE": Beaker,
  "AUX-MAIN":  Beaker,
};

export const warehouseColors: Record<string, string> = {
  "RM-MAIN":   "from-blue-500 to-blue-600",
  "RM-ROLLS":  "from-indigo-500 to-indigo-600",
  "FG-MAIN":   "from-emerald-500 to-emerald-600",
  "WIP-MAIN":  "from-cyan-500 to-cyan-600",
  "SCRAP-MAIN":"from-red-500 to-red-600",
  "SCRAP":     "from-red-400 to-red-500",
  "QC-HOLD":   "from-orange-500 to-orange-600",
  "TOOL-MAIN": "from-yellow-500 to-yellow-600",
  "MRO-MAIN":  "from-amber-500 to-amber-600",
  "MRO-STORE": "from-purple-500 to-purple-600",
  "AUX-MAIN":  "from-purple-400 to-purple-500",
};

export function alertBadgeVariant(level: string) {
  switch (level) {
    case "GREEN": return "outline";
    case "YELLOW": return "secondary";
    case "RED": return "destructive";
    case "BLACK": return "destructive";
    default: return "outline";
  }
}

export function alertLabel(level: string) {
  switch (level) {
    case "GREEN": return "RUXSAT";
    case "YELLOW": return "OGOHLANTIRISH";
    case "RED": return "BLOKLASH";
    case "BLACK": return "XAVFLI";
    default: return level;
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case "AVAILABLE": return "Mavjud";
    case "QC_HOLD": return "QC kutilmoqda";
    case "RESERVED": return "Rezerv";
    case "PICKED": return "Tanlandi";
    case "CONSUMED": return "Sarflandi";
    case "SCRAPPED": return "Chiqindi";
    case "RETURNED": return "Qaytarildi";
    case "pending": return "Kutilmoqda";
    case "in_progress": return "Jarayonda";
    case "completed": return "Bajarildi";
    case "cancelled": return "Bekor";
    default: return status;
  }
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "AVAILABLE": return "bg-green-100 text-green-800 border-green-200";
    case "QC_HOLD": return "bg-amber-100 text-amber-800 border-amber-200";
    case "RESERVED": return "bg-blue-100 text-blue-800 border-blue-200";
    case "PICKED": case "in_progress": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "CONSUMED": case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "SCRAPPED": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-surface-container text-on-surface-variant border-outline-variant";
  }
}
