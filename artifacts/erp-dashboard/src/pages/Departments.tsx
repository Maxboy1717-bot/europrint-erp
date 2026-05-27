/**
 * @module Departments
 * @description Departments admin page — list, search, add/edit/deactivate.
 * Route: /departments (admin/HR panel)
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface Department {
  id: string;
  code: string;
  name: string;
  name_uz?: string;
  name_ru?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  description?: string | null;
}

function DepartmentsLoadingSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default function Departments() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const raw: unknown = data;
  const departments: Department[] = Array.isArray(raw)
    ? (raw as Department[])
    : Array.isArray((raw as Record<string, unknown>)?.data)
      ? ((raw as Record<string, unknown>).data as Department[])
      : [];

  const filtered = departments.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.name ?? "").toLowerCase().includes(q) ||
      (d.name_uz ?? "").toLowerCase().includes(q) ||
      (d.name_ru ?? "").toLowerCase().includes(q) ||
      (d.code ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("departments") ?? "Departments"}</h1>
            <p className="text-sm text-muted-foreground">
              {departments.length} {t("total") ?? "total"}
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("add") ?? "Add"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("search") ?? "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("departments") ?? "Departments"}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <DepartmentsLoadingSkeleton />}

          {!isLoading && isError && (
            <div className="p-6 text-center text-sm text-destructive">
              {t("errorLoadingData") ?? "Failed to load departments"}
            </div>
          )}

          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Name (UZ)</TableHead>
                  <TableHead>Name (RU)</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t("noData") ?? "No departments found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-mono text-xs">{dept.code}</TableCell>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.name_uz ?? "—"}</TableCell>
                      <TableCell>{dept.name_ru ?? "—"}</TableCell>
                      <TableCell>{dept.level}</TableCell>
                      <TableCell>
                        <Badge variant={dept.is_active ? "default" : "secondary"}>
                          {dept.is_active
                            ? (t("active") ?? "Active")
                            : (t("inactive") ?? "Inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
