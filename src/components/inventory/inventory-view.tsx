"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PageHeader } from "@/components/shared";
import { useCan, useMoney } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { InventoryItem, TransactionType } from "@/types";

type Filter = "all" | "low" | "out";
const EMPTY_ITEM = { name: "", quantity: "0", unit: "kg", minimumQuantity: "0", costPerUnit: "0" };
const TX_LABEL: Record<TransactionType, string> = { ADD: "Stock in", REMOVE: "Used", WASTE: "Wasted" };

function stockState(i: InventoryItem) {
    if (i.quantity <= 0) return { label: "Out", className: "bg-danger-soft text-destructive", bar: "bg-destructive" };
    if (i.quantity <= i.minimumQuantity) return { label: "Low", className: "bg-warning-soft text-warning", bar: "bg-brand" };
    return { label: "OK", className: "bg-success-soft text-success", bar: "bg-success" };
}

export function InventoryView() {
    const money = useMoney();
    const can = useCan();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<Filter>("all");
    const [search, setSearch] = useState("");
    const [itemForm, setItemForm] = useState<typeof EMPTY_ITEM & { id?: string }>(EMPTY_ITEM);
    const [itemOpen, setItemOpen] = useState(false);
    const [txFor, setTxFor] = useState<InventoryItem | null>(null);
    const [tx, setTx] = useState({ type: "ADD" as TransactionType, quantity: "", notes: "" });
    const [saving, setSaving] = useState(false);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["/api/inventory"],
        queryFn: getJson<InventoryItem[]>("/api/inventory"),
    });

    const low = items.filter((i) => i.quantity > 0 && i.quantity <= i.minimumQuantity).length;
    const out = items.filter((i) => i.quantity <= 0).length;
    const value = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter(
            (i) =>
                (filter === "all" || (filter === "out" ? i.quantity <= 0 : i.quantity > 0 && i.quantity <= i.minimumQuantity)) &&
                (!q || i.name.toLowerCase().includes(q))
        );
    }, [items, filter, search]);

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    };

    const saveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { id, ...body } = itemForm;
            await api(id ? `/api/inventory/${id}` : "/api/inventory", { method: id ? "PATCH" : "POST", json: body });
            toast.success(id ? "Item updated" : "Item added");
            setItemOpen(false);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save the item");
        } finally {
            setSaving(false);
        }
    };

    const saveTx = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!txFor) return;
        setSaving(true);
        try {
            await api(`/api/inventory/${txFor.id}/transactions`, { method: "POST", json: tx });
            toast.success(`${TX_LABEL[tx.type]}: ${tx.quantity} ${txFor.unit} of ${txFor.name}`);
            setTxFor(null);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't record that");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (item: InventoryItem) => {
        if (!confirm(`Delete ${item.name} and its history?`)) return;
        try {
            await api(`/api/inventory/${item.id}`, { method: "DELETE" });
            toast.success("Item deleted");
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't delete the item");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Inventory"
                description={`${items.length} items · ${money(value)} on hand`}
                actions={
                    can.manage && (
                        <Button
                            onClick={() => {
                                setItemForm(EMPTY_ITEM);
                                setItemOpen(true);
                            }}
                        >
                            <Plus /> Add item
                        </Button>
                    )
                }
            />

            <div className="flex flex-wrap items-center gap-3">
                <div role="tablist" aria-label="Stock filter" className="flex gap-1 rounded-lg bg-muted p-1">
                    {(
                        [
                            ["all", `All · ${items.length}`],
                            ["low", `Low · ${low}`],
                            ["out", `Out · ${out}`],
                        ] as const
                    ).map(([id, label]) => (
                        <button
                            key={id}
                            role="tab"
                            type="button"
                            aria-selected={filter === id}
                            onClick={() => setFilter(id)}
                            className={cn("min-h-9 rounded-md px-3.5 text-sm", filter === id ? "bg-card font-medium shadow-sm" : "text-muted-foreground")}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <label className="relative ml-auto w-full sm:w-72">
                    <span className="sr-only">Search inventory</span>
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredients" className="h-11 pl-9" />
                </label>
            </div>

            {isLoading ? (
                <Skeleton className="h-96 rounded-xl" />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title={items.length ? "Nothing in this view" : "No stock tracked yet"}
                    description={items.length ? undefined : "Add the ingredients you want low-stock alerts for."}
                />
            ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Item</th>
                                <th className="px-4 py-3 font-medium">On hand</th>
                                <th className="w-48 px-4 py-3 font-medium">Level</th>
                                <th className="px-4 py-3 font-medium">Value</th>
                                <th className="px-4 py-3 font-medium">Last change</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((i) => {
                                const state = stockState(i);
                                const pct = Math.min(100, i.minimumQuantity > 0 ? (i.quantity / (i.minimumQuantity * 2)) * 100 : 100);
                                const last = i.transactions[0];
                                return (
                                    <tr key={i.id} className="border-b last:border-0">
                                        <td className="px-4 py-3 font-medium">{i.name}</td>
                                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                                            {i.quantity} {i.unit} <span className="text-muted-foreground">/ min {i.minimumQuantity}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 rounded-full bg-muted">
                                                    <div className={cn("h-1.5 rounded-full", state.bar)} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", state.className)}>{state.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono">{money(i.quantity * i.costPerUnit)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {last ? `${TX_LABEL[last.type]} ${last.quantity} · ${formatDistanceToNow(new Date(last.createdAt), { addSuffix: true })}` : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setTx({ type: "ADD", quantity: "", notes: "" });
                                                        setTxFor(i);
                                                    }}
                                                >
                                                    Adjust
                                                </Button>
                                                {can.manage && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            aria-label={`Edit ${i.name}`}
                                                            onClick={() => {
                                                                setItemForm({
                                                                    id: i.id,
                                                                    name: i.name,
                                                                    quantity: String(i.quantity),
                                                                    unit: i.unit,
                                                                    minimumQuantity: String(i.minimumQuantity),
                                                                    costPerUnit: String(i.costPerUnit),
                                                                });
                                                                setItemOpen(true);
                                                            }}
                                                        >
                                                            <Pencil />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" aria-label={`Delete ${i.name}`} onClick={() => remove(i)}>
                                                            <Trash2 />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={saveItem} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>{itemForm.id ? "Edit item" : "Add inventory item"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 flex flex-col gap-2">
                                <Label htmlFor="i-name">Name</Label>
                                <Input id="i-name" required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                            </div>
                            {!itemForm.id && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="i-qty">Starting quantity</Label>
                                    <Input id="i-qty" type="number" min={0} step="any" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="i-unit">Unit</Label>
                                <Input id="i-unit" required value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="kg, L, pcs" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="i-min">Alert below</Label>
                                <Input id="i-min" type="number" min={0} step="any" value={itemForm.minimumQuantity} onChange={(e) => setItemForm({ ...itemForm, minimumQuantity: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="i-cost">Cost per unit</Label>
                                <Input id="i-cost" type="number" min={0} step="0.01" value={itemForm.costPerUnit} onChange={(e) => setItemForm({ ...itemForm, costPerUnit: e.target.value })} />
                            </div>
                        </div>
                        {itemForm.id && <p className="text-xs text-muted-foreground">Change the quantity with Adjust so every movement is logged.</p>}
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="animate-spin" />} Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!txFor} onOpenChange={(o) => !o && setTxFor(null)}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={saveTx} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>Adjust {txFor?.name}</DialogTitle>
                            <DialogDescription>
                                On hand: {txFor?.quantity} {txFor?.unit}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(TX_LABEL) as TransactionType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    aria-pressed={tx.type === t}
                                    onClick={() => setTx({ ...tx, type: t })}
                                    className={cn("min-h-11 rounded-lg border text-sm", tx.type === t ? "border-brand bg-brand-soft font-medium" : "hover:bg-muted")}
                                >
                                    {TX_LABEL[t]}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="tx-qty">Quantity ({txFor?.unit})</Label>
                            <Input id="tx-qty" type="number" min={0} step="any" required autoFocus value={tx.quantity} onChange={(e) => setTx({ ...tx, quantity: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="tx-notes">Note</Label>
                            <Input id="tx-notes" value={tx.notes} onChange={(e) => setTx({ ...tx, notes: e.target.value })} placeholder="Supplier delivery, spoiled, etc." />
                        </div>
                        {txFor && txFor.transactions.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-medium text-muted-foreground">Recent movements</p>
                                <ul className="max-h-36 overflow-y-auto text-sm">
                                    {txFor.transactions.map((t) => (
                                        <li key={t.id} className="flex justify-between border-b py-1.5 last:border-0">
                                            <span>
                                                {TX_LABEL[t.type]} <span className="font-mono">{t.type === "ADD" ? "+" : "−"}{t.quantity}</span>
                                                {t.notes && <span className="text-muted-foreground"> · {t.notes}</span>}
                                            </span>
                                            <span className="text-muted-foreground">{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="animate-spin" />} Record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
