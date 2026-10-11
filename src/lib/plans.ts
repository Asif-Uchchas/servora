import type { Plan, SubscriptionStatus } from "@prisma/client";

export type Feature = "kitchen" | "reservations" | "inventory" | "analytics";

export interface PlanDefinition {
    id: Plan;
    name: string;
    tagline: string;
    /** Monthly price in USD, shown on the pricing page. Billing amounts live in Stripe. */
    price: number;
    limits: { staff: number; menuItems: number; tables: number };
    features: Record<Feature, boolean>;
    highlights: string[];
}

const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLANS: Record<Plan, PlanDefinition> = {
    STARTER: {
        id: "STARTER",
        name: "Starter",
        tagline: "For a single small venue",
        price: 0,
        limits: { staff: 3, menuItems: 40, tables: 10 },
        features: { kitchen: false, reservations: false, inventory: false, analytics: false },
        highlights: ["POS and orders", "Up to 3 team members", "Up to 40 menu items", "QR menu"],
    },
    PRO: {
        id: "PRO",
        name: "Pro",
        tagline: "For a busy, full-service room",
        price: 39,
        limits: { staff: 15, menuItems: UNLIMITED, tables: 60 },
        features: { kitchen: true, reservations: true, inventory: true, analytics: false },
        highlights: [
            "Everything in Starter",
            "Up to 15 team members",
            "Unlimited menu items",
            "Kitchen display",
            "Reservations and inventory",
        ],
    },
    BUSINESS: {
        id: "BUSINESS",
        name: "Business",
        tagline: "For high-volume operators",
        price: 99,
        limits: { staff: UNLIMITED, menuItems: UNLIMITED, tables: UNLIMITED },
        features: { kitchen: true, reservations: true, inventory: true, analytics: true },
        highlights: [
            "Everything in Pro",
            "Unlimited team members",
            "Advanced analytics and CSV export",
            "Priority support",
        ],
    },
};

export const TRIAL_DAYS = 14;

interface BillingState {
    plan: Plan;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: Date | null;
}

/** The plan a restaurant is actually entitled to right now. */
export function effectivePlan(state: BillingState, now = new Date()): Plan {
    switch (state.subscriptionStatus) {
        case "ACTIVE":
        case "PAST_DUE": // keep access during Stripe's dunning window
            return state.plan;
        case "TRIALING":
            return state.trialEndsAt && state.trialEndsAt > now ? state.plan : "STARTER";
        default:
            return "STARTER";
    }
}

export function getEntitlements(state: BillingState, now = new Date()) {
    const plan = PLANS[effectivePlan(state, now)];
    const trialDaysLeft =
        state.subscriptionStatus === "TRIALING" && state.trialEndsAt
            ? Math.max(0, Math.ceil((state.trialEndsAt.getTime() - now.getTime()) / 86_400_000))
            : null;
    return { plan, limits: plan.limits, features: plan.features, trialDaysLeft };
}

export function formatLimit(n: number) {
    return Number.isFinite(n) ? String(n) : "Unlimited";
}
