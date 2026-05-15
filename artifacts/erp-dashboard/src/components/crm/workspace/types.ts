/**
 * @module types
 * @description React UI component.
 */

import type { DragStartEvent, DragEndEvent, SensorDescriptor, PointerSensorOptions } from '@dnd-kit/core';
import type { Dispatch, SetStateAction } from 'react';
import { 
  EntityType, 
  ViewMode, 
  QuickFilter, 
  AdvancedFilters, 
  Lead, 
  Deal, 
  Contact, 
  Company, 
  Proposal, 
  Invoice, 
  Robot,
  Stage
} from "@/pages/crm/crm-types";

export interface CrmActivity {
  id: number;
  type: string;
  subject: string;
  note: string | null;
  dueDate: string | null;
  isDone: boolean;
  createdAt: string;
  entityType: string | null;
  entityId: number | null;
}

export type FilterableEntity = Lead | Deal | Contact | Company | Proposal | Invoice | Robot;

export interface CrmEntityLike {
  id: number;
  title?: string;
  name?: string | null;
  lastName?: string | null;
  dateCreate?: string;
  createdAt?: string;
  statusId?: string | null;
  stageId?: string | null;
  status?: string;
  assignedById?: string | null;
  sourceId?: string | null;
  source?: string | null;
  opportunity?: number | null;
  totalAmount?: number;
  phones?: { value: string; type: string }[];
  number?: string;
  companyTitle?: string | null;
}

export interface CRMHeaderProps {
  activeEntity: EntityType;
  onEntityChange: (entity: EntityType) => void;
  onQuickCreate: (entity: EntityType) => void;
}

export interface CRMFilterBarProps {
  viewMode: ViewMode;
  setViewMode: (view: ViewMode) => void;
  supportsKanban: boolean;
  quickFilter: QuickFilter;
  setQuickFilter: (filter: QuickFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilterCount: number;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  filteredItemsCount: number;
  nameSortAsc: boolean;
  setNameSortAsc: (asc: boolean) => void;
  selectedItemsCount: number;
  onDeleteSelected: () => void;
}

export interface AdvancedFilterPanelProps {
  filters: AdvancedFilters;
  setFilters: (filters: AdvancedFilters) => void;
  onClose: () => void;
  activeEntity: EntityType;
  stages: Stage[];
}

export interface KanbanViewProps {
  stages: Stage[];
  itemsByStage: Record<string, FilterableEntity[]>;
  activeEntity: EntityType;
  stageValues: Record<string, number>;
  onItemClick: (id: number) => void;
  onAddTask: (id: string | number) => void;
  onQuickAdd: (stageId: string) => void;
  sensors: SensorDescriptor<PointerSensorOptions>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  activeItemId: number | null;
  activeItem: FilterableEntity | null;
}

export interface ListViewProps {
  items: FilterableEntity[];
  activeEntity: EntityType;
  selectedItems: Set<number>;
  onToggleItem: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
  onItemClick: (id: number) => void;
}

export interface ActivityLogPanelProps {
  activityFilter: "today" | "all";
  setActivityFilter: (filter: "today" | "all") => void;
  activities: CrmActivity[];
  isLoading: boolean;
  onAddActivity: () => void;
  onDoneActivity: (id: number) => void;
  onDeleteActivity: (id: number) => void;
}

export type ActivityForm = {
  type: string;
  subject: string;
  note: string;
  dueDate: string;
  entityType: string;
  entityId: string;
};

export interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ActivityForm;
  setForm: Dispatch<SetStateAction<ActivityForm>>;
  onSubmit: (form: ActivityForm) => void;
  isPending: boolean;
  activityTypes: { value: string; label: string }[];
}
