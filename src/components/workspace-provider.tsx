"use client";

import { createContext, useCallback, useContext } from "react";
import type { Feature } from "@/lib/plans";

export interface WorkspaceValue {
    user: { id: string; name: string; email: string; role: "ADMIN" | "MANAGER" | "STAFF" };
    restaurant: { id: string; name: string; slug: string; currency: string; taxRate: number };
    plan: { id: string; name: string; trialDaysLeft: number | null; features: Record<Feature, boolean> };
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ value, children }: { value: WorkspaceValue; children: React.ReactNode }) {
    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) throw new Error("useWorkspace must be used inside the app layout");
    return ctx;
}

/** Currency formatter bound to the restaurant's currency. */
export function useMoney() {
    const { restaurant } = useWorkspace();
    return useCallback(
        (amount: number) =>
            new Intl.NumberFormat(undefined, { style: "currency", currency: restaurant.currency }).format(amount),
        [restaurant.currency]
    );
}

export function useCan() {
    const { user } = useWorkspace();
    return {
        manage: user.role === "ADMIN" || user.role === "MANAGER",
        admin: user.role === "ADMIN",
    };
}
