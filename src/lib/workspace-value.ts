import type { Workspace } from "@/lib/session";
import type { WorkspaceValue } from "@/components/workspace-provider";

/** Serialisable subset of the server workspace handed to client components. */
export function toWorkspaceValue({ user, restaurant, entitlements }: Workspace): WorkspaceValue {
    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            currency: restaurant.currency,
            taxRate: restaurant.taxRate,
        },
        plan: {
            id: entitlements.plan.id,
            name: entitlements.plan.name,
            trialDaysLeft: entitlements.trialDaysLeft,
            features: entitlements.features,
        },
    };
}
