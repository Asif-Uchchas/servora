"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/shared";
import { useWorkspace } from "@/components/workspace-provider";
import { getJson } from "@/lib/fetcher";
import type { Order } from "@/types";
import { NAV_SECTIONS, isActive } from "./nav";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user, restaurant, plan } = useWorkspace();

    const { data: kitchen } = useQuery({
        queryKey: ["/api/orders?scope=kitchen"],
        queryFn: getJson<Order[]>("/api/orders?scope=kitchen"),
        enabled: plan.features.kitchen,
        refetchInterval: 20_000,
    });
    const kitchenCount = kitchen?.filter((o) => o.status !== "READY").length ?? 0;

    return (
        <div className="flex h-full flex-col gap-1 bg-sidebar px-3.5 py-5 text-sidebar-foreground">
            <Link href="/dashboard" onClick={onNavigate} className="mb-4 flex items-center gap-2.5 px-2">
                <LogoMark />
                <span className="min-w-0">
                    <span className="block font-display text-lg leading-tight font-extrabold text-sidebar-accent-foreground">
                        Servora
                    </span>
                    <span className="block truncate text-xs text-sidebar-muted">{restaurant.name}</span>
                </span>
            </Link>

            <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label} className="mb-2 flex flex-col gap-0.5">
                        <span className="px-2.5 pt-2 pb-1 font-mono text-[11px] tracking-[0.08em] text-sidebar-muted uppercase">
                            {section.label}
                        </span>
                        {section.items
                            .filter((item) => !item.roles || item.roles.includes(user.role))
                            .map((item) => {
                                const active = isActive(pathname, item.href);
                                const locked = item.feature && !plan.features[item.feature];
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={active ? "page" : undefined}
                                        className={cn(
                                            "flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors",
                                            active
                                                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                                : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                                        )}
                                    >
                                        <Icon className={cn("size-4 shrink-0", active && "text-sidebar-primary")} />
                                        <span className="flex-1">{item.title}</span>
                                        {locked ? (
                                            <Lock className="size-3.5 text-sidebar-muted" aria-label="Requires upgrade" />
                                        ) : item.href === "/kitchen" && kitchenCount > 0 ? (
                                            <span className="font-mono text-xs text-sidebar-primary">{kitchenCount}</span>
                                        ) : null}
                                    </Link>
                                );
                            })}
                    </div>
                ))}

                <a
                    href={`/r/${restaurant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                >
                    <ExternalLink className="size-4" />
                    View public menu
                </a>
            </nav>

            {plan.trialDaysLeft !== null && user.role === "ADMIN" && (
                <div className="mt-3 flex flex-col gap-2 rounded-xl bg-sidebar-accent p-3.5">
                    <span className="text-sm font-medium text-sidebar-accent-foreground">
                        {plan.name} trial · {plan.trialDaysLeft} {plan.trialDaysLeft === 1 ? "day" : "days"} left
                    </span>
                    <Link
                        href="/dashboard/billing"
                        onClick={onNavigate}
                        className="rounded-lg bg-sidebar-primary py-2 text-center text-sm font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    >
                        Choose a plan
                    </Link>
                </div>
            )}
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
            <SidebarContent />
        </aside>
    );
}
