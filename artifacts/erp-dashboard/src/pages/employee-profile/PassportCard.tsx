/**
 * @module PassportCard
 * @description Card component that displays passport data and provides an
 * inline Dialog for adding or editing the employee's passport information.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdCard, Edit, Plus } from "lucide-react";
import type { PassportCardProps } from "./PersonalTabTypes";
import { RoleGate, PII_VIEWER_ROLES } from "@/components/RoleGate";

export function PassportCard({ t, tCommon, passportData, loadingPassport, passportDialogOpen, setPassportDialogOpen, passportForm, setPassportForm, savePassportMutation, ownerUserId, }: PassportCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          {t("passportInfo")}
        </CardTitle>
        <Dialog open={passportDialogOpen} onOpenChange={setPassportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-edit-passport">
              {passportData ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-[18px] font-semibold">{t("passportInfo")}</DialogTitle>
              <DialogDescription>{t("employeeDetails")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("passportSeries")}</Label>
                  <Input
                    value={passportForm.passportSeries}
                    onChange={(e) => setPassportForm({ ...passportForm, passportSeries: e.target.value })}
                    placeholder="AA"
                    data-testid="input-passport-series"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("passportNumber")}</Label>
                  <Input
                    value={passportForm.passportNumber}
                    onChange={(e) => setPassportForm({ ...passportForm, passportNumber: e.target.value })}
                    placeholder="1234567"
                    data-testid="input-passport-number"
                  />
                </div>
              </div>
              <div className="space-y-1">
          <Label>{t("issuedBy")}</Label>
                <Input
                  value={passportForm.issuedBy}
                  onChange={(e) => setPassportForm({ ...passportForm, issuedBy: e.target.value })}
                  placeholder="IIV"
                  data-testid="input-passport-issued-by"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
          <Label>{t("issuedDate")}</Label>
                  <Input
                    type="date"
                    value={passportForm.issuedDate}
                    onChange={(e) => setPassportForm({ ...passportForm, issuedDate: e.target.value })}
                    data-testid="input-passport-issued-date"
                  />
                </div>
                <div className="space-y-1">
          <Label>{t("expiryDate")}</Label>
                  <Input
                    type="date"
                    value={passportForm.expiryDate}
                    onChange={(e) => setPassportForm({ ...passportForm, expiryDate: e.target.value })}
                    data-testid="input-passport-expiry-date"
                  />
                </div>
              </div>
              <div className="space-y-1">
          <Label>{t("birthPlace")}</Label>
                <Input
                  value={passportForm.birthPlace}
                  onChange={(e) => setPassportForm({ ...passportForm, birthPlace: e.target.value })}
                  placeholder={t("toshkentShahri")}
                  data-testid="input-passport-birth-place"
                />
              </div>
              <div className="space-y-1">
          <Label>{t("citizenship")}</Label>
                <Input
                  value={passportForm.citizenship}
                  onChange={(e) => setPassportForm({ ...passportForm, citizenship: e.target.value })}
                  placeholder={t("uzbekistan")}
                  data-testid="input-passport-citizenship"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => savePassportMutation.mutate(passportForm)}
                disabled={savePassportMutation.isPending || !passportForm.passportNumber}
                data-testid="button-save-passport"
              >
                {savePassportMutation.isPending ? tCommon("loading") : tCommon("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loadingPassport ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
        ) : passportData ? (
          <RoleGate
            roles={PII_VIEWER_ROLES}
            ownerUserId={ownerUserId}
            fallback={
              <div className="text-muted-foreground text-center py-8" data-testid="passport-masked">
                <p className="text-sm">Pasport ma'lumotlari maxfiy</p>
                <p className="text-xs mt-1">Faqat HR ko'ra oladi</p>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="passport-data">
              <div>
                <p className="text-sm text-muted-foreground">{t("passportSeries")}</p>
                <p className="font-medium">{passportData.passportSeries} {passportData.passportNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("issuedBy")}</p>
                <p className="font-medium">{passportData.issuedBy || tCommon("notSpecified")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("issuedDate")}</p>
                <p className="font-medium">{passportData.issuedDate || tCommon("notSpecified")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("expiryDate")}</p>
                <p className="font-medium">{passportData.expiryDate || tCommon("notSpecified")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("birthPlace")}</p>
                <p className="font-medium">{passportData.birthPlace || tCommon("notSpecified")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("citizenship")}</p>
                <p className="font-medium">{passportData.citizenship || "Uzbekistan"}</p>
              </div>
            </div>
          </RoleGate>
        ) : (
          <p className="text-muted-foreground text-center py-8">{tCommon("noData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
