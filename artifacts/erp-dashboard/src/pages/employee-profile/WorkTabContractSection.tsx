/**
 * @module WorkTabContractSection
 * @description ContractSection component: renders the employment-contracts card
 * with the "Add contract" dialog trigger and the inline list of existing
 * contracts.  Each contract is rendered via ContractCard (WorkTabTables).
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { EmploymentContract, ContractForm, TranslationFn } from "./WorkTabTypes";
import { ContractCard } from "./WorkTabTables";

interface ContractSectionProps {
  t: TranslationFn & ((key: string) => string);
  tCommon: TranslationFn;
  contractDialogOpen: boolean;
  setContractDialogOpen: (open: boolean) => void;
  contractForm: ContractForm;
  setContractForm: (form: ContractForm) => void;
  saveContractMutation: UseMutationResult<unknown, Error, ContractForm, unknown>;
  loadingContracts: boolean;
  contracts: EmploymentContract[] | undefined;
}

export function ContractSection({ t, tCommon, contractDialogOpen, setContractDialogOpen, contractForm, setContractForm, saveContractMutation, loadingContracts, contracts, }: ContractSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("employmentContracts")}
          </CardTitle>
          <CardDescription>{t("employeeDetails")}</CardDescription>
        </div>

        <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-contract">
              <Plus className="h-4 w-4 mr-2" />
              {t("newContract")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("newContract")}</DialogTitle>
              <DialogDescription>{t("employeeDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("contractNumber")}</Label>
                  <Input
                    value={contractForm.contractNumber}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, contractNumber: e.target.value })
                    }
                    placeholder="SH-001"
                    data-testid="input-contract-number"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("contractType")}</Label>
                  <Select
                    value={contractForm.contractType}
                    onValueChange={(value) =>
                      setContractForm({ ...contractForm, contractType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-contract-type" className="h-9">
                      <SelectValue placeholder={tCommon("select")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinite">{t("muddatsiz")}</SelectItem>
                      <SelectItem value="fixed_term">{t("muddatli")}</SelectItem>
                      <SelectItem value="probation">{t("sinovMuddati")}</SelectItem>
                      <SelectItem value="project">{t("loyihaAsosida")}</SelectItem>
                      <SelectItem value="seasonal">{t("seasonal")}</SelectItem>
                      <SelectItem value="part_time">{t("partTime")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("startDate")}</Label>
                  <Input
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, startDate: e.target.value })
                    }
                    data-testid="input-contract-start"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("endDate")}</Label>
                  <Input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, endDate: e.target.value })
                    }
                    data-testid="input-contract-end"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("salary")}</Label>
                  <Input
                    type="number"
                    value={contractForm.salary}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, salary: e.target.value })
                    }
                    placeholder="5000000"
                    data-testid="input-contract-salary"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("workSchedule")}</Label>
                  <Input
                    value={contractForm.workSchedule}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, workSchedule: e.target.value })
                    }
                    placeholder="09:00 - 18:00"
                    data-testid="input-contract-schedule"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => saveContractMutation.mutate(contractForm)}
                disabled={
                  saveContractMutation.isPending ||
                  !contractForm.contractNumber ||
                  !contractForm.startDate
                }
                data-testid="button-save-contract"
              >
                {saveContractMutation.isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loadingContracts ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : contracts && contracts.length > 0 ? (
          <div className="space-y-3">
            {(Array.isArray(contracts) ? contracts : []).map(
              (contract: EmploymentContract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  t={t}
                  tCommon={tCommon}
                />
              )
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {tCommon("noData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
