/**
 * @module constants
 * @description React UI component.
 */

import { 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  FileText, 
  Calculator, 
  Warehouse, 
  ClipboardCheck 
} from "lucide-react";
import { Step } from "./types";

export const STEPS: Step[] = [
  { id: 1, icon: FileText, key: "step1" },
  { id: 2, icon: Package, key: "step2" },
  { id: 3, icon: Calculator, key: "step3" },
  { id: 4, icon: Warehouse, key: "step4" },
  { id: 5, icon: ClipboardCheck, key: "step5" },
];
