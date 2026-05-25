/**
 * @module UsersPage
 * @description React page component. Route-level UI.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { ModulePage } from "@/components/ui/module-page";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import type { AdminUser, UsersResponse, UserCreateForm } from "./UsersPageTypes";
import { EMPTY_FORM } from "./UsersPageTypes";
import { UsersToolbar, UserList, UsersPagination } from "./UsersPageSections";
import { RoleChangeDialog, DeactivateAlert, CreateUserDialog } from "./UsersPageDialogs";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function UsersPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { isAdmin, hasPermission } = usePermissions();
  const canManage = isAdmin || hasPermission("USERS", "WRITE");

  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("all");
  const [page, setPage]               = useState(1);
  const [roleDialogUser, setRoleDialogUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole]         = useState("");
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState<UserCreateForm>(EMPTY_FORM);

  const queryKey = ["/api/admin/users", page, roleFilter];

  const { data, isLoading, isError, error, refetch } = useQuery<UsersResponse>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (roleFilter !== "all") params.set("role", roleFilter);
      return apiRequest<UsersResponse>("GET", `/api/admin/users?${params}`);
    },
  });

  const users      = data?.users ?? [];
  const pagination = data?.pagination;

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      u => u.username.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Rol o'zgartirildi" });
      setRoleDialogUser(null);
    },
    onError: () =>
      toast({ title: "Xato", description: "Rol o'zgartirilmadi", variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Foydalanuvchi nofaol qilindi" });
      setDeleteId(null);
    },
    onError: () =>
      toast({ title: "Xato", description: "O'chirib bo'lmadi", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (body: UserCreateForm) => apiRequest("POST", "/api/admin/users", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Foydalanuvchi yaratildi" });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
    },
    onError: (err: Error) =>
      toast({ title: "Xato", description: err.message, variant: "destructive" }),
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  return (
    <ModulePage module="hr" title={t("foydalanuvchilar")} icon={<UsersIcon className="h-5 w-5" />}>
      <div className="space-y-4">
        <UsersToolbar
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={v => { setRoleFilter(v); setPage(1); }}
          canManage={canManage}
          onCreateClick={() => setShowCreate(true)}
        />

        <UserList
          isLoading={isLoading}
          filtered={filtered}
          search={search}
          canManage={canManage}
          onRoleEdit={u => { setRoleDialogUser(u); setNewRole(u.role); }}
          onDeactivate={id => setDeleteId(id)}
        />

        {pagination && (
          <UsersPagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
          />
        )}
      </div>

      <RoleChangeDialog
        user={roleDialogUser}
        newRole={newRole}
        onRoleChange={setNewRole}
        onClose={() => setRoleDialogUser(null)}
        onSave={() =>
          roleDialogUser && changeRoleMutation.mutate({ id: roleDialogUser.id, role: newRole })
        }
        isPending={changeRoleMutation.isPending}
      />

      <DeactivateAlert
        deleteId={deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deactivateMutation.mutate(deleteId)}
      />

      <CreateUserDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        form={createForm}
        onChange={setCreateForm}
        onSave={() => createMutation.mutate(createForm)}
        isPending={createMutation.isPending}
      />
    </ModulePage>
  );
}
