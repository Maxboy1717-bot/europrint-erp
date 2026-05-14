/**
 * @module RoutingConfigurationLabels
 * @description Pure helper that builds all i18n label bundles needed by the
 * Routing Configuration dialogs and card components. Extracted from the main
 * orchestrator to keep RoutingConfiguration.tsx under 300 lines.
 */

import type { CreateRoutingLabels } from "./RoutingConfigurationCreateDialog";
import type { ManageOperationsLabels } from "./RoutingConfigurationManageDialog";
import type { AddOperationLabels } from "./RoutingConfigurationDialogs";
import type { RoutingCardLabels } from "./RoutingConfigurationCard";

type TFn = (key: string) => string;

export interface RoutingLabelBundles {
  cardLabels: RoutingCardLabels;
  createRoutingLabels: CreateRoutingLabels;
  manageOpsLabels: ManageOperationsLabels;
  addOpLabels: AddOperationLabels;
}

/**
 * Builds all label bundles from the two i18n translation functions.
 * Call once per render; returns a stable plain object (no hooks needed here).
 */
export function buildRoutingLabels(t: TFn, tCommon: TFn): RoutingLabelBundles {
  const cardLabels: RoutingCardLabels = {
    version: tCommon("version"),
    effectiveFrom: t("effectiveFrom"),
    manageOperations: t("manageOperations"),
    operationSequence: t("operationSequence"),
    deleteRouting: t("deleteRouting"),
    deleteWarning: tCommon("deleteWarning"),
  };

  const createRoutingLabels: CreateRoutingLabels = {
    title: t("createNewRouting"),
    description: t("routingForProduct"),
    routingNumber: t("routingNumberLabel"),
    product: t("product"),
    version: tCommon("version"),
    status: tCommon("status"),
    effectiveFrom: t("effectiveFrom"),
    draft: tCommon("draft"),
    active: tCommon("active"),
    obsolete: t("obsolete"),
    cancel: tCommon("cancel"),
    save: tCommon("save"),
    saving: t("saving"),
    select: tCommon("select"),
  };

  const manageOpsLabels: ManageOperationsLabels = {
    manageOperations: t("manageOperations"),
    addOperation: t("addOperation"),
    workCenter: t("workCenter"),
    setupTime: t("setupTimeLabel"),
    machineTime: t("machineTimeLabel"),
    laborTime: t("laborTimeLabel"),
    deleteOperationTitle: "Operatsiyani o'chirish",
    deleteOperationDescription:
      "Ushbu ishlov operatsiyasini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.",
  };

  const addOpLabels: AddOperationLabels = {
    title: t("addOperation"),
    description: t("newOperationDesc"),
    operationNumber: t("operationNumber"),
    operationName: t("operationName"),
    workCenter: t("workCenter"),
    sequence: t("sequenceLabel"),
    setupTime: t("setupTimeLabel"),
    machineTime: t("machineTimeLabel"),
    laborTime: t("laborTimeLabel"),
    descriptionLabel: tCommon("description"),
    additionalInfo: t("additionalInfo"),
    cancel: tCommon("cancel"),
    save: tCommon("save"),
    saving: t("saving"),
    select: tCommon("select"),
  };

  return { cardLabels, createRoutingLabels, manageOpsLabels, addOpLabels };
}
