"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Minus, MessageSquarePlus, Plus, Printer, Search, ShoppingBag, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, StatusBadge } from "@/components/shared";
import { PaymentDialog, type PaymentResult } from "@/components/pos/payment-dialog";
import { Receipt } from "@/components/pos/receipt";
import { useMoney, useWorkspace } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { computeTotals, effectivePrice } from "@/lib/pricing";
import { cn, elapsed, formatOrderNumber } from "@/lib/utils";
import type { DiningTable, MenuCategory, MenuItem, Order, OrderStatus } from "@/types";

type Tab = "new" | "tickets" | "tables";
interface CartLine {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes: string;
}

const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
    PENDING: { to: "PREPARING", label: "Start cooking" },
    PREPARING: { to: "READY", label: "Mark ready" },
    READY: { to: "SERVED", label: "Mark served" },
};

export default function POSPage() {
    const { user, restaurant } = useWorkspace();
    const money = useMoney();
    const queryClient = useQueryClient();
    const searchRef = useRef<HTMLInputElement>(null);

    const [tab, setTab] = useState<Tab>("new");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [cart, setCart] = useState<CartLine[]>([]);
    const [tableId, setTableId] = useState<string>("none");
    const [customerName, setCustomerName] = useState("");
    const [noteFor, setNoteFor] = useState<CartLine | null>(null);
    const [noteDraft, setNoteDraft] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [charging, setCharging] = useState(false);
    const [settling, setSettling] = useState<Order | null>(null);
    const [receipt, setReceipt] = useState<Order | null>(null);
    const [cartOpenMobile, setCartOpenMobile] = useState(false);

    const menu = useQuery({
        queryKey: ["/api/menu"],
        queryFn: getJson<{ categories: MenuCategory[]; menuItems: MenuItem[] }>("/api/menu"),
    });
    const tables = useQuery({
        queryKey: ["/api/tables"],
        queryFn: getJson<DiningTable[]>("/api/tables"),
        refetchInterval: 20_000,
    });
    const tickets = useQuery({
        queryKey: ["/api/orders?scope=open"],
        queryFn: getJson<Order[]>("/api/orders?scope=open"),
        refetchInterval: 10_000,
    });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
            if (e.key === "F2") {
                e.preventDefault();
                setTab("new");
                setTimeout(() => searchRef.current?.focus(), 0);
            } else if (e.key === "/" && !typing) {
                e.preventDefault();
                setTab("new");
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const categories = useMemo(
        () => (menu.data?.categories ?? []).filter((c) => c.isActive && menu.data!.menuItems.some((i) => i.categoryId === c.id)),
        [menu.data]
    );

    const visibleItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (menu.data?.menuItems ?? []).filter(
            (i) =>
                (category === "all" || (category === "featured" ? i.isFeatured : i.categoryId === category)) &&
                (!q || i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q))
        );
    }, [menu.data, search, category]);

    const qtyById = useMemo(() => new Map(cart.map((l) => [l.menuItemId, l.quantity])), [cart]);
    const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
    const totals = computeTotals(subtotal, restaurant.taxRate);
    const itemCount = cart.reduce((s, l) => s + l.quantity, 0);

    const add = (item: MenuItem) => {
        if (!item.isAvailable) return;
        setCart((prev) => {
            const existing = prev.find((l) => l.menuItemId === item.id && !l.notes);
            if (existing) return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
            return [...prev, { menuItemId: item.id, name: item.name, price: effectivePrice(item), quantity: 1, notes: "" }];
        });
    };
    const changeQty = (line: CartLine, delta: number) =>
        setCart((prev) =>
            prev.flatMap((l) => (l === line ? (l.quantity + delta <= 0 ? [] : [{ ...l, quantity: l.quantity + delta }]) : [l]))
        );

    const resetOrder = () => {
        setCart([]);
        setTableId("none");
        setCustomerName("");
        setCartOpenMobile(false);
    };

    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/orders?scope=open"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    };

    const submitOrder = async (payment?: PaymentResult) => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            const order = await api<Order>("/api/orders", {
                method: "POST",
                json: {
                    tableId: tableId === "none" ? null : tableId,
                    customerName,
                    items: cart.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, notes: l.notes })),
                    payment,
                },
            });
            toast.success(payment ? `Order ${formatOrderNumber(order.orderNumber)} paid` : `Order ${formatOrderNumber(order.orderNumber)} sent to the kitchen`);
            resetOrder();
            refreshAll();
            if (payment) setReceipt(order);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't place the order");
            throw e;
        } finally {
            setSubmitting(false);
        }
    };

    const advance = async (order: Order, to: OrderStatus) => {
        try {
            await api(`/api/orders/${order.id}`, { method: "PATCH", json: { status: to } });
            refreshAll();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't update the order");
        }
    };

    const settle = async (order: Order, payment: PaymentResult) => {
        try {
            const paid = await api<Order>(`/api/orders/${order.id}/pay`, { method: "POST", json: payment });
            toast.success(`${formatOrderNumber(paid.orderNumber)} settled`);
            setSettling(null);
            refreshAll();
            setReceipt(paid);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Payment failed");
            throw e;
        }
    };

    const openTickets = tickets.data ?? [];

    const cartPanel = (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Order</h2>
                {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={resetOrder} className="text-muted-foreground">
                        <Trash2 /> Clear
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Table</span>
                    <Select value={tableId} onValueChange={setTableId}>
                        <SelectTrigger className="h-11 w-full" aria-label="Table">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Takeaway / counter</SelectItem>
                            {(tables.data ?? []).map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.label} · {t.capacity} seats{t.status !== "AVAILABLE" ? ` · ${t.status.toLowerCase()}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Guest name</span>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" className="h-11" />
                </label>
            </div>

            <div className="-mx-1 flex-1 overflow-y-auto px-1">
                {cart.length === 0 ? (
                    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                        <ShoppingBag className="size-6" />
                        Tap a dish to add it.
                    </div>
                ) : (
                    <ul className="divide-y">
                        {cart.map((line, i) => (
                            <li key={`${line.menuItemId}-${i}`} className="flex items-center gap-2 py-2.5">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[15px]">{line.name}</p>
                                    {line.notes ? (
                                        <button type="button" onClick={() => { setNoteFor(line); setNoteDraft(line.notes); }} className="text-left text-xs text-brand">
                                            {line.notes}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { setNoteFor(line); setNoteDraft(""); }}
                                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <MessageSquarePlus className="size-3" /> Add note
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="size-9" aria-label={`Remove one ${line.name}`} onClick={() => changeQty(line, -1)}>
                                        <Minus />
                                    </Button>
                                    <span className="w-6 text-center font-mono">{line.quantity}</span>
                                    <Button variant="outline" size="icon" className="size-9" aria-label={`Add one ${line.name}`} onClick={() => changeQty(line, 1)}>
                                        <Plus />
                                    </Button>
                                </div>
                                <span className="w-20 text-right font-mono text-sm">{money(line.price * line.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-dashed pt-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">{money(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax ({restaurant.taxRate}%)</span>
                    <span className="font-mono">{money(totals.taxAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 text-xl font-semibold text-foreground">
                    <span>Total</span>
                    <span className="font-mono">{money(totals.totalAmount)}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                <Button variant="outline" className="h-14 text-[15px]" disabled={cart.length === 0 || submitting} onClick={() => submitOrder().catch(() => {})}>
                    {submitting && <Loader2 className="animate-spin" />}
                    Send to kitchen
                </Button>
                <Button
                    className="h-14 bg-brand text-[15px] text-brand-foreground hover:bg-brand/90"
                    disabled={cart.length === 0 || submitting}
                    onClick={() => setCharging(true)}
                >
                    Charge {money(totals.totalAmount)}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-dvh flex-col">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <Button asChild variant="secondary" size="icon" className="size-11" aria-label="Back to dashboard">
                        <Link href="/dashboard">
                            <ChevronLeft className="size-5" />
                        </Link>
                    </Button>
                    <span className="font-display text-xl font-extrabold">Point of sale</span>
                </div>
                <div role="tablist" aria-label="POS views" className="order-last flex w-full gap-1 rounded-xl bg-secondary p-1 sm:order-none sm:w-auto">
                    {(
                        [
                            ["new", "New order"],
                            ["tickets", `Open tickets · ${openTickets.length}`],
                            ["tables", "Tables"],
                        ] as const
                    ).map(([id, label]) => (
                        <button
                            key={id}
                            role="tab"
                            type="button"
                            aria-selected={tab === id}
                            onClick={() => setTab(id)}
                            className={cn(
                                "min-h-10 flex-1 rounded-lg px-4 text-sm whitespace-nowrap transition-colors sm:flex-none",
                                tab === id ? "bg-foreground font-semibold text-background" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-muted-foreground">
                    {user.name} · <span className="capitalize">{user.role.toLowerCase()}</span>
                </span>
            </header>

            {tab === "new" && (
                <div className="flex min-h-0 flex-1">
                    <section className="flex min-w-0 flex-1 flex-col gap-4 p-4 pb-28 sm:p-5 lg:pb-5">
                        <label className="flex min-h-12 items-center gap-2.5 rounded-xl bg-secondary px-3.5">
                            <Search className="size-4 text-muted-foreground" />
                            <span className="sr-only">Search menu</span>
                            <input
                                ref={searchRef}
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search dishes or SKU  ( / )"
                                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                            {[{ id: "all", name: "All" }, { id: "featured", name: "Featured" }, ...categories].map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCategory(c.id)}
                                    aria-pressed={category === c.id}
                                    className={cn(
                                        "min-h-11 shrink-0 rounded-full px-4 text-sm whitespace-nowrap transition-colors",
                                        category === c.id ? "bg-brand font-semibold text-brand-foreground" : "border hover:bg-secondary"
                                    )}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>

                        {menu.isLoading ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <Skeleton key={i} className="h-28 rounded-xl" />
                                ))}
                            </div>
                        ) : visibleItems.length === 0 ? (
                            <EmptyState
                                icon={Utensils}
                                title={menu.data?.menuItems.length ? "No dishes match" : "Your menu is empty"}
                                description={menu.data?.menuItems.length ? "Try another search or category." : "Add dishes in the menu editor to start taking orders."}
                                action={
                                    !menu.data?.menuItems.length && user.role !== "STAFF" ? (
                                        <Button asChild variant="outline">
                                            <Link href="/dashboard/menu?new=1">Add a dish</Link>
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                                {visibleItems.map((item) => {
                                    const qty = qtyById.get(item.id);
                                    const price = effectivePrice(item);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            disabled={!item.isAvailable}
                                            onClick={() => add(item)}
                                            className={cn(
                                                "flex min-h-28 flex-col justify-between rounded-xl border-2 p-3.5 text-left transition-colors active:scale-[0.98]",
                                                !item.isAvailable
                                                    ? "cursor-not-allowed border-dashed border-border bg-transparent text-muted-foreground"
                                                    : qty
                                                      ? "border-brand bg-card"
                                                      : "border-card bg-card hover:border-input"
                                            )}
                                        >
                                            <span className="line-clamp-2 text-[15px] font-semibold">{item.name}</span>
                                            {item.isAvailable ? (
                                                <span className="flex w-full items-end justify-between">
                                                    <span className="font-mono text-[15px]">
                                                        {price < item.price && <s className="mr-1.5 text-xs text-muted-foreground">{money(item.price)}</s>}
                                                        {money(price)}
                                                    </span>
                                                    {qty && <span className="font-mono text-sm text-brand">×{qty}</span>}
                                                </span>
                                            ) : (
                                                <span className="text-sm">Sold out</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <aside aria-label="Current order" className="hidden w-[380px] shrink-0 border-l bg-card p-5 lg:block">
                        {cartPanel}
                    </aside>

                    {/* Phones and small tablets: order summary bar opens the cart as a sheet. */}
                    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card p-3 lg:hidden">
                        <Button className="h-14 w-full justify-between bg-brand px-5 text-base text-brand-foreground hover:bg-brand/90" onClick={() => setCartOpenMobile(true)}>
                            <span>View order · {itemCount} items</span>
                            <span className="font-mono">{money(totals.totalAmount)}</span>
                        </Button>
                    </div>
                    <Dialog open={cartOpenMobile} onOpenChange={setCartOpenMobile}>
                        <DialogContent className="flex h-[90dvh] flex-col sm:max-w-lg">
                            <DialogTitle className="sr-only">Current order</DialogTitle>
                            {cartPanel}
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {tab === "tickets" && (
                <section className="flex-1 p-4 sm:p-5">
                    {tickets.isLoading ? (
                        <Skeleton className="h-40 rounded-xl" />
                    ) : openTickets.length === 0 ? (
                        <EmptyState icon={ShoppingBag} title="No open tickets" description="Orders sent to the kitchen stay here until they're paid." />
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                            {openTickets.map((order) => {
                                const next = NEXT_STATUS[order.status];
                                return (
                                    <article key={order.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-mono font-semibold">
                                                    {formatOrderNumber(order.orderNumber)} · {order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.customerName ? `${order.customerName} · ` : ""}
                                                    {elapsed(order.createdAt)} ago
                                                </p>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <ul className="text-sm">
                                            {order.items.map((i) => (
                                                <li key={i.id} className="flex justify-between gap-2">
                                                    <span>
                                                        <span className="font-mono text-brand">{i.quantity}</span> {i.name}
                                                        {i.notes && <span className="block pl-5 text-xs text-muted-foreground">{i.notes}</span>}
                                                    </span>
                                                    <span className="font-mono text-muted-foreground">{money(i.price * i.quantity)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-auto flex items-center justify-between border-t pt-3">
                                            <span className="font-mono font-semibold">{money(order.totalAmount)}</span>
                                            <div className="flex gap-2">
                                                {next && (
                                                    <Button variant="outline" size="sm" className="h-10" onClick={() => advance(order, next.to)}>
                                                        {next.label}
                                                    </Button>
                                                )}
                                                <Button size="sm" className="h-10 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setSettling(order)}>
                                                    Settle
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {tab === "tables" && (
                <section className="flex-1 p-4 sm:p-5">
                    {tables.isLoading ? (
                        <Skeleton className="h-40 rounded-xl" />
                    ) : (tables.data ?? []).length === 0 ? (
                        <EmptyState
                            icon={Utensils}
                            title="No tables yet"
                            description="Add your floor layout under Tables & QR."
                            action={
                                <Button asChild variant="outline">
                                    <Link href="/dashboard/tables">Set up tables</Link>
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                            {tables.data!.map((t) => {
                                const open = t.orders ?? [];
                                const due = open.reduce((s, o) => s + o.totalAmount, 0);
                                const busy = open.length > 0;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            setTableId(t.id);
                                            setTab(busy ? "tickets" : "new");
                                        }}
                                        className={cn(
                                            "flex min-h-32 flex-col justify-between rounded-xl border-2 p-4 text-left transition-colors",
                                            busy ? "border-brand bg-brand-soft" : "border-card bg-card hover:border-input"
                                        )}
                                    >
                                        <span className="flex w-full items-start justify-between">
                                            <span className="font-display text-2xl font-bold">{t.label}</span>
                                            <span className="text-xs text-muted-foreground">{t.capacity} seats</span>
                                        </span>
                                        {busy ? (
                                            <span className="text-sm">
                                                <span className="block font-mono font-semibold">{money(due)}</span>
                                                <span className="text-muted-foreground">
                                                    {open.length} ticket{open.length > 1 ? "s" : ""} · {elapsed(open[0].createdAt)}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground capitalize">{t.status.toLowerCase()}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            <PaymentDialog
                open={charging}
                onOpenChange={setCharging}
                title="Charge order"
                subtotal={totals.subtotal}
                amountDue={totals.totalAmount}
                money={money}
                onConfirm={async (payment) => {
                    await submitOrder(payment);
                    setCharging(false);
                }}
            />
            <PaymentDialog
                open={!!settling}
                onOpenChange={(o) => !o && setSettling(null)}
                title={settling ? `Settle ${formatOrderNumber(settling.orderNumber)}` : "Settle"}
                subtotal={settling?.subtotal ?? 0}
                amountDue={settling ? settling.subtotal + settling.taxAmount : 0}
                money={money}
                onConfirm={(payment) => settle(settling!, payment)}
            />

            <Dialog open={!!noteFor} onOpenChange={(o) => !o && setNoteFor(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Note for {noteFor?.name}</DialogTitle>
                    </DialogHeader>
                    <Input
                        autoFocus
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="e.g. no onions, medium rare"
                        className="h-11"
                        maxLength={200}
                    />
                    <div className="flex flex-wrap gap-2">
                        {["No onions", "Gluten free", "Extra spicy", "Allergy — see server"].map((preset) => (
                            <Button key={preset} variant="outline" size="sm" onClick={() => setNoteDraft(preset)}>
                                {preset}
                            </Button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setCart((prev) => prev.map((l) => (l === noteFor ? { ...l, notes: noteDraft.trim() } : l)));
                                setNoteFor(null);
                            }}
                        >
                            Save note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Payment complete</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60dvh] overflow-y-auto rounded-lg">
                        {receipt && <Receipt order={receipt} restaurantName={restaurant.name} money={money} />}
                    </div>
                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer /> Print receipt
                        </Button>
                        <Button onClick={() => setReceipt(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
