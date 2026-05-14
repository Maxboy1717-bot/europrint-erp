/**
 * @module PersonalTabTypes
 * @description Shared TypeScript interfaces and form-shape types for the
 * PersonalTab feature. No JSX — import freely from .ts and .tsx files alike.
 */

import type { UseMutationResult } from "@tanstack/react-query";
import type {
  Employee,
  PassportData,
  BankAccount,
  EmergencyContact,
  TranslationFn,
} from "./profile-types";

// ---------------------------------------------------------------------------
// Form shapes
// ---------------------------------------------------------------------------

export interface PassportForm {
  passportNumber: string;
  passportSeries: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  birthPlace: string;
  citizenship: string;
}

export interface BankForm {
  bankName: string;
  accountNumber: string;
  cardNumber: string;
  cardHolderName: string;
  mfo: string;
  inn: string;
  isPrimary: boolean;
}

export interface EmergencyForm {
  contactName: string;
  relationship: string;
  phoneNumber: string;
  alternativePhone: string;
  address: string;
  isPrimary: boolean;
}

// ---------------------------------------------------------------------------
// Main component props
// ---------------------------------------------------------------------------

export interface PersonalTabProps {
  employee: Employee;
  t: TranslationFn;
  tCommon: TranslationFn;

  // Passport
  passportData: PassportData | null | undefined;
  loadingPassport: boolean;
  passportDialogOpen: boolean;
  setPassportDialogOpen: (open: boolean) => void;
  passportForm: PassportForm;
  setPassportForm: (form: PassportForm) => void;
  savePassportMutation: UseMutationResult<unknown, Error, PassportForm, unknown>;

  // Bank accounts
  bankAccounts: BankAccount[] | undefined;
  loadingBanks: boolean;
  bankDialogOpen: boolean;
  setBankDialogOpen: (open: boolean) => void;
  bankForm: BankForm;
  setBankForm: (form: BankForm) => void;
  saveBankMutation: UseMutationResult<unknown, Error, BankForm, unknown>;

  // Emergency contacts
  emergencyContacts: EmergencyContact[] | undefined;
  loadingEmergency: boolean;
  emergencyDialogOpen: boolean;
  setEmergencyDialogOpen: (open: boolean) => void;
  emergencyForm: EmergencyForm;
  setEmergencyForm: (form: EmergencyForm) => void;
  saveEmergencyMutation: UseMutationResult<unknown, Error, EmergencyForm, unknown>;
}

// ---------------------------------------------------------------------------
// Prop sub-sets (passed to child components)
// ---------------------------------------------------------------------------

export interface SectionProps {
  employee: Employee;
  t: TranslationFn;
  tCommon: TranslationFn;
}

export interface PassportCardProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  passportData: PassportData | null | undefined;
  loadingPassport: boolean;
  passportDialogOpen: boolean;
  setPassportDialogOpen: (open: boolean) => void;
  passportForm: PassportForm;
  setPassportForm: (form: PassportForm) => void;
  savePassportMutation: UseMutationResult<unknown, Error, PassportForm, unknown>;
}

export interface BankCardProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  bankAccounts: BankAccount[] | undefined;
  loadingBanks: boolean;
  bankDialogOpen: boolean;
  setBankDialogOpen: (open: boolean) => void;
  bankForm: BankForm;
  setBankForm: (form: BankForm) => void;
  saveBankMutation: UseMutationResult<unknown, Error, BankForm, unknown>;
}

export interface EmergencyCardProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  emergencyContacts: EmergencyContact[] | undefined;
  loadingEmergency: boolean;
  emergencyDialogOpen: boolean;
  setEmergencyDialogOpen: (open: boolean) => void;
  emergencyForm: EmergencyForm;
  setEmergencyForm: (form: EmergencyForm) => void;
  saveEmergencyMutation: UseMutationResult<unknown, Error, EmergencyForm, unknown>;
}
