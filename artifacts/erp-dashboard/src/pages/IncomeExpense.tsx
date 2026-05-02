import { useIncomeExpense } from "@/components/finance/income-expense/useIncomeExpense";
import { useTranslation } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Plus, FolderTree, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";

import { CategoryTree } from "@/components/finance/income-expense/CategoryTree";
import { SummaryCards } from "@/components/finance/income-expense/SummaryCards";
import { TransactionDialog } from "@/components/finance/income-expense/TransactionDialog";
import { CategoryDialog } from "@/components/finance/income-expense/CategoryDialog";
import { TransactionFilters } from "@/components/finance/income-expense/TransactionFilters";
import { TransactionTable } from "@/components/finance/income-expense/TransactionTable";

export default function IncomeExpense() {
  const { t } = useTranslation("finance");
  const { t: tCommon } = useTranslation("common");
  
  const {
    activeTab,
    setActiveTab,
    transactionDialogOpen,
    setTransactionDialogOpen,
    categoryDialogOpen,
    setCategoryDialogOpen,
    editingCategory,
    setEditingCategory,
    filters,
    setFilters,
    summary,
    summaryLoading,
    isError,
    refetch,
    categories,
    categoriesLoading,
    transactions,
    transactionsLoading,
    transactionForm,
    categoryForm,
    createTransactionMutation,
    handleEditCategory,
    handleCategorySubmit,
    incomeCategories,
    expenseCategories,
    createCategoryMutation,
    updateCategoryMutation,
  } = useIncomeExpense();

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="income-expense-page">
      <div className="border-b bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">
                  {t("inflow")} / {t("outflow")}
                </h1>
                <p className="text-indigo-100 text-sm">{t("incomeExpense")}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                data-testid="button-add-transaction"
                onClick={() => setTransactionDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tCommon("create")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <SummaryCards summary={summary} loading={summaryLoading} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              {t("transactions")}
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              {t("category")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{t("incomeExpense")}</CardTitle>
                    <CardDescription>{t("transactions")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionFilters
                  filters={filters}
                  setFilters={setFilters}
                  categories={categories}
                />

                {transactionsLoading ? (
                  <div className="space-y-2">
                    {([...Array(5)]).map((_, i) => (
                      <Skeleton key={`k-${i}`} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <TransactionTable
                    transactions={transactions}
                    categories={categories}
                    loading={transactionsLoading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Button
                data-testid="button-add-category"
                onClick={() => {
                  setEditingCategory(null);
                  categoryForm.reset();
                  setCategoryDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tCommon("create")}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-income-categories">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-lg">
                      {t("inflow")} - {t("category")}
                    </CardTitle>
                  </div>
                  <CardDescription>{t("revenue")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="space-y-2">
                      {([...Array(3)]).map((_, i) => (
                        <Skeleton key={`k-${i}`} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : incomeCategories.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{tCommon("noData")}</p>
                    </div>
                  ) : (
                    <CategoryTree
                      categories={incomeCategories}
                      parentId={null}
                      onEdit={handleEditCategory}
                    />
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-expense-categories">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    <CardTitle className="text-lg">
                      {t("outflow")} - {t("category")}
                    </CardTitle>
                  </div>
                  <CardDescription>{t("expenses")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="space-y-2">
                      {([...Array(3)]).map((_, i) => (
                        <Skeleton key={`k-${i}`} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : expenseCategories.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{tCommon("noData")}</p>
                    </div>
                  ) : (
                    <CategoryTree
                      categories={expenseCategories}
                      parentId={null}
                      onEdit={handleEditCategory}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        form={transactionForm}
        onSubmit={(data) => createTransactionMutation.mutate(data)}
        isPending={createTransactionMutation.isPending}
        categories={categories}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            categoryForm.reset();
          }
        }}
        form={categoryForm}
        onSubmit={handleCategorySubmit}
        isPending={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        editingCategory={editingCategory}
        categories={categories}
      />
    </div>
  );
}
