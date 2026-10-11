import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OrderStatus, ReservationStatus } from "@/types";

export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-[9px]",
                inverted ? "bg-foreground" : "bg-brand",
                className
            )}
        >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[55%]" fill="none" strokeWidth="2.4" strokeLinecap="round">
                <g className={inverted ? "stroke-brand" : "stroke-brand-foreground"}>
                    <path d="M4 15h16" />
                    <path d="M6 15a6 6 0 0 1 12 0" />
                    <path d="M12 6V4" />
                    <path d="M3 19h18" />
                </g>
            </svg>
        </span>
    );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
    return (
        <span className={cn("inline-flex items-center gap-2.5", className)}>
            <LogoMark inverted={inverted} />
            <span className="font-display text-xl font-extrabold">Servora</span>
        </span>
    );
}

export function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="font-display text-3xl font-extrabold">{title}</h1>
                {description && <p className="mt-1 text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

const ORDER_STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
    PENDING: { label: "New", className: "bg-brand-soft text-brand-ink" },
    PREPARING: { label: "Cooking", className: "bg-info-soft text-info" },
    READY: { label: "Ready", className: "bg-success-soft text-success" },
    SERVED: { label: "Served", className: "bg-secondary text-secondary-foreground" },
    PAID: { label: "Paid", className: "bg-secondary text-muted-foreground" },
    CANCELLED: { label: "Cancelled", className: "bg-danger-soft text-destructive" },
};

const RESERVATION_STATUS_STYLES: Record<ReservationStatus, { label: string; className: string }> = {
    PENDING: { label: "Request", className: "bg-brand-soft text-brand-ink" },
    CONFIRMED: { label: "Confirmed", className: "bg-success-soft text-success" },
    COMPLETED: { label: "Seated", className: "bg-secondary text-muted-foreground" },
    CANCELLED: { label: "Cancelled", className: "bg-danger-soft text-destructive" },
};

export function orderStatusLabel(status: OrderStatus) {
    return ORDER_STATUS_STYLES[status].label;
}

export function StatusBadge({
    status,
    kind = "order",
    className,
}: {
    status: OrderStatus | ReservationStatus;
    kind?: "order" | "reservation";
    className?: string;
}) {
    const style =
        kind === "order"
            ? ORDER_STATUS_STYLES[status as OrderStatus]
            : RESERVATION_STATUS_STYLES[status as ReservationStatus];
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                style?.className,
                className
            )}
        >
            {style?.label ?? status}
        </span>
    );
}

export function TrendPill({ change, suffix = "vs last week" }: { change: number | null; suffix?: string }) {
    if (change === null) return <span className="text-sm text-muted-foreground">New {suffix}</span>;
    const up = change >= 0;
    return (
        <span className={cn("inline-flex items-center gap-1 text-sm", up ? "text-success" : "text-destructive")}>
            {up ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            {Math.abs(change)}% <span className="text-muted-foreground">{suffix}</span>
        </span>
    );
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon: React.ElementType;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center", className)}>
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" />
            </span>
            <div>
                <p className="font-semibold">{title}</p>
                {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export function UpgradeGate({ feature, plan = "Pro" }: { feature: string; plan?: string }) {
    return (
        <div className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-4 rounded-2xl border bg-card px-8 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
                <Lock className="size-5 text-brand-ink" />
            </span>
            <div>
                <h2 className="font-display text-2xl font-bold">{feature} is on the {plan} plan</h2>
                <p className="mt-2 text-muted-foreground">
                    Upgrade to unlock {feature.toLowerCase()} for your whole team. Every paid plan starts with a 14-day trial.
                </p>
            </div>
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href="/dashboard/billing">See plans</Link>
            </Button>
        </div>
    );
}
