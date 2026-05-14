/**
 * @module PersonalTab
 * @description Orchestrator component for the Personal tab of the Employee
 * Profile page. Composes display sections and dialog cards; owns no local
 * state — all state and mutations are threaded in via props from the parent
 * route component.
 */

import type { PersonalTabProps } from "./PersonalTabTypes";
import {
  PersonalInfoCard,
  ContactInfoCard,
  WorkConditionsCard,
  FamilyInfoCard,
} from "./PersonalTabSections";
import { PassportCard }          from "./PassportCard";
import { BankAccountCard }       from "./BankAccountCard";
import { EmergencyContactCard }  from "./EmergencyContactCard";

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
        <ContactInfoCard  employee={employee} t={t} tCommon={tCommon} />
        <WorkConditionsCard employee={employee} t={t} tCommon={tCommon} />
        <FamilyInfoCard   employee={employee} t={t} tCommon={tCommon} />

        <PassportCard
          t={t} tCommon={tCommon}
          passportData={passportData}
          loadingPassport={loadingPassport}
          passportDialogOpen={passportDialogOpen}
          setPassportDialogOpen={setPassportDialogOpen}
          passportForm={passportForm}
          setPassportForm={setPassportForm}
          savePassportMutation={savePassportMutation}
        />

        <BankAccountCard
          t={t} tCommon={tCommon}
          bankAccounts={bankAccounts}
          loadingBanks={loadingBanks}
          bankDialogOpen={bankDialogOpen}
          setBankDialogOpen={setBankDialogOpen}
          bankForm={bankForm}
          setBankForm={setBankForm}
          saveBankMutation={saveBankMutation}
        />

        <EmergencyContactCard
          t={t} tCommon={tCommon}
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
