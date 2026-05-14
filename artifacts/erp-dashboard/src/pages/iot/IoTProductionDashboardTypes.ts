/**
 * @module IoTProductionDashboardTypes
 * @description Types and interfaces for IoTProductionDashboard.
 */

import { UseMutationResult } from "@tanstack/react-query";
import { ProductionSession, DowntimeReasonCode, IotLang } from "./iot-types";

export interface IoTProductionDashboardProps {
  lang: IotLang;
  setLang: (l: IotLang) => void;
  workerName: string;
  currentTime: string;
  activeSession: ProductionSession | null;
  shiftInfo: {
    name: string;
    nameRu: string;
    startTime: string;
    endTime: string;
    coWorkers?: { id: string; name: string }[];
  } | null;
  shiftRemaining: number;
  workerId: string;
  elapsedTime: number;
  setupTime: number;
  qcReminderVisible: boolean;
  energySaving: boolean;
  setEnergySaving: (v: boolean) => void;
  showSOSDialog: boolean;
  setShowSOSDialog: (v: boolean) => void;
  showHandoverDialog: boolean;
  setShowHandoverDialog: (v: boolean) => void;
  showQcFormDialog: boolean;
  setShowQcFormDialog: (v: boolean) => void;
  showDefectDialog: boolean;
  setShowDefectDialog: (v: boolean) => void;
  showDowntimeDialog: boolean;
  setShowDowntimeDialog: (v: boolean) => void;
  sosMessage: string;
  setSosMessage: (v: string) => void;
  sosType: "equipment" | "health" | "material" | "other";
  setSosType: (v: "equipment" | "health" | "material" | "other") => void;
  handleSOSSend: () => void;
  handoverNotes: {
    machineStatus: string;
    pendingTasks: string;
    qualityIssues: string;
    safetyNotes: string;
    materialStatus: string;
  };
  setHandoverNotes: (v: {
    machineStatus: string;
    pendingTasks: string;
    qualityIssues: string;
    safetyNotes: string;
    materialStatus: string;
  }) => void;
  handoverSignature: string;
  setHandoverSignature: (v: string) => void;
  qcSampleSize: string;
  setQcSampleSize: (v: string) => void;
  qcDefectCount: string;
  setQcDefectCount: (v: string) => void;
  qcNotes: string;
  setQcNotes: (v: string) => void;
  defectQty: string;
  setDefectQty: (v: string) => void;
  defectReason: string;
  setDefectReason: (v: string) => void;
  defectStage: string;
  setDefectStage: (v: string) => void;
  selectedReasonCode: string;
  setSelectedReasonCode: (v: string) => void;
  downtimeMinutes: string;
  setDowntimeMinutes: (v: string) => void;
  downtimeNotes: string;
  setDowntimeNotes: (v: string) => void;
  defectReasons: Array<{ code: string; labelUz: string; labelRu: string; stage: string }>;
  defectReasonsLoading: boolean;
  reasonCodes: DowntimeReasonCode[];
  selectedOrder: { orderNumber?: string; productName?: string } | null;
  selectedEquipment: { name?: string } | null;
  formatTime: (s: number) => string;
  formatEstimatedTime: (s: number) => string;
  startSession: UseMutationResult<ProductionSession, Error, void, unknown>;
  stopSession: UseMutationResult<unknown, Error, void, unknown>;
  reportDefect: UseMutationResult<void, Error, void, unknown>;
  submitHandover: UseMutationResult<void, Error, void, unknown>;
  submitInlineQC: UseMutationResult<void, Error, void, unknown>;
  reportDowntime: UseMutationResult<void, Error, void, unknown>;
}
