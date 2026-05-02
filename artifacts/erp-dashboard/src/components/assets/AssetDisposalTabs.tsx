import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { ArrowRightLeft, Bell, ShieldCheck, Trash2 } from "lucide-react";
import { disposalMethodLabels } from "@/components/assets/helpers";
import type { DisposalRecord, InsuranceRecord, TransferRecord } from "@/components/assets/types";

interface DisposalTabProps {
  disposals: DisposalRecord[];
  disposalsLoading: boolean;
}

export function DisposalTab({ disposals, disposalsLoading }: DisposalTabProps) {
  const { t } = useTranslation('mro');

  return (
    <TabsContent value="disposal" className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("cardDisposalTotal")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{disposals.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("cardDisposalIncome")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{formatCurrency((Array.isArray(disposals) ? disposals : []).reduce((s, d) => s + Number(d.disposalValue || 0), 0))}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t("cardDisposalGainLoss")}</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(disposals ?? []).reduce((s, d) => s + Number(d.gainLoss || 0), 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency((Array.isArray(disposals) ? disposals : []).reduce((s, d) => s + Number(d.gainLoss || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("disposalHistory")}</CardTitle>
          <CardDescription>{t("disposalHistoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {disposalsLoading ? (
            <div className="space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}</div>
          ) : disposals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("noDisposalRecords")}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t("colAssetId")}</TableHead>
                    <TableHead>{t("colMethod")}</TableHead>
                    <TableHead>{t("colDate")}</TableHead>
                    <TableHead className="text-right">{t("colDisposalValue")}</TableHead>
                    <TableHead className="text-right">{t("colBookValue")}</TableHead>
                    <TableHead className="text-right">{t("colGainLoss")}</TableHead>
                    <TableHead>{t("colReason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(disposals) ? disposals : []).map((disposal, index) => (
                    <TableRow key={disposal.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`row-disposal-${disposal.id}`}>
                      <TableCell className="font-medium">#{disposal.assetId}</TableCell>
                      <TableCell><Badge variant="outline">{t(disposalMethodLabels[disposal.disposalMethod] || disposal.disposalMethod)}</Badge></TableCell>
                      <TableCell>{formatDate(disposal.disposalDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(disposal.disposalValue || 0))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(disposal.bookValueAtDisposal || 0))}</TableCell>
                      <TableCell className="text-right">
                        <span className={Number(disposal.gainLoss) >= 0 ? "text-green-500" : "text-red-500"}>
                          {Number(disposal.gainLoss) >= 0 ? "+" : ""}{formatCurrency(Number(disposal.gainLoss || 0))}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{disposal.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

interface TransferTabProps {
  transfers: TransferRecord[];
  transfersLoading: boolean;
  setTransferForm: React.Dispatch<React.SetStateAction<{
    assetId: number; fromLocation: string; toLocation: string; transferDate: string;
    toDepartmentId: number; reason: string; notes: string;
  }>>;
  emptyTransferForm: { assetId: number; fromLocation: string; toLocation: string; transferDate: string; toDepartmentId: number; reason: string; notes: string };
  setIsTransferOpen: (v: boolean) => void;
}

export function TransferTab({ transfers, transfersLoading, setTransferForm, emptyTransferForm, setIsTransferOpen }: TransferTabProps) {
  const { t } = useTranslation('mro');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="transfer" className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{t("transferHistory")}</CardTitle>
              <CardDescription>{t("transferHistoryDesc")}</CardDescription>
            </div>
            <Button onClick={() => { setTransferForm(emptyTransferForm); setIsTransferOpen(true); }} data-testid="button-new-transfer">
              <ArrowRightLeft className="h-4 w-4 mr-2" />{t('newTransfer')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transfersLoading ? (
            <div className="space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}</div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("noTransferRecords")}</p>
              <p className="text-sm mt-1">{t("transferHint")}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t("colAssetId")}</TableHead>
                    <TableHead>{t("colDate")}</TableHead>
                    <TableHead>{t("colFrom")}</TableHead>
                    <TableHead>{t("colTo")}</TableHead>
                    <TableHead>{t("colTransferredBy")}</TableHead>
                    <TableHead>{t("colReceivedBy")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                    <TableHead>{t("colReason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(transfers) ? transfers : []).map((tr, index) => (
                    <TableRow key={tr.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`row-transfer-${tr.id}`}>
                      <TableCell className="font-medium">#{tr.assetId}</TableCell>
                      <TableCell>{formatDate(tr.transferDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tr.fromLocation || (tr.fromDepartmentId ? `Bo'lim #${tr.fromDepartmentId}` : "-")}</TableCell>
                      <TableCell className="text-sm">{tr.toLocation || (tr.toDepartmentId ? `Bo'lim #${tr.toDepartmentId}` : "-")}</TableCell>
                      <TableCell className="text-sm">{tr.transferredBy || "-"}</TableCell>
                      <TableCell className="text-sm">{tr.receivedBy || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={tr.status === "completed" ? "default" : tr.status === "pending" ? "secondary" : "outline"}>
                          {tr.status === "completed" ? t("transferStatusCompleted") : tr.status === "pending" ? t("transferStatusPending") : tr.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tr.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

interface InsuranceTabProps {
  insuranceRecords: InsuranceRecord[];
  expiringInsurance: InsuranceRecord[];
  insuranceLoading: boolean;
  setInsuranceForm: React.Dispatch<React.SetStateAction<{
    assetId: number; policyNumber: string; insurerName: string; coverageType: string;
    startDate: string; endDate: string; premiumAmount: number; coverageAmount: number;
    contactInfo: string; notes: string;
  }>>;
  emptyInsuranceForm: { assetId: number; policyNumber: string; insurerName: string; coverageType: string; startDate: string; endDate: string; premiumAmount: number; coverageAmount: number; contactInfo: string; notes: string };
  setIsInsuranceOpen: (v: boolean) => void;
}

export function InsuranceTab({ insuranceRecords, expiringInsurance, insuranceLoading, setInsuranceForm, emptyInsuranceForm, setIsInsuranceOpen }: InsuranceTabProps) {
  const { t } = useTranslation('mro');
  const { t: tCommon } = useTranslation('common');

  return (
    <TabsContent value="insurance" className="space-y-4 mt-4">
      {expiringInsurance.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />Muddati yaqinlashayotgan sug'urtalar ({expiringInsurance.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(expiringInsurance) ? expiringInsurance : []).map((ins) => (
                <Badge key={ins.id} variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400">
                  #{ins.assetId} — {ins.policyNumber} ({formatDate(ins.endDate)})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{t("insuranceRecords")}</CardTitle>
              <CardDescription>{t("insuranceRecordsDesc")}</CardDescription>
            </div>
            <Button onClick={() => { setInsuranceForm(emptyInsuranceForm); setIsInsuranceOpen(true); }} data-testid="button-new-insurance">
              <ShieldCheck className="h-4 w-4 mr-2" />{t('newInsurance')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {insuranceLoading ? (
            <div className="space-y-2">{([...Array(5)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-12 w-full" />)}</div>
          ) : insuranceRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("noInsuranceRecords")}</p>
              <p className="text-sm mt-1">{t("insuranceHint")}</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t("colAssetId")}</TableHead>
                    <TableHead>{t("colPolicyNumber")}</TableHead>
                    <TableHead>{t("colInsurer")}</TableHead>
                    <TableHead>{tCommon("type")}</TableHead>
                    <TableHead>{t("colStartDate")}</TableHead>
                    <TableHead>{t("colEndDate")}</TableHead>
                    <TableHead className="text-right">{t("colPremium")}</TableHead>
                    <TableHead className="text-right">{t("colCoverage")}</TableHead>
                    <TableHead>{tCommon("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(insuranceRecords) ? insuranceRecords : []).map((ins, index) => (
                    <TableRow key={ins.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"} data-testid={`row-insurance-${ins.id}`}>
                      <TableCell className="font-medium">#{ins.assetId}</TableCell>
                      <TableCell className="font-mono text-sm">{ins.policyNumber}</TableCell>
                      <TableCell>{ins.insurerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ins.coverageType === "comprehensive" ? t("coverageComprehensiveShort") : ins.coverageType === "third_party" ? t("coverageThirdPartyShort") : ins.coverageType === "fire" ? t("coverageFireShort") : ins.coverageType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(ins.startDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(ins.endDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(ins.premiumAmount || 0))}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(ins.coverageAmount || 0))}</TableCell>
                      <TableCell>
                        <Badge variant={ins.status === "active" ? "default" : ins.status === "expired" ? "destructive" : "secondary"}>
                          {ins.status === "active" ? t("insuranceStatusActive") : ins.status === "expired" ? t("insuranceStatusExpired") : ins.status === "cancelled" ? t("insuranceStatusCancelled") : ins.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
