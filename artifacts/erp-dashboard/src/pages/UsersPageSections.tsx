/**
 * @module UsersPageSections
 * @description Toolbar, user list, and pagination for UsersPage.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersIcon, Search, Shield, UserPlus, KeyRound, UserX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminUser } from "./UsersPageTypes";
import { ALL_ROLES, ROLE_COLORS } from "./UsersPageTypes";

import { useTranslation } from '@/lib/i18n';
interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  roleFilter: string;
  onRoleFilterChange: (v: string) => void;
  canManage: boolean;
  onCreateClick: () => void;
}

export function UsersToolbar({search, onSearchChange,
  roleFilter, onRoleFilterChange,
  canManage, onCreateClick,
}: ToolbarProps) {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('usernameYokiEmail')}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
          data-testid="input-search-users"
        />
      </div>
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-44 h-9">
          <SelectValue placeholder="Barcha rollar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha rollar</SelectItem>
          {ALL_ROLES.map(r => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canManage && (
        <Button size="sm" onClick={onCreateClick}>
          <UserPlus className="h-4 w-4 mr-1" /> Yangi
        </Button>
      )}
    </div>
  );
}

interface UserListProps {
  isLoading: boolean;
  filtered: AdminUser[];
  search: string;
  canManage: boolean;
  onRoleEdit: (u: AdminUser) => void;
  onDeactivate: (id: number) => void;
}

export function UserList({
  isLoading, filtered, search, canManage, onRoleEdit, onDeactivate,
}: UserListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36 rounded-lg" />
                <Skeleton className="h-3 w-52 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-24 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {search ? "Qidiruv natijasi topilmadi" : "Foydalanuvchilar yo'q"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map(u => {
        const roleLabel = ALL_ROLES.find(r => r.value === u.role)?.label ?? u.role;
        const roleClass = ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700";
        return (
          <Card
            key={u.id}
            className="hover:shadow-md transition-shadow"
            data-testid={`card-user-${u.id}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">@{u.username}</p>
                  <Badge variant={u.isActive ? "default" : "outline"} className="text-xs">
                    {u.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
                {u.email && (
                  <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${roleClass}`}>
                {roleLabel}
              </span>
              {canManage && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title="Rolni o'zgartirish"
                    onClick={() => onRoleEdit(u)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Nofaol qilish"
                    onClick={() => onDeactivate(u.id)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function UsersPagination({ page, pages, total, onPrev, onNext }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 pt-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
        ← Oldingi
      </Button>
      <span className="text-sm text-muted-foreground">
        {page} / {pages} ({total} ta)
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={onNext}>
        Keyingi →
      </Button>
    </div>
  );
}
