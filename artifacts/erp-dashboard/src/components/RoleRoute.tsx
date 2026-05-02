import { Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface RoleRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function RoleRoute({ children, roles }: RoleRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" data-testid="loading-auth">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4" data-testid="access-denied">
        <h1 className="text-2xl font-bold text-destructive">Ruxsat yo'q</h1>
        <p className="text-muted-foreground">Bu sahifaga kirish uchun sizda ruxsat yo'q</p>
        <p className="text-sm text-muted-foreground">Kerakli rollar: {roles.join(', ')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
