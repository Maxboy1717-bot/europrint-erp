/**
 * @module ChartOfAccountsDialogs
 * @description Dialog components for ChartOfAccounts page.
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { Plus } from "lucide-react";
import type { NewAccountForm } from "./ChartOfAccountsTypes";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newAccount: NewAccountForm;
  onNewAccountChange: (account: NewAccountForm) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  newAccount,
  onNewAccountChange,
  onConfirm,
  isPending,
}: CreateAccountDialogProps) {
  const { t } = useTranslation('finance');
  const { t: tCommon } = useTranslation('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-card/10 border-white/30 text-white hover:bg-card/20 gap-2"
          data-testid="button-add-account"
        >
          <Plus className="h-4 w-4" />
          {tCommon('create')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{tCommon('create')}</DialogTitle>
          <DialogDescription>
            {t('chartOfAccounts')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
          <Label htmlFor="accountNumber">{t('accountCode')}</Label>
            <Input
              id="accountNumber"
              value={newAccount.accountNumber}
              onChange={(e) => onNewAccountChange({ ...newAccount, accountNumber: e.target.value })}
              placeholder="Masalan: 1010"
              data-testid="input-account-number"
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="accountName">{t('accountName')}</Label>
            <Input
              id="accountName"
              value={newAccount.accountName}
              onChange={(e) => onNewAccountChange({ ...newAccount, accountName: e.target.value })}
              placeholder="Masalan: Kassa"
              data-testid="input-account-name"
            />
          </div>
          <div className="space-y-1">
          <Label htmlFor="accountType">{t('accountType')}</Label>
            <Select
              value={newAccount.accountType}
              onValueChange={(value) => onNewAccountChange({ ...newAccount, accountType: value })}
            >
              <SelectTrigger data-testid="select-account-type" className="h-9">
                <SelectValue placeholder={t('accountType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">{t('asset')}</SelectItem>
                <SelectItem value="liability">{t('liability')}</SelectItem>
                <SelectItem value="equity">{t('equity')}</SelectItem>
                <SelectItem value="revenue">{t('revenue')}</SelectItem>
                <SelectItem value="expense">{t('expenses')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            data-testid="button-create-account"
          >
            {isPending ? tCommon('loading') : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
