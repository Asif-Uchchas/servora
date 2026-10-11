"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { BookOpen, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, StatusBadge, TrendPill } from "@/components/shared";
import { useMoney, useWorkspace } from "@/components/workspace-provider";
import { getJson } from "@/lib/fetcher";
import { cn, elapsed, formatOrderNumber } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import type { DashboardStats } from "@/types";

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Kpi({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
    return (
        <Card className="gap-2 p-5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-mono text-[28px] leading-none font-medium tabular">{value}</span>
            {children}
        </Card>
    );
}

export default function DashboardPage() {
    const { user, plan } = useWorkspace();
    const money = useMoney();
    const now = useNow();
    const { data, isLoading } = useQuery({
        queryKey: ["/api/dashboard"],
        queryFn: getJson<DashboardStats>("/api/dashboard"),
        refetchInterval: 30_000,
    });

    const firstName = user.name.split(" ")[0];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-extrabold">
                        {greeting()}, {firstName}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                        {data && plan.features.kitchen && ` · ${data.kitchenCount} tickets in the kitchen`}
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/pos">
                        <Plus /> New order
                    </Link>
                </Button>
            </div>

            {isLoading || !data ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                    <Skeleton className="h-80 rounded-xl sm:col-span-2" />
                    <Skeleton className="h-80 rounded-xl sm:col-span-2" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Kpi label="Revenue today" value={money(data.today.revenue)}>
                            <TrendPill change={data.today.revenueChange} suffix="vs last week" />
                        </Kpi>
                        <Kpi label="Orders" value={String(data.today.orders)}>
                            <TrendPill change={data.today.ordersChange} suffix="vs last week" />
                        </Kpi>
                        <Kpi label="Average ticket" value={money(data.today.avgTicket)}>
                            <TrendPill change={data.today.avgTicketChange} suffix="vs last week" />
                        </Kpi>
                        <Kpi label="Covers booked tonight" value={String(data.today.covers)}>
                            <span className="text-sm text-muted-foreground">
                                {plan.features.reservations
                                    ? `${data.today.reservations} reservation${data.today.reservations === 1 ? "" : "s"}`
                                    : "Reservations are on Pro"}
                            </span>
                        </Kpi>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="gap-4 p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold">Revenue, last 7 days</h2>
                                <span className="font-mono text-sm text-muted-foreground">{money(data.weekRevenue)}</span>
                            </div>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.revenueData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: "short" })}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "var(--font-mono)" }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: "var(--muted)" }}
                                            content={({ active, payload }) =>
                                                active && payload?.[0] ? (
                                                    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(payload[0].payload.date).toLocaleDateString(undefined, {
                                                                weekday: "long",
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </p>
                                                        <p className="font-mono font-medium">{money(payload[0].payload.revenue)}</p>
                                                        <p className="text-xs text-muted-foreground">{payload[0].payload.orders} orders</p>
                                                    </div>
                                                ) : null
                                            }
                                        />
                                        <Bar dataKey="revenue" radius={[6, 6, 6, 6]}>
                                            {data.revenueData.map((d, i) => (
                                                <Cell key={d.date} fill={i === data.revenueData.length - 1 ? "var(--brand)" : "var(--muted)"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="gap-1 p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="font-semibold">Live orders</h2>
                                <Link href={plan.features.kitchen ? "/kitchen" : "/dashboard/orders"} className="text-sm underline-offset-4 hover:underline">
                                    {plan.features.kitchen ? "Open kitchen" : "All orders"}
                                </Link>
                            </div>
                            {data.liveOrders.length === 0 ? (
                                <EmptyState icon={ReceiptText} title="No open orders" description="New orders from the POS show up here." className="py-10" />
                            ) : (
                                <ul className="divide-y">
                                    {data.liveOrders.map((o) => {
                                        const late = o.status !== "SERVED" && now - new Date(o.createdAt).getTime() > 20 * 60_000;
                                        return (
                                            <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm">
                                                        {formatOrderNumber(o.orderNumber)} · {o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {o.items.reduce((s, i) => s + i.quantity, 0)} items · {elapsed(o.createdAt, now)}
                                                    </p>
                                                </div>
                                                {late ? (
                                                    <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-destructive">Late</span>
                                                ) : (
                                                    <StatusBadge status={o.status} />
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="gap-3 p-5">
                            <h2 className="font-semibold">Best sellers this week</h2>
                            {data.topItems.length === 0 ? (
                                <EmptyState icon={BookOpen} title="No sales yet this week" className="py-10" />
                            ) : (
                                data.topItems.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <span className="font-mono">{item.quantity} sold</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted">
                                            <div
                                                className="h-1.5 rounded-full bg-primary"
                                                style={{ width: `${(item.quantity / data.topItems[0].quantity) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </Card>

                        <Card className="gap-2 p-5">
                            <div className="mb-1 flex items-center justify-between">
                                <h2 className="font-semibold">Running low</h2>
                                {plan.features.inventory && (
                                    <Link href="/dashboard/inventory" className="text-sm underline-offset-4 hover:underline">
                                        Inventory
                                    </Link>
                                )}
                            </div>
                            {!plan.features.inventory ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    Stock tracking is on the Pro plan.{" "}
                                    <Link href="/dashboard/billing" className="underline">
                                        See plans
                                    </Link>
                                </p>
                            ) : data.lowStock.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Everything is stocked above its minimum.</p>
                            ) : (
                                data.lowStock.slice(0, 5).map((i) => (
                                    <div
                                        key={i.id}
                                        className={cn(
                                            "flex items-center justify-between rounded-lg px-3 py-2.5",
                                            i.quantity === 0 ? "bg-danger-soft" : "bg-warning-soft"
                                        )}
                                    >
                                        <span className="text-sm">{i.name}</span>
                                        <span className={cn("font-mono text-sm", i.quantity === 0 ? "text-destructive" : "text-warning")}>
                                            {i.quantity} / {i.minimumQuantity} {i.unit}
                                        </span>
                                    </div>
                                ))
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
