/**
 * @module ep
 * @description Barrel export for the EuroPrint design-system component
 *   library. Import directly from `@/components/ep` so consumers can pull
 *   multiple primitives in a single line:
 *
 *     import { EPCard, EPKpiCard, EPStatusPill, EPPageHeader } from "@/components/ep";
 *
 *   These components are the canonical way to express EuroPrint patterns —
 *   prefer them over ad-hoc <div className="rounded-lg border …"> across
 *   all 260+ ERP pages.
 */

export { EPCard, type EPModuleColor } from "./EPCard";
export { EPKpiCard } from "./EPKpiCard";
export { EPStatusPill, type EPStatusTone } from "./EPStatusPill";
export { EPPageHeader } from "./EPPageHeader";
export { EPErrorState } from "./EPErrorState";
export { EPEmptyState } from "./EPEmptyState";
export {
  EPSkeletonBar,
  EPSkeletonKpiRow,
  EPSkeletonTable,
  EPSkeletonCard,
} from "./EPSkeleton";
export { useCountUp } from "./useCountUp";
export { EPLoader, EPSpinnerBlock } from "./EPLoader";
export { EPComingSoon } from "./EPComingSoon";
export { EPNumberedSection } from "./EPNumberedSection";
