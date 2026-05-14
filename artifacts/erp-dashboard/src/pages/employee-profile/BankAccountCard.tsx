/**
 * @module BankAccountCard
 * @description Card component that lists the employee's bank accounts and
 * provides an inline Dialog for adding a new bank account.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Plus } from "lucide-react";
import type { BankAccount } from "./profile-types";
import type { BankCardProps } from "./PersonalTabTypes";
import { EPStatusPill } from "@/components/ep";

export function BankAccountCard({ t, tCommon, bankAccounts, loadingBanks, bankDialogOpen, setBankDialogOpen, bankForm, setBankForm, saveBankMutation, }: BankCardProps) {
  const accounts = Array.isArray(bankAccounts) ? bankAccounts : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          {t("bankDetails")}
        </CardTitle>
        <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-bank">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("bankDetails")}</DialogTitle>
              <DialogDescription>{t("employeeDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
          <Label>{t("bankName")}</Label>
                <Input
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder={t("xalqBanki")}
                  data-testid="input-bank-name"
                />
              </div>
              <div className="space-y-1">
          <Label>{t("accountNumber")}</Label>
                <Input
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="20208000..."
                  data-testid="input-account-number"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("cardNumber")}</Label>
                  <Input
                    value={bankForm.cardNumber}
                    onChange={(e) => setBankForm({ ...bankForm, cardNumber: e.target.value })}
                    placeholder="8600..."
                    data-testid="input-card-number"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("cardHolder")}</Label>
                  <Input
                    value={bankForm.cardHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, cardHolderName: e.target.value })}
                    placeholder={t("ismFamiliya")}
                    data-testid="input-card-holder"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>MFO</Label>
                  <Input
                    value={bankForm.mfo}
                    onChange={(e) => setBankForm({ ...bankForm, mfo: e.target.value })}
                    placeholder="00014"
                    data-testid="input-mfo"
                  />
                </div>
                <div className="space-y-1">
          <Label>INN</Label>
                  <Input
                    value={bankForm.inn}
                    onChange={(e) => setBankForm({ ...bankForm, inn: e.target.value })}
                    placeholder="123456789"
                    data-testid="input-inn"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => saveBankMutation.mutate(bankForm)}
                disabled={saveBankMutation.isPending || !bankForm.bankName || !bankForm.accountNumber}
                data-testid="button-save-bank"
              >
                {saveBankMutation.isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loadingBanks ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="space-y-4">
            {accounts.map((bank: BankAccount) => (
              <div key={bank.id} className="p-3 border rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{bank.bankName}</p>
                  {bank.isPrimary && <EPStatusPill tone="neutral">{tCommon("primary")}</EPStatusPill>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("accountNumber")}</p>
                    <p>{bank.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("cardNumber")}</p>
                    <p>{bank.cardNumber || tCommon("notSpecified")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MFO</p>
                    <p>{bank.mfo || tCommon("notSpecified")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">INN</p>
                    <p>{bank.inn || tCommon("notSpecified")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">{tCommon("noData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
