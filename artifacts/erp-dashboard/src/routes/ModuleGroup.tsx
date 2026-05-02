import { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { PageLoader } from "@/components/PageLoader";
import { RoleRoute } from "@/components/RoleRoute";
import ErrorBoundary from "@/components/error-boundary";

interface ModuleGroupProps {
  roles: string[];
  routes: [string, React.ComponentType][];
}

export function ModuleGroup({ roles, routes }: ModuleGroupProps) {
  const [location] = useLocation();
  const isActive = (Array.isArray(routes) ? routes : []).some(([pattern]) => {
    const regStr = '^' + pattern
      .replace(/:[^/]+\*/g, '.*')
      .replace(/:[^/]+/g, '[^/]+') + '$';
    return new RegExp(regStr).test(location);
  });
  if (!isActive) return null;
  return (
    <RoleRoute roles={roles}>
      <Switch>
        {(Array.isArray(routes) ? routes : []).map(([path, Component]) => (
          <Route key={path} path={path}>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}><Component /></Suspense>
            </ErrorBoundary>
          </Route>
        ))}
      </Switch>
    </RoleRoute>
  );
}
