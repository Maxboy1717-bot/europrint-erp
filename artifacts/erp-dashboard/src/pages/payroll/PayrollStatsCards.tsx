import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";
import { FileText, Clock, CheckCircle2, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface PayrollStatsCardsProps {
  activeContracts: number;
  pendingCalcs: number;
  approvedCalcs: number;
  totalGross: number;
  contractsLoading: boolean;
  calculationsLoading: boolean;
}

export function PayrollStatsCards({
  activeContracts,
  pendingCalcs,
  approvedCalcs,
  totalGross,
  contractsLoading,
  calculationsLoading,
}: PayrollStatsCardsProps) {
  const { t: tFinance } = useTranslation('finance');

  const cards = [
    {
      title: tFinance('activeContracts'),
      value: activeContracts,
      loading: contractsLoading,
      icon: FileText,
      gradient: "from-indigo-600 to-indigo-500",
      iconColor: "text-indigo-200",
      textColor: "text-indigo-100",
      skeletonColor: "bg-indigo-400/30",
      testId: "card-active-contracts",
      formatValue: false,
    },
    {
      title: tFinance('pendingApproval'),
      value: pendingCalcs,
      loading: calculationsLoading,
      icon: Clock,
      gradient: "from-amber-600 to-amber-500",
      iconColor: "text-amber-200",
      textColor: "text-amber-100",
      skeletonColor: "bg-amber-400/30",
      testId: "card-pending-calcs",
      formatValue: false,
    },
    {
      title: tFinance('approved'),
      value: approvedCalcs,
      loading: calculationsLoading,
      icon: CheckCircle2,
      gradient: "from-green-600 to-green-500",
      iconColor: "text-green-200",
      textColor: "text-green-100",
      skeletonColor: "bg-green-400/30",
      testId: "card-approved-calcs",
      formatValue: false,
    },
    {
      title: tFinance('totalGross'),
      value: totalGross,
      loading: calculationsLoading,
      icon: Wallet,
      gradient: "from-purple-600 to-purple-500",
      iconColor: "text-purple-200",
      textColor: "text-purple-100",
      skeletonColor: "bg-purple-400/30",
      testId: "card-total-gross",
      formatValue: true,
    },
  ];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {(Array.isArray(cards) ? cards : []).map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.testId} className={`bg-gradient-to-br ${card.gradient} text-white border-0`} data-testid={card.testId}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${card.textColor}`}>{card.title}</CardTitle>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              {card.loading ? (
                <Skeleton className={`h-8 ${card.formatValue ? 'w-32' : 'w-16'} ${card.skeletonColor}`} />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.formatValue ? formatCurrency(card.value) : card.value}</div>
                  <p className={`text-xs ${card.textColor.replace('100', '200')} mt-1`}>{card.title}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
    </>
  );
}
