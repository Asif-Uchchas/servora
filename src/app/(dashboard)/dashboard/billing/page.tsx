import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/session";
import { PLANS, formatLimit } from "@/lib/plans";
import { isBillingConfigured } from "@/lib/stripe";
import { PageHeader } from "@/components/shared";
import { cn } from "@/lib/utils";
import { BillingActions, PlanButton } from "./billing-actions";

export const metadata: Metadata = { title: "Billing" };

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
    const pct = Number.isFinite(limit) ? Math.min(100, (used / limit) * 100) : 4;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-mono text-muted-foreground">
                    {used} / {formatLimit(limit)}
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
                <div className={cn("h-1.5 rounded-full", pct >= 90 ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { user, restaurant, entitlements } = await getWorkspace();
    if (user.role !== "ADMIN") redirect("/dashboard");
    const { status } = await searchParams;

    const [staff, menuItems, tables, hasCustomer] = await Promise.all([
        db.user.count({ where: { restaurantId: restaurant.id } }),
        db.menuItem.count({ where: { restaurantId: restaurant.id } }),
        db.diningTable.count({ where: { restaurantId: restaurant.id } }),
        db.restaurant.count({ where: { id: restaurant.id, stripeCustomerId: { not: null } } }),
    ]);
    const configured = isBillingConfigured();
    const current = entitlements.plan;
    const subscribed = restaurant.subscriptionStatus === "ACTIVE" || restaurant.subscriptionStatus === "PAST_DUE";

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Billing" description="Your plan, usage and invoices." />

            {status === "success" && (
                <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
                    Thanks! Your subscription is being activated — it can take a few seconds to show here.
                </p>
            )}
            {restaurant.subscriptionStatus === "PAST_DUE" && (
                <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-destructive">
                    Your last payment failed. Update your card in Manage billing to keep your plan.
                </p>
            )}
            {!configured && (
                <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Billing isn&apos;t connected on this server yet. Set <code className="font-mono">STRIPE_SECRET_KEY</code>,{" "}
                    <code className="font-mono">STRIPE_PRICE_PRO</code>, <code className="font-mono">STRIPE_PRICE_BUSINESS</code> and{" "}
                    <code className="font-mono">STRIPE_WEBHOOK_SECRET</code> to enable upgrades.
                </p>
            )}

            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="flex flex-col gap-3 rounded-2xl bg-primary p-6 text-primary-foreground">
                    <span className="font-mono text-xs tracking-widest opacity-60 uppercase">Current plan</span>
                    <div className="flex flex-wrap items-baseline gap-3">
                        <span className="font-display text-4xl font-extrabold">{current.name}</span>
                        {entitlements.trialDaysLeft !== null && (
                            <span className="rounded-full bg-brand px-3 py-1 text-sm font-semibold text-brand-foreground">
                                Trial · {entitlements.trialDaysLeft} days left
                            </span>
                        )}
                    </div>
                    <p className="opacity-70">
                        {entitlements.trialDaysLeft !== null
                            ? "Choose a plan before your trial ends to keep Pro features. Otherwise you'll move to Starter — nothing is deleted."
                            : subscribed && restaurant.currentPeriodEnd
                              ? `Renews on ${restaurant.currentPeriodEnd.toLocaleDateString(undefined, { dateStyle: "long" })}.`
                              : current.tagline}
                    </p>
                    {configured && hasCustomer > 0 && <BillingActions />}
                </div>
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
                    <h2 className="font-semibold">Usage</h2>
                    <Usage label="Team members" used={staff} limit={current.limits.staff} />
                    <Usage label="Menu items" used={menuItems} limit={current.limits.menuItems} />
                    <Usage label="Tables" used={tables} limit={current.limits.tables} />
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {Object.values(PLANS).map((plan) => {
                    const isCurrent = plan.id === current.id && (subscribed || plan.id === "STARTER");
                    const featured = plan.id === "PRO";
                    return (
                        <div
                            key={plan.id}
                            className={cn("flex flex-col gap-5 rounded-2xl border p-6", featured ? "border-foreground bg-card" : "bg-card")}
                        >
                            <div>
                                <h3 className="font-semibold">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                            </div>
                            <p className="flex items-baseline gap-1">
                                <span className="font-display text-4xl font-extrabold">${plan.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </p>
                            <ul className="flex flex-col gap-2 text-sm">
                                {plan.highlights.map((h) => (
                                    <li key={h} className="flex gap-2">
                                        <Check className="mt-0.5 size-4 shrink-0 text-success" /> {h}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-auto">
                                {isCurrent ? (
                                    <p className="py-2 text-center text-sm font-medium text-muted-foreground">Your current plan</p>
                                ) : plan.id === "STARTER" ? (
                                    <p className="py-2 text-center text-sm text-muted-foreground">Downgrade from Manage billing</p>
                                ) : (
                                    <PlanButton plan={plan.id} disabled={!configured} featured={featured} label={subscribed ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </section>
        </div>
    );
}
