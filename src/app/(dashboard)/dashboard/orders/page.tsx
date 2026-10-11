"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Lock, Printer, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { Receipt } from "@/components/pos/receipt";
import { useMoney, useWorkspace } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { cn, formatOrderNumber } from "@/lib/utils";
import { useNow } from "@/lib/use-now";
import type { Order, OrderStatus } from "@/types";

const FILTERS: { id: "all" | "open" | OrderStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "PAID", label: "Paid" },
    { id: "CANCELLED", label: "Cancelled" },
];
const OPEN: OrderStatus[] = ["PENDING", "PREPARING", "READY", "SERVED"];
const RANGES = { today: 1, "7d": 7, "30d": 30, all: Infinity } as const;

function toCsv(orders: Order[]) {
    const header = ["order", "created_at", "status", "table", "guest", "items", "subtotal", "tax", "tip", "total", "payment"];
    const rows = orders.map((o) => [
        o.orderNumber,
        o.createdAt,
        o.status,
        o.tableNumber ?? "",
        o.customerName ?? "",
        o.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
        o.subtotal,
        o.taxAmount,
        o.tipAmount,
        o.totalAmount,
        o.paymentMethod ?? "",
    ]);
    return [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export default function OrdersPage() {
    const { restaurant, plan } = useWorkspace();
    const money = useMoney();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
    const [range, setRange] = useState<keyof typeof RANGES>("7d");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [settling, setSettling] = useState(false);
    const now = useNow(60_000);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["/api/orders?limit=500"],
        queryFn: getJson<Order[]>("/api/orders?limit=500"),
        refetchInterval: 20_000,
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const since = now - RANGES[range] * 86_400_000;
        return orders.filter((o) => {
            if (range === "today" ? new Date(o.createdAt).toDateString() !== new Date().toDateString() : new Date(o.createdAt).getTime() < since) return false;
            if (filter === "open" ? !OPEN.includes(o.status) : filter !== "all" && o.status !== filter) return false;
            return (
                !q ||
                String(o.orderNumber).includes(q.replace("#", "")) ||
                o.customerName?.toLowerCase().includes(q) ||
                o.tableNumber?.toLowerCase().includes(q) ||
                o.items.some((i) => i.name.toLowerCase().includes(q))
            );
        });
    }, [orders, filter, range, search, now]);

    const selected = orders.find((o) => o.id === selectedId) ?? null;
    const revenue = filtered.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.totalAmount, 0);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/orders?limit=500"] });

    const setStatus = async (order: Order, status: OrderStatus) => {
        try {
            await api(`/api/orders/${order.id}`, { method: "PATCH", json: { status } });
            toast.success(status === "CANCELLED" ? "Order cancelled" : "Order updated");
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't update the order");
        }
    };

    const exportCsv = () => {
        const blob = new Blob([toCsv(filtered)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), { href: url, download: `orders-${new Date().toISOString().slice(0, 10)}.csv` });
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Orders"
                description={`${filtered.length} orders · ${money(revenue)} in sales`}
                actions={
                    plan.features.analytics ? (
                        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
                            <Download /> Export CSV
                        </Button>
                    ) : (
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/billing">
                                <Lock /> Export CSV
                            </Link>
                        </Button>
                    )
                }
            />

            <div className="flex flex-wrap items-center gap-3">
                <div role="tablist" aria-label="Status" className="flex gap-1 rounded-lg bg-muted p-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            role="tab"
                            type="button"
                            aria-selected={filter === f.id}
                            onClick={() => setFilter(f.id)}
                            className={cn(
                                "min-h-9 rounded-md px-3.5 text-sm",
                                filter === f.id ? "bg-card font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <Select value={range} onValueChange={(v) => setRange(v as keyof typeof RANGES)}>
                    <SelectTrigger className="h-11 w-36" aria-label="Date range">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                </Select>
                <label className="relative ml-auto w-full sm:w-72">
                    <span className="sr-only">Search orders</span>
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, guest, table or dish" className="h-11 pl-9" />
                </label>
            </div>

            {isLoading ? (
                <Skeleton className="h-96 rounded-xl" />
            ) : filtered.length === 0 ? (
                <EmptyState icon={ReceiptText} title="No orders here" description="Try a different filter or date range." />
            ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Order</th>
                                <th className="px-4 py-3 font-medium">Time</th>
                                <th className="px-4 py-3 font-medium">Table / guest</th>
                                <th className="px-4 py-3 font-medium">Items</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((o) => (
                                <tr
                                    key={o.id}
                                    onClick={() => setSelectedId(o.id)}
                                    className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                                >
                                    <td className="px-4 py-3">
                                        <button type="button" className="font-mono font-medium hover:underline" onClick={() => setSelectedId(o.id)}>
                                            {formatOrderNumber(o.orderNumber)}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                        {new Date(o.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </td>
                                    <td className="px-4 py-3">
                                        {o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway"}
                                        {o.customerName && <span className="text-muted-foreground"> · {o.customerName}</span>}
                                    </td>
                                    <td className="max-w-64 truncate px-4 py-3 text-muted-foreground">
                                        {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={o.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{money(o.totalAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                    {selected && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-3 font-mono text-xl">
                                    {formatOrderNumber(selected.orderNumber)} <StatusBadge status={selected.status} />
                                </SheetTitle>
                                <SheetDescription>
                                    {new Date(selected.createdAt).toLocaleString()} · {selected.tableNumber ? `Table ${selected.tableNumber}` : "Takeaway"}
                                    {selected.createdBy && ` · by ${selected.createdBy}`}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 px-4 pb-6">
                                <div className="rounded-xl border">
                                    <Receipt order={selected} restaurantName={restaurant.name} money={money} />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {OPEN.includes(selected.status) && (
                                        <>
                                            <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setSettling(true)}>
                                                Settle bill
                                            </Button>
                                            {selected.status !== "SERVED" && (
                                                <Button variant="outline" onClick={() => setStatus(selected, "SERVED")}>
                                                    Mark served
                                                </Button>
                                            )}
                                            <Button variant="ghost" className="text-destructive" onClick={() => setStatus(selected, "CANCELLED")}>
                                                Cancel order
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="outline" onClick={() => window.print()}>
                                        <Printer /> Print
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {selected && (
                <PaymentDialog
                    open={settling}
                    onOpenChange={setSettling}
                    title={`Settle ${formatOrderNumber(selected.orderNumber)}`}
                    subtotal={selected.subtotal}
                    amountDue={selected.subtotal + selected.taxAmount}
                    money={money}
                    onConfirm={async (payment) => {
                        try {
                            await api(`/api/orders/${selected.id}/pay`, { method: "POST", json: payment });
                            toast.success("Payment recorded");
                            setSettling(false);
                            refresh();
                        } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Payment failed");
                            throw e;
                        }
                    }}
                />
            )}
        </div>
    );
}
