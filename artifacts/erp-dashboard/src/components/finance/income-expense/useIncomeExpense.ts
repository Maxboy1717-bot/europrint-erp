import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FinanceCategory,
  IncomeExpenseTransaction,
  Summary,
  TransactionFormData,
  CategoryFormData,
  transactionFormSchema,
  categoryFormSchema,
} from "./types";

export function useIncomeExpense() {
  const { t: tCommon } = useTranslation("common");
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);

  const [filters, setFilters] = useState({
    type: "",
    categoryId: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    isError,
    refetch,
  } = useQuery<Summary>({
    queryKey: [
      "/api/finance-extended/income-expense/summary",
      filters.dateFrom,
      filters.dateTo,
    ],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    FinanceCategory[]
  >({
    queryKey: ["/api/finance-extended/finance-categories"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<
    IncomeExpenseTransaction[]
  >({
    queryKey: ["/api/finance-extended/income-expense", filters],
  });

  const transactionForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionType: "income",
      transactionDate: new Date().toISOString().split("T")[0],
      status: "draft",
      amount: 0,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      categoryType: "income",
      sortOrder: 0,
      isActive: true,
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      return apiRequest("POST", "/api/finance-extended/income-expense", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/finance-extended/income-expense"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/finance-extended/income-expense/summary"],
      });
      setTransactionDialogOpen(false);
      transactionForm.reset();
      toast({ title: tCommon("success"), description: tCommon("operationSuccess") });
    },
    onError: () => {
      toast({
        title: tCommon("error"),
        description: tCommon("operationFailed"),
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return apiRequest("POST", "/api/finance-extended/finance-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/finance-extended/finance-categories"],
      });
      setCategoryDialogOpen(false);
      categoryForm.reset();
      toast({ title: tCommon("success"), description: tCommon("operationSuccess") });
    },
    onError: () => {
      toast({
        title: tCommon("error"),
        description: tCommon("operationFailed"),
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CategoryFormData>;
    }) => {
      return apiRequest(
        "PATCH",
        `/api/finance-extended/finance-categories/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/finance-extended/finance-categories"],
      });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({ title: tCommon("success"), description: tCommon("operationSuccess") });
    },
    onError: () => {
      toast({
        title: tCommon("error"),
        description: tCommon("operationFailed"),
        variant: "destructive",
      });
    },
  });

  const handleEditCategory = (category: FinanceCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      code: category.code,
      name: category.name,
      nameRu: category.nameRu || "",
      categoryType: category.categoryType as "income" | "expense",
      parentId: category.parentId,
      color: category.color || "",
      icon: category.icon || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const incomeCategories = (Array.isArray(categories) ? categories : []).filter((c) => c.categoryType === "income");
  const expenseCategories = (Array.isArray(categories) ? categories : []).filter((c) => c.categoryType === "expense");

  return {
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
  };
}
