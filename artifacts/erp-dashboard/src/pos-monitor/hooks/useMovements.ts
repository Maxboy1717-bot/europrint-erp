/**
 * @module useMovements
 * @description React custom hook.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { movementsApi } from "../api/pos-monitor.api";

export interface Movement {
  id: number;
  movementNumber?: string;
  movementType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  fromWarehouseName?: string;
  toWarehouseName?: string;
}

export interface MovementsFilter {
  status?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface UseMovementsReturn {
  movements: Movement[];
  loading: boolean;
  error: string;
  total: number;
  refetch: () => Promise<void>;
  updateFilter: (f: Partial<MovementsFilter>) => void;
  filter: MovementsFilter;
}

export function useMovements(initialFilter: MovementsFilter = {}): UseMovementsReturn {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [total, setTotal]         = useState(0);
  const [filter, setFilter]       = useState<MovementsFilter>(initialFilter);

  const filterRef = useRef(filter);
  filterRef.current = filter;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await movementsApi.getAll(filterRef.current);
      if (Array.isArray(data)) {
        setMovements(data as Movement[]);
        setTotal((data as Movement[]).length);
      } else if (data && typeof data === "object" && "rows" in (data as object)) {
        const d = data as { rows: Movement[]; total: number };
        setMovements(d.rows);
        setTotal(d.total);
      } else {
        setMovements([]);
        setTotal(0);
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "Xato yuz berdi");
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, filter]);

  const updateFilter = useCallback((f: Partial<MovementsFilter>) => {
    setFilter(prev => ({ ...prev, ...f }));
  }, []);

  return { movements, loading, error, total, refetch: load, updateFilter, filter };
}
