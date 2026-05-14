/**
 * @module LeaveTabTypes
 * @description Interfaces, types, and constants for LeaveTab.
 */

import type { LeaveRequest, SickLeaveRecord, BusinessTrip, TranslationFn } from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";

export type { LeaveRequest, SickLeaveRecord, BusinessTrip, TranslationFn };

export interface LeaveRequestForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface SickLeaveForm {
  startDate: string;
  endDate: string;
  diagnosis: string;
  hospitalName: string;
  doctorName: string;
  documentNumber: string;
  isPaid: boolean;
  paymentPercent: string;
}

export interface BusinessTripForm {
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  dailyAllowance: string;
  transportCost: string;
  accommodationCost: string;
}

export interface LeaveTabProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  leaveRequests: LeaveRequest[] | undefined;
  loadingLeaveRequests: boolean;
  leaveRequestDialogOpen: boolean;
  setLeaveRequestDialogOpen: (open: boolean) => void;
  leaveRequestForm: LeaveRequestForm;
  setLeaveRequestForm: (form: LeaveRequestForm) => void;
  saveLeaveRequestMutation: UseMutationResult<unknown, Error, unknown, unknown>;
  sickLeaves: SickLeaveRecord[] | undefined;
  loadingSickLeaves: boolean;
  sickLeaveDialogOpen: boolean;
  setSickLeaveDialogOpen: (open: boolean) => void;
  sickLeaveForm: SickLeaveForm;
  setSickLeaveForm: (form: SickLeaveForm) => void;
  saveSickLeaveMutation: UseMutationResult<unknown, Error, unknown, unknown>;
  businessTrips: BusinessTrip[] | undefined;
  loadingBusinessTrips: boolean;
  businessTripDialogOpen: boolean;
  setBusinessTripDialogOpen: (open: boolean) => void;
  businessTripForm: BusinessTripForm;
  setBusinessTripForm: (form: BusinessTripForm) => void;
  saveBusinessTripMutation: UseMutationResult<unknown, Error, unknown, unknown>;
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Yillik ta'til",
  sick: "Kasallik",
  unpaid: "Haq to'lanmaydigan",
  maternity: "Ona tug'ruq",
  paternity: "Ota tug'ruq",
  study: "O'quv ta'tili",
};
