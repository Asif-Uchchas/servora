import Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@prisma/client";

let client: Stripe | null = null;

/** Billing is optional in development: without STRIPE_SECRET_KEY the billing UI explains how to enable it. */
export function isBillingConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO && process.env.STRIPE_PRICE_BUSINESS);
}

export function getStripe() {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
    return client;
}

export function priceIdForPlan(plan: Exclude<Plan, "STARTER">) {
    return plan === "PRO" ? process.env.STRIPE_PRICE_PRO! : process.env.STRIPE_PRICE_BUSINESS!;
}

export function planForPriceId(priceId: string | undefined): Plan {
    if (priceId && priceId === process.env.STRIPE_PRICE_BUSINESS) return "BUSINESS";
    if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
    return "STARTER";
}

export function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
        case "trialing":
            return "TRIALING";
        case "active":
            return "ACTIVE";
        case "past_due":
        case "unpaid":
            return "PAST_DUE";
        case "canceled":
        case "incomplete_expired":
            return "CANCELED";
        default:
            return "NONE";
    }
}

export function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}
