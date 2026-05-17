/**
 * @module PersonalTab
 * @description Orchestrator for the Personal tab on the employee profile page.
 * Delegates display to PersonalTabSections (read-only cards) and per-feature
 * Card components (PassportCard, BankAccountCard, EmergencyContactCard) for
 * the editable PII sections. All state + mutations are owned by the parent
 * and threaded in via PersonalTabProps.
 */

import type { PersonalTabProps } from "./PersonalTabTypes";
import {
  PersonalInfoCard,
  ContactInfoCard,
  WorkConditionsCard,
  FamilyInfoCard,
} from "./PersonalTabSections";
import { PassportCard } from "./PassportCard";
import { BankAccountCard } from "./BankAccountCard";
import { EmergencyContactCard } from "./EmergencyContactCard";

export function PersonalTab({
  employee, t, tCommon,
  passportData, loadingPassport, passportDialogOpen, setPassportDialogOpen,
  passportForm, setPassportForm, savePassportMutation,
  bankAccounts, loadingBanks, bankDialogOpen, setBankDialogOpen,
  bankForm, setBankForm, saveBankMutation,
  emergencyContacts, loadingEmergency, emergencyDialogOpen, setEmergencyDialogOpen,
  emergencyForm, setEmergencyForm, saveEmergencyMutation,
}: PersonalTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalInfoCard employee={employee} t={t} tCommon={tCommon} />
        <ContactInfoCard employee={employee} t={t} tCommon={tCommon} />
        <WorkConditionsCard employee={employee} t={t} tCommon={tCommon} />
        <FamilyInfoCard employee={employee} t={t} tCommon={tCommon} />

        <PassportCard
          t={t}
          tCommon={tCommon}
          passportData={passportData}
          loadingPassport={loadingPassport}
          passportDialogOpen={passportDialogOpen}
          setPassportDialogOpen={setPassportDialogOpen}
          passportForm={passportForm}
          setPassportForm={setPassportForm}
          savePassportMutation={savePassportMutation}
          ownerUserId={employee.id}
        />

        <BankAccountCard
          t={t}
          tCommon={tCommon}
          bankAccounts={bankAccounts}
          loadingBanks={loadingBanks}
          bankDialogOpen={bankDialogOpen}
          setBankDialogOpen={setBankDialogOpen}
          bankForm={bankForm}
          setBankForm={setBankForm}
          saveBankMutation={saveBankMutation}
          ownerUserId={employee.id}
        />

        <EmergencyContactCard
          t={t}
          tCommon={tCommon}
          emergencyContacts={emergencyContacts}
          loadingEmergency={loadingEmergency}
          emergencyDialogOpen={emergencyDialogOpen}
          setEmergencyDialogOpen={setEmergencyDialogOpen}
          emergencyForm={emergencyForm}
          setEmergencyForm={setEmergencyForm}
          saveEmergencyMutation={saveEmergencyMutation}
        />
      </div>
    </div>
  );
}
