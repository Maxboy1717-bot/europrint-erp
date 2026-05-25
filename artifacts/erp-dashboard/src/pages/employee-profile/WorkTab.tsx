/**
 * @module WorkTab
 * @description Orchestrator component for the Work tab of the employee profile
 * page.  Composes section and dialog sub-components; owns no local state of its
 * own — all state is lifted to the parent page and threaded in via WorkTabProps.
 */

import type { WorkTabProps } from "./WorkTabTypes";
import {
  OperatorProductionBlock,
  CurrentWorkplaceCard,
  CkpAttestationCard,
} from "./WorkTabSections";
import { ContractSection } from "./WorkTabContractSection";
import { SalarySection } from "./WorkTabDialogs";
import { TransfersCard } from "./WorkTabTables";

export function WorkTab({
  employee,
  t,
  tCommon,
  orgStructureData,
  calculateWorkExperience,
  contractDialogOpen,
  setContractDialogOpen,
  contractForm,
  setContractForm,
  saveContractMutation,
  loadingContracts,
  contracts,
  salaryDialogOpen,
  setSalaryDialogOpen,
  salaryForm,
  setSalaryForm,
  saveSalaryChangeMutation,
  loadingSalaryHistory,
  salaryHistory,
  transfers,
}: WorkTabProps) {
  return (
    <div className="space-y-6">
      {employee.is_machine_operator && (
        <OperatorProductionBlock employeeId={employee.id} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentWorkplaceCard
          employee={employee}
          t={t}
          tCommon={tCommon}
          orgStructureData={orgStructureData}
          calculateWorkExperience={calculateWorkExperience}
        />
        <CkpAttestationCard employee={employee} t={t} tCommon={tCommon} />
      </div>

      <ContractSection
        t={t}
        tCommon={tCommon}
        contractDialogOpen={contractDialogOpen}
        setContractDialogOpen={setContractDialogOpen}
        contractForm={contractForm}
        setContractForm={setContractForm}
        saveContractMutation={saveContractMutation}
        loadingContracts={loadingContracts}
        contracts={contracts}
      />

      <SalarySection
        t={t}
        tCommon={tCommon}
        salaryDialogOpen={salaryDialogOpen}
        setSalaryDialogOpen={setSalaryDialogOpen}
        salaryForm={salaryForm}
        setSalaryForm={setSalaryForm}
        saveSalaryChangeMutation={saveSalaryChangeMutation}
        loadingSalaryHistory={loadingSalaryHistory}
        salaryHistory={salaryHistory}
      />

      <TransfersCard t={t} tCommon={tCommon} transfers={transfers} />
    </div>
  );
}
