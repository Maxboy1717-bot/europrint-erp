/**
 * @module OrdersRegistry
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, OrdersRegistryEntry } from "./OrdersRegistryTypes";
import { OrdersHeader, CategoryStats, OrdersFilters, OrdersTable } from "./OrdersRegistrySections";
import { CreateOrderDialog, OrderDetailDialog } from "./OrdersRegistryDialogs";

export default function OrdersRegistry() {
  const { hasRole } = useAuth();
  const canCreate = hasRole("admin", "super_admin", "director", "erp_manager");
  const [showCreate, setShowCreate] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("");
  const [search, setSearch] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  const queryParams: Record<string, string> = {};
  if (filterCategory !== "all") queryParams.category = filterCategory;
  if (filterStatus !== "all") queryParams.status = filterStatus;
  if (filterYear) queryParams.year = filterYear;
  if (search) queryParams.search = search;

  const { data, isLoading, isError, refetch } = useQuery<{ entries: OrdersRegistryEntry[]; total: number }>({
    queryKey: ["/api/orders-registry", Object.keys(queryParams).length > 0 ? queryParams : {}],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/orders-registry"] });
  };

  const entries = data?.entries ?? [];

  const statsByCategory = CATEGORIES.reduce((acc, c) => {
    acc[c] = (Array.isArray(entries) ? entries : []).filter((e) => e.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <OrdersHeader
        canCreate={canCreate}
        onRefresh={handleRefresh}
        onAdd={() => setShowCreate(true)}
      />

      <CategoryStats
        statsByCategory={statsByCategory}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
      />

      <OrdersFilters
        search={search}
        filterCategory={filterCategory}
        filterYear={filterYear}
        filterStatus={filterStatus}
        years={years}
        onSearchChange={setSearch}
        onCategoryChange={setFilterCategory}
        onYearChange={setFilterYear}
        onStatusChange={setFilterStatus}
      />

      <OrdersTable
        entries={entries}
        total={data?.total}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onView={setViewId}
      />

      <CreateOrderDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={handleRefresh}
      />

      <OrderDetailDialog
        viewId={viewId}
        onOpenChange={(open) => { if (!open) setViewId(null); }}
      />
    </div>
  );
}
