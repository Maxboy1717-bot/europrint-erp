/**
 * @module ChartOfAccountsTypes
 * @description Type definitions and pure helpers for ChartOfAccounts.
 */

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  parentAccountId: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface NewAccountForm {
  accountNumber: string;
  accountName: string;
  accountType: string;
}

export type SortField = "accountNumber" | "accountName" | "balance";
export type SortDirection = "asc" | "desc";

export function sortAccounts(
  accounts: Account[],
  field: SortField,
  direction: SortDirection,
): Account[] {
  return [...accounts].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (field) {
      case "accountNumber":
        aValue = a.accountNumber || "";
        bValue = b.accountNumber || "";
        break;
      case "accountName":
        aValue = a.accountName || "";
        bValue = b.accountName || "";
        break;
      case "balance":
        aValue = a.balance || 0;
        bValue = b.balance || 0;
        break;
      default:
        aValue = a.accountNumber || "";
        bValue = b.accountNumber || "";
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return direction === "asc"
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });
}

export function filterAccounts(
  accounts: Account[],
  searchQuery: string,
  typeFilter: string,
): Account[] {
  return (Array.isArray(accounts) ? accounts : []).filter((account) => {
    const accountNumber = account.accountNumber || "";
    const accountName = account.accountName || "";
    const matchesSearch =
      accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      accountName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "all" || account.accountType === typeFilter;
    return matchesSearch && matchesType;
  });
}
