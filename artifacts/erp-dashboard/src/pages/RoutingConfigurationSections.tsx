/**
 * @module RoutingConfigurationSections
 * @description Stateless section-level components for the Routing
 * Configuration page: loading/error/empty states, search bar, and the
 * routing list container. The individual card is in RoutingConfigurationCard.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle, Package } from "lucide-react";

import {
  type RoutingWithProduct,
  type OperationWithWorkCenter,
} from "./RoutingConfigurationTypes";
import { RoutingCard, type RoutingCardLabels } from "./RoutingConfigurationCard";
import { EPErrorState, EPLoader } from "@/components/ep";

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

export function RoutingLoadingState() {
  return (
    <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
      <EPLoader size={32} tone="muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

interface RoutingErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function RoutingErrorState({ onRetry, message }: RoutingErrorStateProps) {
  if (message) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-2"
        data-testid="error-state"
      >
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }
  return <EPErrorState onRetry={onRetry} />;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

interface RoutingEmptyStateProps {
  noDataLabel: string;
  hintLabel: string;
}

export function RoutingEmptyState({ noDataLabel, hintLabel }: RoutingEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-64 gap-2"
      data-testid="empty-state"
    >
      <Package className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium">{noDataLabel}</p>
      <p className="text-sm text-muted-foreground">{hintLabel}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

interface RoutingSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function RoutingSearchBar({ value, onChange, placeholder }: RoutingSearchBarProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 bg-card border-none"
          data-testid="input-search"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Routing list
// ---------------------------------------------------------------------------

interface RoutingListProps {
  routings: RoutingWithProduct[];
  operations: OperationWithWorkCenter[];
  isLoading: boolean;
  notFoundLabel: string;
  cardLabels: RoutingCardLabels;
  onManage: (routingData: RoutingWithProduct) => void;
  onDelete: (id: string) => void;
  deletingMutationPending: boolean;
}

export function RoutingList({
  routings,
  operations,
  isLoading,
  notFoundLabel,
  cardLabels,
  onManage,
  onDelete,
  deletingMutationPending,
}: RoutingListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <EPLoader className="w-8 h-8" />
      </div>
    );
  }

  if (routings.length === 0) {
    return (
      <Card className="bg-card rounded-lg border-none shadow-none">
        <CardContent className="p-12 text-center text-muted-foreground italic">
          {notFoundLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {routings.map((routingData) => (
        <RoutingCard
          key={routingData.routing.id}
          routingData={routingData}
          operations={operations}
          labels={cardLabels}
          onManage={onManage}
          onDelete={onDelete}
          isDeleting={deletingMutationPending}
        />
      ))}
    </div>
  );
}

// Re-export so consumers can import RoutingCardLabels from this module too
export type { RoutingCardLabels };
