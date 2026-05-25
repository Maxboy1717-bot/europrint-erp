import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, renderHook } from "@testing-library/react";
import React from "react";

type TestUser = {
  id: number;
  employeeId?: number;
  role: string;
};

// vi.hoisted runs BEFORE vi.mock factories. The returned object reference is
// shared between the mock factory and the test bodies via setUser().
const { authState } = vi.hoisted(() => ({
  authState: { current: null as TestUser | null },
}));

// Mock the useAuth hook BEFORE importing RoleGate.
vi.mock("@/hooks/useAuth", () => {
  const ROLE_ALIASES: Record<string, string> = {
    admin: "super_admin",
    super_admin: "super_admin",
    director: "director",
    hr: "hr_manager",
    hr_manager: "hr_manager",
    hr_specialist: "hr_specialist",
    employee: "employee",
    sales: "sales_manager",
    sales_manager: "sales_manager",
  };

  return {
    useAuth: () => ({
      user: authState.current,
      isLoading: false,
      isAuthenticated: !!authState.current,
      hasRole: (...roles: string[]) => {
        const u = authState.current;
        if (!u) return false;
        const effective = ROLE_ALIASES[u.role?.toLowerCase()] ?? u.role;
        if (effective === "super_admin") return true;
        const normalized = (Array.isArray(roles) ? roles : []).map(
          (r) => ROLE_ALIASES[r?.toLowerCase()] ?? r,
        );
        return normalized.includes(effective);
      },
      logout: async () => {},
      refetch: async () => {},
    }),
  };
});

import { RoleGate, PII_VIEWER_ROLES, useMaskedSalary } from "../RoleGate";

const setUser = (u: TestUser | null) => {
  authState.current = u;
};

beforeEach(() => {
  setUser(null);
});

describe("RoleGate", () => {
  it("renders children when no roles required (pass-through mode)", () => {
    setUser({ id: 1, role: "employee" });
    render(
      <RoleGate>
        <span>secret</span>
      </RoleGate>,
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("renders fallback for non-authorized role", () => {
    setUser({ id: 1, role: "sales_manager" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.queryByText("salary: 10M")).not.toBeInTheDocument();
    expect(screen.getByText("•••••")).toBeInTheDocument();
  });

  it("renders children when user has hr_manager role", () => {
    setUser({ id: 1, role: "hr_manager" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("salary: 10M")).toBeInTheDocument();
  });

  it("renders children when user has director role", () => {
    setUser({ id: 1, role: "director" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("salary: 10M")).toBeInTheDocument();
  });

  it("super_admin always sees content regardless of roles list", () => {
    setUser({ id: 1, role: "super_admin" });
    render(
      <RoleGate roles={["director"]}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("salary: 10M")).toBeInTheDocument();
  });

  it("owner sees their own data even without HR role", () => {
    setUser({ id: 42, role: "employee" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES} ownerUserId={42}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("salary: 10M")).toBeInTheDocument();
  });

  it("owner check matches when ownerUserId is a string", () => {
    setUser({ id: 42, role: "employee" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES} ownerUserId={"42"}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("salary: 10M")).toBeInTheDocument();
  });

  it("non-owner non-HR sees fallback even when ownerUserId is provided", () => {
    setUser({ id: 99, role: "employee" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES} ownerUserId={42}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.queryByText("salary: 10M")).not.toBeInTheDocument();
    expect(screen.getByText("•••••")).toBeInTheDocument();
  });

  it("unauthenticated user sees fallback", () => {
    setUser(null);
    render(
      <RoleGate roles={PII_VIEWER_ROLES}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.queryByText("salary: 10M")).not.toBeInTheDocument();
    expect(screen.getByText("•••••")).toBeInTheDocument();
  });

  it("uses custom fallback when provided", () => {
    setUser({ id: 1, role: "employee" });
    render(
      <RoleGate
        roles={PII_VIEWER_ROLES}
        fallback={<span>access denied</span>}
      >
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("access denied")).toBeInTheDocument();
  });

  it("renders nothing when fallback is null", () => {
    setUser({ id: 1, role: "employee" });
    const { container } = render(
      <RoleGate roles={PII_VIEWER_ROLES} fallback={null}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.queryByText("salary: 10M")).not.toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it("matches owner via employeeId (not just id)", () => {
    setUser({ id: 7, employeeId: 42, role: "employee" });
    render(
      <RoleGate roles={PII_VIEWER_ROLES} ownerUserId={42}>
        <span>salary: 10M</span>
      </RoleGate>,
    );
    expect(screen.getByText("salary: 10M")).toBeInTheDocument();
  });

  it("PII_VIEWER_ROLES contains expected roles", () => {
    // Lock down the contract — adding/removing roles is intentional and must
    // be reviewed.
    expect([...PII_VIEWER_ROLES]).toEqual([
      "super_admin",
      "director",
      "hr_manager",
      "hr_specialist",
      "hr",
    ]);
  });
});

describe("useMaskedSalary", () => {
  it("returns masked string for non-HR user", () => {
    setUser({ id: 1, role: "employee" });
    const { result } = renderHook(() => useMaskedSalary());
    expect(result.current.canView).toBe(false);
    expect(result.current.format(1_500_000)).toBe("•••••");
  });

  it("returns formatted number for HR manager", () => {
    setUser({ id: 1, role: "hr_manager" });
    const { result } = renderHook(() => useMaskedSalary());
    expect(result.current.canView).toBe(true);
    expect(result.current.format(1_500_000)).toBe(
      (1_500_000).toLocaleString(),
    );
  });

  it("returns em-dash for non-finite values when authorized", () => {
    setUser({ id: 1, role: "director" });
    const { result } = renderHook(() => useMaskedSalary());
    expect(result.current.format(null)).toBe((0).toLocaleString());
    expect(result.current.format(undefined)).toBe((0).toLocaleString());
    expect(result.current.format("not-a-number")).toBe("—");
  });
});
